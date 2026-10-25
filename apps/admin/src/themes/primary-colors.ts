import colors from 'tailwindcss/colors';

/**
 * 外观主色配置，使用 Tailwind 候选色板并提供黑白主色选项。
 * 通过 DOM CSS 变量应用 Nuxt UI 主色，不在纯 Vite 环境动态修改 Nuxt 配置。
 */

/**
 * Nuxt UI 的中性色板（不作主题色候选）
 */
const NEUTRAL_COLORS = [
    'slate',
    'gray',
    'zinc',
    'neutral',
    'stone',
    'taupe',
    'mauve',
    'mist',
    'olive',
] as const;

/**
 * 从候选中剔除的键：非色板值 + 黑白 + 中性系
 */
const OMITTED_KEYS: ReadonlySet<string> = new Set([
    'inherit',
    'current',
    'transparent',
    'black',
    'white',
    ...NEUTRAL_COLORS,
]);

/**
 * 主题色 shade 刻度（与 Nuxt UI colors 插件 generateShades 一致）
 */
export const PRIMARY_SHADES = [
    50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
] as const;

type ShadeScale = Record<(typeof PRIMARY_SHADES)[number], string>;

/**
 * 候选主题色名列表（Tailwind 色相色板，如 red / orange / … / rose）。
 * 顺序沿用 tailwindcss/colors 的定义顺序（色相环顺序）。
 */
export const PRIMARY_COLORS: readonly string[] = Object.keys(colors).filter(
    (key) =>
        !OMITTED_KEYS.has(key) &&
        typeof (colors as Record<string, unknown>)[key] === 'object',
);

/**
 * 默认主题色：与 vite.config.ts 的 `ui()` 未配置 colors 时的 Nuxt UI 默认值
 * 一致（`green`）；若后续经 `ui({ ui: { colors: { primary } } })` 定制品牌色，
 * 此常量须同步（默认档 = 不写 DOM，实际取值来自插件生成的 CSS）。
 */
export const DEFAULT_PRIMARY_COLOR = 'green';

/**
 * 是否为合法的候选主题色名（兜底校验，失效值回退默认色）。
 */
export function isPrimaryColor(value: unknown): value is string {
    return typeof value === 'string' && PRIMARY_COLORS.includes(value);
}

/**
 * 取某色板的指定 shade 色值（tailwindcss v4 为 oklch 字符串；未知色返回空串）。
 */
export function getColorShade(
    color: string,
    shade: (typeof PRIMARY_SHADES)[number],
): string {
    const scale = (colors as Record<string, ShadeScale | string>)[color];

    if (!scale || typeof scale !== 'object') return '';

    return scale[shade] ?? '';
}

/**
 * 色名展示文案：英文首字母大写（Red / Orange / …）。
 */
export function formatColorLabel(color: string): string {
    return color.charAt(0).toUpperCase() + color.slice(1);
}

/**
 * 把主题色偏好应用到 <html>（inline style 覆盖 Nuxt UI 的 :root 变量）。
 * @param color 色板名（默认色不写 shade 覆盖）
 * @param blackAsPrimary 是否启用 Black 黑白主题
 * @param isDark 当前是否暗色（决定 Black 档取 white 还是 black）
 */
export function applyPrimaryColorToDOM(
    color: string,
    blackAsPrimary: boolean,
    isDark: boolean,
): void {
    const root = document.documentElement;

    if (blackAsPrimary) {
        for (const shade of PRIMARY_SHADES) {
            root.style.removeProperty(`--ui-color-primary-${shade}`);
        }
        root.style.setProperty('--ui-primary', isDark ? 'white' : 'black');

        return;
    }

    root.style.removeProperty('--ui-primary');

    if (color === DEFAULT_PRIMARY_COLOR || !isPrimaryColor(color)) {
        for (const shade of PRIMARY_SHADES) {
            root.style.removeProperty(`--ui-color-primary-${shade}`);
        }

        return;
    }

    for (const shade of PRIMARY_SHADES) {
        root.style.setProperty(
            `--ui-color-primary-${shade}`,
            getColorShade(color, shade),
        );
    }
}
