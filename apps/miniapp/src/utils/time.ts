/**
 * 日期字符串中的横线分隔符
 */
const DATE_SEPARATOR_PATTERN = /-/g;

/**
 * 解析常见日期时间字符串
 * @param dateTime 日期时间字符串
 * @returns 解析后的日期对象，解析失败时返回 null
 */
export function parseDateTime(dateTime?: string | null): Date | null {
    if (!dateTime) return null;

    const parsedDate = new Date(dateTime.replace(DATE_SEPARATOR_PATTERN, '/'));

    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

/**
 * 格式化为小时分钟文案
 * @param date 需要格式化的日期对象
 * @returns `HH:mm` 格式时间
 */
export function formatHourMinute(date: Date): string {
    const hours = formatTwoDigit(date.getHours());
    const minutes = formatTwoDigit(date.getMinutes());

    return `${hours}:${minutes}`;
}

/**
 * 格式化为月日小时分钟文案
 * @param date 需要格式化的日期对象
 * @returns `M月D日 HH:mm` 格式时间
 */
export function formatMonthDayHourMinute(date: Date): string {
    const month = date.getMonth() + 1;
    const day = date.getDate();

    return `${month}月${day}日 ${formatHourMinute(date)}`;
}

/**
 * 解析后端秒级或毫秒级时间戳
 * @param timestamp 后端时间戳
 * @returns 解析后的日期对象，解析失败或为空时返回 null
 */
export function parseUnixTimestamp(timestamp: number): Date | null {
    if (!timestamp) return null;

    const millisecondTimestamp =
        timestamp < 1e12 ? timestamp * 1000 : timestamp;
    const parsedDate = new Date(millisecondTimestamp);

    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

/**
 * 增加指定分钟数
 * @param date 原始时间
 * @param minutes 分钟数
 * @returns 新时间
 */
export function addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60 * 1000);
}

/**
 * 增加指定天数并重置到当天零点
 * @param date 原始日期
 * @param days 天数
 * @returns 新日期
 */
export function addDaysAtStartOfDay(date: Date, days: number): Date {
    const result = new Date(date);

    result.setDate(result.getDate() + days);
    result.setHours(0, 0, 0, 0);

    return result;
}

/**
 * 判断两个时间是否为同一天
 * @param left 左侧时间
 * @param right 右侧时间
 * @returns 是否为同一天
 */
export function isSameDate(left: Date, right: Date): boolean {
    return (
        left.getFullYear() === right.getFullYear() &&
        left.getMonth() === right.getMonth() &&
        left.getDate() === right.getDate()
    );
}

/**
 * 格式化为分钟秒数或小时分钟秒数文案
 * @param seconds 秒数
 * @returns 小于 1 小时时为 `mm:ss`，否则为 `HH:mm:ss`
 */
export function formatMinuteSecond(seconds: number): string {
    const safeSeconds = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const restSeconds = safeSeconds % 60;

    if (hours > 0)
        return `${formatTwoDigit(hours)}:${formatTwoDigit(minutes)}:${formatTwoDigit(restSeconds)}`;

    return `${formatTwoDigit(minutes)}:${formatTwoDigit(restSeconds)}`;
}

/**
 * 格式化为两位数字
 * @param value 原始数字
 * @returns 两位数字文案
 */
export function formatTwoDigit(value: number): string {
    return String(value).padStart(2, '0');
}

/**
 * 基于日期设置小时和分钟
 * @param date 原始日期
 * @param hour 小时
 * @param minute 分钟
 * @returns 设置后的时间
 */
export function setDateTime(date: Date, hour: number, minute: number): Date {
    const result = new Date(date);

    result.setHours(hour, minute, 0, 0);

    return result;
}

/**
 * 创建当前 ISO 时间戳
 * @returns ISO 时间戳
 */
export function createIsoTimestamp(): string {
    return new Date().toISOString();
}
