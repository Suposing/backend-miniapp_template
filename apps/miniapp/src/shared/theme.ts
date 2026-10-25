/**
 * 应用颜色 Token，供 TypeScript、UnoCSS 和构建配置统一引用。
 */
export const themeColors = {
    primary: '#2080F0',
    primaryEnd: '#4098fc',
    page: '#F8F8F8',
    surface: '#ffffff',
    textPrimary: '#111827',
    textSecondary: '#64748b',
    textMuted: '#94a3b8',
    border: '#e5e7eb',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
} as const;

/**
 * 应用透明色 Token，供阴影、遮罩和轻量背景统一引用。
 */
export const themeAlphaColors = {
    primary18: 'rgba(32, 128, 240, 0.18)',
    primary24: 'rgba(32, 128, 240, 0.24)',
    shadowSlate06: 'rgba(15, 23, 42, 0.06)',
    shadowSlate10: 'rgba(15, 23, 42, 0.10)',
} as const;

/**
 * 应用渐变 Token，供按钮、卡片和强调区域统一引用。
 */
export const themeGradients = {
    primary: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.primaryEnd} 100%)`,
} as const;

/**
 * UnoCSS 颜色 Token，使用短横线命名以匹配类名写法。
 */
export const unoThemeColors = {
    primary: themeColors.primary,
    'primary-end': themeColors.primaryEnd,
    page: themeColors.page,
    surface: themeColors.surface,
    'text-primary': themeColors.textPrimary,
    'text-secondary': themeColors.textSecondary,
    'text-muted': themeColors.textMuted,
    border: themeColors.border,
    success: themeColors.success,
    warning: themeColors.warning,
    danger: themeColors.danger,
} as const;
