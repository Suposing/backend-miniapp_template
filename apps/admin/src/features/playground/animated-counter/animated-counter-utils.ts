/**
 * Animated Counter 的纯计算部分（逻辑逐字移植自 rare-ui `animated-counter`，MIT）：
 * 数值量化 / 格式化（分组 · 小数 · 补零）/ 拆成按「距右位数」定 key 的单元格。
 */

export type Grouping = 'western' | 'indian';

export const FACES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

/**
 * 每个数字面的高度（em）：面周围的留白是遮罩渐隐的过渡带，静止数字保持实心。
 */
export const LINE = 1.5;

/**
 * 上下渐隐遮罩：缓动而非线性——同宽的线性渐隐看起来像硬边。
 */
export const FADE = `linear-gradient(to bottom,
  rgba(0,0,0,0) 0%,
  rgba(0,0,0,0.06) 5.5%,
  rgba(0,0,0,0.5) 11%,
  rgba(0,0,0,0.94) 16.5%,
  #000 22%,
  #000 78%,
  rgba(0,0,0,0.94) 83.5%,
  rgba(0,0,0,0.5) 89%,
  rgba(0,0,0,0.06) 94.5%,
  rgba(0,0,0,0) 100%)`;

const MAX_DECIMALS = 15;
const MAX_PAD = 24;
const MIN_DURATION = 0.01;
const MAX_DURATION = 60;

/**
 * 计算始终为非负值的模，用于循环数字面的索引。
 */
export const mod = (n: number, m: number) => ((n % m) + m) % m;
const clamp = (n: number, low: number, high: number) =>
    Math.min(high, Math.max(low, Number.isFinite(n) ? n : low));
const isDigit = (char: string) => char >= '0' && char <= '9';

const EVERY_THREE = /\B(?=(\d{3})+(?!\d))/g;
const EVERY_TWO = /\B(?=(\d{2})+(?!\d))/g;

function group(whole: string, separator: string, grouping: Grouping) {
    if (!separator) return whole;
    if (grouping !== 'indian') return whole.replace(EVERY_THREE, separator);

    // indian：末尾三位一组，其余两位一组
    const head = whole.slice(0, -3);

    if (!head) return whole;

    return `${head.replace(EVERY_TWO, separator)}${separator}${whole.slice(-3)}`;
}

/**
 * 数字滚动演示格式化结果的整数、小数和符号宽度。
 */
export type Shape = {
    /**
     * 归一化后的展示数值；非有限数值按 0 处理。
     */
    amount: number;
    /**
     * 按小数位放大后的非负安全整数，用于拆分数字列。
     */
    scaled: number;
    /**
     * 归一化后的小数位数。
     */
    places: number;
    /**
     * 数字滚动持续时间，单位为秒。
     */
    pace: number;
    /**
     * 全部展示数字的最小位数，用于整数补零与数字列键计算。
     */
    width: number;
};

/**
 * 归一化展示值、小数位、补零位数和动画秒数；非有限数值回退为 0。
 */
export function measure(
    value: number,
    decimals: number,
    padStart: number,
    duration: number,
): Shape {
    // NaN 会让「与上一值比较」永远为真
    const amount = Number.isFinite(value) ? value : 0;
    const places = clamp(Math.trunc(decimals), 0, MAX_DECIMALS);
    const pad = clamp(Math.trunc(padStart), 1, MAX_PAD);
    // 超过 MAX_SAFE_INTEGER 的位数是噪声；超过 1e21 时 String() 变科学计数法
    const scaled = Math.min(
        Number.MAX_SAFE_INTEGER,
        Math.round(Math.abs(amount) * 10 ** places),
    );

    return {
        amount,
        scaled,
        places,
        pace: clamp(duration, MIN_DURATION, MAX_DURATION),
        width: Math.max(String(scaled).length, places + pad),
    };
}

/**
 * 按归一化数字形状生成分组和小数文本，不在此处追加符号或前后缀。
 */
export function format(
    { scaled, places, width }: Shape,
    separator: string,
    decimalSeparator: string,
    grouping: Grouping,
) {
    const raw = String(scaled).padStart(width, '0');
    const whole = group(
        raw.slice(0, raw.length - places) || '0',
        separator,
        grouping,
    );

    return places
        ? `${whole}${decimalSeparator}${raw.slice(raw.length - places)}`
        : whole;
}

/**
 * 单元格 key 按「距右侧的位数」编号：新增一位时其余列平移而非重建。
 */
export type Cell =
    | {
          /**
           * 节点或展示单元的类别判别值。
           */
          kind: 'digit';
          /**
           * 用于识别当前项的稳定键。
           */
          key: number;
          /**
           * 当前展示的数字面，取值 0–9。
           */
          digit: number;
      }
    | {
          /**
           * 节点或展示单元的类别判别值。
           */
          kind: 'mark';
          /**
           * 用于识别当前项的稳定键。
           */
          key: string;
          /**
           * 无需滚动的分隔符或符号字符。
           */
          char: string;
      };

/**
 * 把格式化文本拆成数字面和静态分隔符，数字 key 按距右侧位数稳定编号。
 */
export function toCells(chars: string, width: number): Cell[] {
    const cells: Cell[] = [];
    let seen = 0;
    // 只有数字推进位数，多字符分隔符要靠 run 区分 key
    let run = 0;

    for (const char of chars) {
        if (isDigit(char)) {
            run = 0;
            cells.push({
                kind: 'digit',
                key: width - seen++,
                digit: Number(char),
            });
        } else {
            cells.push({
                kind: 'mark',
                key: `mark-${width - seen}-${run++}`,
                char,
            });
        }
    }

    return cells;
}
