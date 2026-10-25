import type { DictItem, LogType } from '@/lib/api-types';

/**
 * 日志类型元信息：契约四枚举
 * （operation/login/api/error）的类型值集合、Chip 颜色映射与显示名解析。
 *
 * 显示名优先使用字典 label；字典不可用时回退内置中文名称或原始值。
 */

export const LOG_TYPE_VALUES = [
    'operation',
    'login',
    'api',
    'error',
] as const satisfies readonly LogType[];

const LOG_TYPE_VALUE_SET = new Set<string>(LOG_TYPE_VALUES);

/**
 * 判断外部字符串是否属于当前支持的日志类型。
 */
export function isLogType(value: string): value is LogType {
    return LOG_TYPE_VALUE_SET.has(value);
}

/**
 * 日志类型 → Chip 颜色（未知类型回退 neutral 中性色）
 */
export function logTypeColor(
    type: string,
): 'info' | 'error' | 'neutral' | 'success' {
    switch (type) {
        case 'login':
            return 'info';
        case 'error':
            return 'error';
        case 'api':
            return 'success';
        default:
            return 'neutral';
    }
}

/**
 * 类型显示名：字典 label → 内置中文名称 → 原始值。
 */
export function logTypeLabel(
    type: string,
    dictItems: DictItem[] | undefined,
): string {
    const item = dictItems?.find((d) => d.value === type);

    if (item) return item.label;

    const labels: Record<LogType, string> = {
        operation: '操作日志',
        login: '登录日志',
        api: '接口日志',
        error: '错误日志',
    };
    return isLogType(type) ? labels[type] : type;
}
