import { describe, expect, it } from 'vitest';

import { formatDateTime, formatRelativeTime } from '../format-date';
import { logTypeLabel } from '@/features/logs/log-type';

describe('固定中文显示', () => {
    it('日期使用中文年月日和 24 小时制', () => {
        const text = formatDateTime(new Date(2026, 9, 23, 17, 5));
        expect(text).toContain('2026年10月23日');
        expect(text).toContain('17:05');
    });

    it('相对时间包含中文的过去和未来描述', () => {
        const now = new Date(2026, 9, 23, 12);
        expect(
            formatRelativeTime(new Date(now.getTime() - 3 * 60_000), now),
        ).toBe('3分钟前');
        expect(
            formatRelativeTime(new Date(now.getTime() + 2 * 3_600_000), now),
        ).toBe('2小时后');
        expect(formatRelativeTime(now, now)).toBe('刚刚');
    });

    it('字典不可用时仍显示日志类型的中文名称', () => {
        expect(logTypeLabel('operation', undefined)).toBe('操作日志');
        expect(logTypeLabel('login', undefined)).toBe('登录日志');
        expect(logTypeLabel('api', undefined)).toBe('接口日志');
        expect(logTypeLabel('error', undefined)).toBe('错误日志');
    });

    it('优先显示业务字典维护的名称，未知类型保留原始值', () => {
        expect(
            logTypeLabel('login', [
                {
                    id: 'login',
                    typeCode: 'log_type',
                    value: 'login',
                    label: '账号登录',
                    sort: 0,
                    enabled: true,
                },
            ]),
        ).toBe('账号登录');
        expect(logTypeLabel('custom', [])).toBe('custom');
    });
});
