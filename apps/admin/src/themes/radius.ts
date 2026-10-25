/**
 * 圆角偏好，修改 Nuxt UI 的 --ui-radius 基准变量，使各级圆角按比例更新。
 */

export type RadiusId = 'none' | 'small' | 'medium' | 'large';

export const RADII: {
    id: RadiusId;
    /**
     * 显示名称。
     */
    labelText: string;
    /**
     * `--ui-radius` 取值（rem）
     */
    rem: number;
}[] = [
    { id: 'none', labelText: '直角', rem: 0 },
    { id: 'small', labelText: '小圆角', rem: 0.125 },
    { id: 'medium', labelText: '中圆角', rem: 0.25 },
    { id: 'large', labelText: '大圆角', rem: 0.5 },
];

export const RADIUS_IDS: RadiusId[] = RADII.map((r) => r.id);

/**
 * 默认档位：中圆角（Nuxt UI 原始值 0.25rem），不写 DOM 属性
 */
export const DEFAULT_RADIUS_ID: RadiusId = 'medium';

/**
 * 是否为合法的圆角档位 id（兜底校验，失效值回退默认档）。
 */
export function isRadiusId(value: unknown): value is RadiusId {
    return (
        typeof value === 'string' && (RADIUS_IDS as string[]).includes(value)
    );
}

/**
 * 把圆角档位应用到 <html>（覆盖 `--ui-radius`；默认档移除覆盖）。
 */
export function applyRadiusToDOM(radius: RadiusId): void {
    const root = document.documentElement;

    if (radius === DEFAULT_RADIUS_ID) {
        root.style.removeProperty('--ui-radius');

        return;
    }

    const rem = RADII.find((r) => r.id === radius)?.rem ?? 0.25;

    root.style.setProperty('--ui-radius', `${rem}rem`);
}
