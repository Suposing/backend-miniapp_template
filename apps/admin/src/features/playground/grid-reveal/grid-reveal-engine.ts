/**
 * Grid Reveal 的 canvas 引擎（逻辑逐字移植自 rare-ui `grid-reveal`，MIT）：
 * 二分网格树构建 / 图片均色采样 / 按细节度重排拆分顺序 / 逐帧绘制。
 * 与框架无关，组件层（GridReveal.vue）只负责 RAF、观察器与说明条。
 */

export const CELLS = 180;
const OPENING_CELLS = 4;

/**
 * 进度上限：保证拆分永远不会先于图片完成
 */
export const HOLD = 0.9;
/**
 * 等待图片时网格停在这里，给「图片到达」留出余量
 */
export const WAIT_CAP = 0.72;
const LAST_SPLIT = 0.92;
/**
 * 单个格子分离所需的进度长度
 */
const MORPH = 0.055;

export const SAMPLE = 128;
export const COLOR_MS = 420;
const GUTTER_FROM = 0.35;
const GUTTER_TO = 0.75;
const PHOTO_FROM = 0.93;

/**
 * 网格揭示演示中的单个网格颜色与亮度数据。
 */
export type Cell = {
    /**
     * 网格起点坐标，相对画布归一到 0–1。
     */
    x: number;
    /**
     * 网格起点坐标，相对画布归一到 0–1。
     */
    y: number;
    /**
     * 网格横向尺寸，相对画布归一到 0–1。
     */
    w: number;
    /**
     * 网格纵向尺寸，相对画布归一到 0–1。
     */
    h: number;
    /**
     * 采样颜色的红色分量，范围 0–255。
     */
    r: number;
    /**
     * 采样颜色的绿色分量，范围 0–255。
     */
    g: number;
    /**
     * 采样颜色的蓝色分量，范围 0–255。
     */
    b: number;
    /**
     * 网格无图片颜色时使用的稳定明暗系数。
     */
    tone: number;
    /**
     * 采样亮度方差，用于优先拆分细节较多的网格。
     */
    detail: number;
    /**
     * 开始拆分此网格的归一化动画进度。
     */
    splitAt: number;
    /**
     * 父级节点；null 表示根节点。
     */
    parent: Cell | null;
    /**
     * 网格拆分后的两个子格；null 表示未拆分叶节点。
     */
    kids: [Cell, Cell] | null;
};

type Sums = {
    n: number;
    r: number;
    g: number;
    b: number;
    l: number;
    l2: number;
};

// 用比较写法：NaN 会落到 0
/**
 * 将进度限制为 0–1；NaN 和非正值回退为 0。
 */
export const clamp01 = (n: number) => (n > 0 ? (n < 1 ? n : 1) : 0);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * 在给定起止进度之间计算 0–1 的平滑插值。
 */
export function smoothstep(a: number, b: number, x: number) {
    const t = clamp01((x - a) / (b - a));

    return t * t * (3 - 2 * t);
}

/**
 * 自走进度：永远到不了上限，估时超出后仍会缓慢爬升
 */
export function selfPaced(elapsed: number, duration: number) {
    const span = duration > 0 ? duration : 1;

    return HOLD * (1 - Math.exp(-elapsed / span));
}

function hash(x: number, y: number, z: number) {
    const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;

    return n - Math.floor(n);
}

function makeCell(
    x: number,
    y: number,
    w: number,
    h: number,
    parent: Cell | null,
): Cell {
    return {
        x,
        y,
        w,
        h,
        r: 0,
        g: 0,
        b: 0,
        tone: hash(x + 3.1, y + 1.7, w * 31.7),
        detail: 0,
        splitAt: 0,
        parent,
        kids: null,
    };
}

/**
 * 每次拆最大的格子：格子保持近似方形，数量一次增一
 */
export function buildTree(aspect: number) {
    const root = makeCell(0, 0, 1, 1, null);
    const leaves: Cell[] = [root];
    const branches: Cell[] = [];

    while (leaves.length < CELLS) {
        let pick = 0;
        let widest = -1;

        for (let i = 0; i < leaves.length; i++) {
            const c = leaves[i];
            // 抖动只用于同尺寸格子间打破平局
            const area = c.w * aspect * c.h * (1 + 0.12 * hash(c.x, c.y, 7.3));

            if (area > widest) {
                widest = area;
                pick = i;
            }
        }

        const parent = leaves.splice(pick, 1)[0];
        const wide = parent.w * aspect >= parent.h;
        const half = wide ? parent.w / 2 : parent.h / 2;
        const a = wide
            ? makeCell(parent.x, parent.y, half, parent.h, parent)
            : makeCell(parent.x, parent.y, parent.w, half, parent);
        const b = wide
            ? makeCell(parent.x + half, parent.y, half, parent.h, parent)
            : makeCell(parent.x, parent.y + half, parent.w, half, parent);

        parent.kids = [a, b];
        branches.push(parent);
        leaves.push(a, b);
    }

    const opening = OPENING_CELLS - 1;
    const rest = Math.max(1, branches.length - opening);

    // 开场的几次拆分放在 0 之前：首帧那些格子就已分开
    branches.forEach((cell, i) => {
        cell.splitAt =
            i < opening ? -MORPH : (LAST_SPLIT * (i - opening + 1)) / rest;
    });

    return { root, branches };
}

/**
 * 每格均色 + 亮度方差（决定谁先拆）
 */
function measureTree(root: Cell, pixels: Uint8ClampedArray, size: number) {
    const gather = (cell: Cell): Sums => {
        let s: Sums;

        if (cell.kids) {
            const a = gather(cell.kids[0]);
            const b = gather(cell.kids[1]);

            s = {
                n: a.n + b.n,
                r: a.r + b.r,
                g: a.g + b.g,
                b: a.b + b.b,
                l: a.l + b.l,
                l2: a.l2 + b.l2,
            };
        } else {
            s = { n: 0, r: 0, g: 0, b: 0, l: 0, l2: 0 };
            const x0 = Math.round(cell.x * size);
            const y0 = Math.round(cell.y * size);
            const x1 = Math.max(x0 + 1, Math.round((cell.x + cell.w) * size));
            const y1 = Math.max(y0 + 1, Math.round((cell.y + cell.h) * size));

            for (let y = y0; y < y1; y++) {
                for (let x = x0; x < x1; x++) {
                    const i = (y * size + x) * 4;
                    const r = pixels[i];
                    const g = pixels[i + 1];
                    const b = pixels[i + 2];
                    const l = 0.299 * r + 0.587 * g + 0.114 * b;

                    s.n++;
                    s.r += r;
                    s.g += g;
                    s.b += b;
                    s.l += l;
                    s.l2 += l * l;
                }
            }
        }

        const n = s.n || 1;

        cell.r = s.r / n;
        cell.g = s.g / n;
        cell.b = s.b / n;
        cell.detail = Math.max(0, s.l2 / n - (s.l / n) * (s.l / n));

        return s;
    };

    gather(root);
}

/**
 * 复用同一组时间槽只改顺序：节奏不变，细节多的先拆
 */
function orderByDetail(branches: Cell[], openedBefore: number) {
    const pending = branches.filter((c) => c.splitAt > openedBefore);

    if (pending.length < 2) return;

    const slots = pending.map((c) => c.splitAt).sort((a, b) => a - b);
    const queue = pending.filter(
        (c) => !c.parent || c.parent.splitAt <= openedBefore,
    );

    let next = 0;

    while (queue.length && next < slots.length) {
        let pick = 0;

        for (let i = 1; i < queue.length; i++) {
            if (queue[i].detail > queue[pick].detail) pick = i;
        }
        const cell = queue.splice(pick, 1)[0];

        cell.splitAt = slots[next++];
        for (const kid of cell.kids ?? []) {
            if (kid.kids) queue.push(kid);
        }
    }
}

/**
 * 按等比覆盖策略计算图片在目标画布中的绘制位置和尺寸，居中裁掉超出部分。
 */
export function coverRect(iw: number, ih: number, w: number, h: number) {
    const s = Math.max(w / iw, h / ih);

    return {
        dx: (w - iw * s) / 2,
        dy: (h - ih * s) / 2,
        dw: iw * s,
        dh: ih * s,
    };
}

/**
 * 网格揭示演示的画布绘制配置。
 */
export type Scene = {
    /**
     * 用于当前帧绘制的 Canvas 2D 上下文。
     */
    ctx: CanvasRenderingContext2D;
    /**
     * 网格树的根节点。
     */
    root: Cell;
    /**
     * 画布实际像素宽度，已包含设备像素比。
     */
    width: number;
    /**
     * 画布实际像素高度，已包含设备像素比。
     */
    height: number;
    /**
     * 当前画布设备像素比，供网格间隙按屏幕尺寸缩放。
     */
    scale: number;
    /**
     * 是否使用深色配色。
     */
    dark: boolean;
    /**
     * performance.now() 对应的当前帧时刻，单位为毫秒。
     */
    clock: number;
    /**
     * 当前网格拆分进度。
     */
    split: number;
    /**
     * 图片颜色混合的归一化进度。
     */
    fade: number;
    /**
     * 网格树是否已完成图片颜色采样。
     */
    hasColors: boolean;
    /**
     * 最终展示的图片源。
     */
    image: HTMLImageElement | null;
};

function greyOf(tone: number, dark: boolean, clock: number) {
    return (
        (dark ? 30 : 228) + tone * 13 + Math.sin(clock * 1.5 + tone * 6.28) * 3
    );
}

type Patch = {
    x: number;
    y: number;
    w: number;
    h: number;
    r: number;
    g: number;
    b: number;
    tone: number;
};

/**
 * 绘制一帧网格拆分和图片淡入；复用传入的画布上下文，不负责调度动画。
 */
export function drawScene(s: Scene) {
    const { ctx, root, width, height, split } = s;
    // 拿不到像素时网格保持灰色，但图片仍在下层淡入
    const tint = s.hasColors ? s.fade : 0;
    const shade = (grey: number, target: number) =>
        Math.round(mix(grey, target, tint));
    const base = greyOf(root.tone, s.dark, s.clock);

    // 缝隙陷入这层底色，而不是透到后面的表面
    ctx.fillStyle = `rgb(${Math.round(shade(base, root.r) * 0.92)},${Math.round(
        shade(base, root.g) * 0.92,
    )},${Math.round(shade(base, root.b) * 0.92)})`;
    ctx.fillRect(0, 0, width, height);

    const soft = 1 - smoothstep(GUTTER_FROM, GUTTER_TO, split);
    const gutter = s.scale * soft;
    const rounded = soft > 0.01 && typeof ctx.roundRect === 'function';

    const paint = (p: Patch) => {
        // 吸附到整像素，相邻格子无缝
        const x = Math.round(p.x);
        const y = Math.round(p.y);
        const w = Math.round(p.x + p.w) - x;
        const h = Math.round(p.y + p.h) - y;

        const onLeft = x <= 0;
        const onTop = y <= 0;
        const onRight = x + w >= width;
        const onBottom = y + h >= height;

        // 只有内侧边缘有缝隙，外轮廓保持为画框
        const left = onLeft ? 0 : gutter;
        const top = onTop ? 0 : gutter;
        const innerW = w - left - (onRight ? 0 : gutter);
        const innerH = h - top - (onBottom ? 0 : gutter);

        if (innerW <= 0 || innerH <= 0) return;

        const grey = greyOf(p.tone, s.dark, s.clock);

        ctx.fillStyle = `rgb(${shade(grey, p.r)},${shade(grey, p.g)},${shade(grey, p.b)})`;

        if (rounded) {
            const radius = Math.min(innerW, innerH) * 0.12 * soft;

            ctx.beginPath();
            ctx.roundRect(x + left, y + top, innerW, innerH, [
                !onLeft && !onTop ? radius : 0,
                !onRight && !onTop ? radius : 0,
                !onRight && !onBottom ? radius : 0,
                !onLeft && !onBottom ? radius : 0,
            ]);
            ctx.fill();
        } else {
            ctx.fillRect(x + left, y + top, innerW, innerH);
        }
    };

    const walk = (cell: Cell, p: Patch) => {
        if (!cell.kids || split < cell.splitAt) {
            paint(p);

            return;
        }
        // 子格从父格矩形起步，逐渐分离到各自位置
        const t = easeOut(clamp01((split - cell.splitAt) / MORPH));

        for (const kid of cell.kids) {
            walk(kid, {
                x: mix(p.x, kid.x * width, t),
                y: mix(p.y, kid.y * height, t),
                w: mix(p.w, kid.w * width, t),
                h: mix(p.h, kid.h * height, t),
                r: mix(p.r, kid.r, t),
                g: mix(p.g, kid.g, t),
                b: mix(p.b, kid.b, t),
                tone: mix(p.tone, kid.tone, t),
            });
        }
    };

    walk(root, {
        x: 0,
        y: 0,
        w: width,
        h: height,
        r: root.r,
        g: root.g,
        b: root.b,
        tone: root.tone,
    });

    if (!s.image) return;
    const photo = s.hasColors
        ? smoothstep(PHOTO_FROM, 1, split) * s.fade
        : s.fade;

    if (photo <= 0.002) return;

    const fit = coverRect(
        s.image.naturalWidth,
        s.image.naturalHeight,
        width,
        height,
    );

    ctx.globalAlpha = photo;
    ctx.drawImage(s.image, fit.dx, fit.dy, fit.dw, fit.dh);
    ctx.globalAlpha = 1;
}

/**
 * 在临时画布采样图片均色与亮度方差，并重排尚未开始的网格拆分。
 *
 * @param at 采样完成时的当前进度
 * @returns 能读取像素并完成采样时为 true；跨域限制或上下文不可用时为 false
 */
export function readAverages(
    el: HTMLImageElement,
    root: Cell,
    branches: Cell[],
    at: number,
) {
    const buffer = document.createElement('canvas');

    buffer.width = SAMPLE;
    buffer.height = SAMPLE;
    const ctx = buffer.getContext('2d', { willReadFrequently: true });

    if (!ctx) return false;

    const fit = coverRect(el.naturalWidth, el.naturalHeight, SAMPLE, SAMPLE);

    ctx.drawImage(el, fit.dx, fit.dy, fit.dw, fit.dh);

    try {
        measureTree(root, ctx.getImageData(0, 0, SAMPLE, SAMPLE).data, SAMPLE);
        orderByDetail(branches, at);

        return true;
    } catch {
        return false;
    }
}
