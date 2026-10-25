/**
 * 以简体中文格式显示日期和时间。
 */
export function formatDateTime(value: string | Date): string {
    return new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(new Date(value));
}

/**
 * 根据与当前时间的差值显示中文相对时间。
 */
export function formatRelativeTime(
    value: string | Date,
    now = new Date(),
): string {
    const target = new Date(value);
    const diffMs = target.getTime() - now.getTime();
    const absMs = Math.abs(diffMs);

    if (absMs < 45_000) return '刚刚';

    const intervals: Array<{ unit: Intl.RelativeTimeFormatUnit; ms: number }> =
        [
            { unit: 'year', ms: 365 * 24 * 60 * 60 * 1000 },
            { unit: 'month', ms: 30 * 24 * 60 * 60 * 1000 },
            { unit: 'week', ms: 7 * 24 * 60 * 60 * 1000 },
            { unit: 'day', ms: 24 * 60 * 60 * 1000 },
            { unit: 'hour', ms: 60 * 60 * 1000 },
            { unit: 'minute', ms: 60 * 1000 },
        ];
    const formatter = new Intl.RelativeTimeFormat('zh-CN', { numeric: 'auto' });

    for (const { unit, ms } of intervals) {
        if (absMs >= ms) return formatter.format(Math.round(diffMs / ms), unit);
    }
    return formatter.format(Math.round(diffMs / 1000), 'second');
}
