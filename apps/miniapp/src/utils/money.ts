/**
 * 将元转换为四舍五入的整数分，仅供展示层归一化使用。
 * 空值、空字符串或非有限数值返回 0；不用于服务端金额累计。
 *
 * @param value 金额，单位为元
 * @returns 四舍五入后的整数分
 */
export function toMoneyCents(value: string | number | null | undefined) {
    if (value === null || value === undefined || value === '') return 0;

    const numberValue = Number(value);

    if (!Number.isFinite(numberValue)) return 0;

    return Math.round(numberValue * 100);
}

/**
 * 把金额分限制为非负值。
 * @param cents 整数分金额
 * @returns 非负整数分金额
 */
export function clampMoneyCents(cents: number) {
    if (!Number.isFinite(cents)) return 0;

    return Math.max(0, Math.round(cents));
}

/**
 * 格式化整数分金额。
 * @param cents 整数分金额
 * @returns 两位小数金额
 */
export function formatMoney(cents: number) {
    return (clampMoneyCents(cents) / 100).toFixed(2);
}

/**
 * 按四舍五入的整数分判断元金额是否为正；不足半分的正数归一后为 0。
 *
 * @param value 金额，单位为元
 */
export function isPositiveMoney(value: string | number | null | undefined) {
    return toMoneyCents(value) > 0;
}
