import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    getJwtExpiresIn,
    getRefreshExpiresIn,
    loadConfig,
} from '../src/config/env';

const optional = [
    'HOST',
    'PORT',
    'CORS_ORIGINS',
    'PUBLIC_API_URL',
    'TRUST_PROXY_HOPS',
    'DEMO_MODE',
    'THROTTLE_ENABLED',
    'JWT_EXPIRES_IN',
    'REFRESH_EXPIRES_IN',
    'REFRESH_EXPIRES_IN_SHORT',
];
beforeEach(() => {
    for (const key of optional) vi.stubEnv(key, undefined);
    vi.stubEnv(
        'DATABASE_URL',
        'postgresql://test:test@localhost:15432/app_template_test',
    );
    vi.stubEnv('JWT_SECRET', 'configuration-test-key');
    vi.stubEnv('JWT_REFRESH_SECRET', 'configuration-refresh-key');
});
afterEach(() => vi.unstubAllEnvs());

describe('API 环境配置', () => {
    it('默认端口、两端来源和令牌有效期与开发约定一致', () => {
        expect(loadConfig()).toMatchObject({
            host: '127.0.0.1',
            port: 3000,
            trustProxyHops: 0,
            corsOrigins: ['http://localhost:5174', 'http://localhost:5173'],
            publicApiUrl: 'http://localhost:3000',
            jwtExpiresIn: 900,
            refreshExpiresIn: 2592000,
            refreshExpiresInShort: 86400,
            demoMode: false,
            throttleEnabled: true,
        });
    });
    it('空白值使用默认值，布尔值和地址按类型归一', () => {
        vi.stubEnv('PORT', ' 4200 ');
        vi.stubEnv('HOST', ' 0.0.0.0 ');
        vi.stubEnv(
            'CORS_ORIGINS',
            ' https://admin.example.test/ ,https://admin.example.test ',
        );
        vi.stubEnv('DEMO_MODE', 'true');
        vi.stubEnv('THROTTLE_ENABLED', 'false');
        vi.stubEnv('TRUST_PROXY_HOPS', ' 1 ');
        expect(loadConfig()).toMatchObject({
            host: '0.0.0.0',
            port: 4200,
            publicApiUrl: 'http://localhost:4200',
            corsOrigins: ['https://admin.example.test'],
            demoMode: true,
            throttleEnabled: false,
            trustProxyHops: 1,
        });
        vi.stubEnv('PORT', ' ');
        expect(loadConfig().port).toBe(3000);
    });
    it('令牌时长支持秒数和明确单位，避免数字字符串被当成毫秒', () => {
        vi.stubEnv('JWT_EXPIRES_IN', '120');
        vi.stubEnv('REFRESH_EXPIRES_IN', '2d');
        vi.stubEnv('REFRESH_EXPIRES_IN_SHORT', '3h');
        expect(getJwtExpiresIn()).toBe(120);
        expect(getRefreshExpiresIn(true)).toBe(172800);
        expect(getRefreshExpiresIn(false)).toBe(10800);
    });
    it.each([
        ['PORT', '0'],
        ['PORT', '65536'],
        ['PORT', '3e3'],
        ['HOST', 'http://localhost'],
        ['TRUST_PROXY_HOPS', '-1'],
        ['THROTTLE_ENABLED', 'yes'],
        ['DEMO_MODE', '1'],
        ['JWT_EXPIRES_IN', '0'],
        ['JWT_EXPIRES_IN', '2ms'],
        ['REFRESH_EXPIRES_IN', '-1d'],
        ['CORS_ORIGINS', '*'],
        ['CORS_ORIGINS', 'http://localhost:5174/path'],
        ['CORS_ORIGINS', 'http://localhost:5174,'],
        ['PUBLIC_API_URL', 'https://user:secret@example.test'],
        ['DATABASE_URL', 'https://example.test/db'],
        ['NODE_ENV', 'unknown'],
    ])('%s 的非法值在启动前被拒绝', (key, value) => {
        vi.stubEnv(key, value);
        expect(() => loadConfig()).toThrow(key);
    });
    it('缺失密钥被拒绝，错误信息不包含敏感连接串', () => {
        vi.stubEnv('JWT_SECRET', '');
        expect(() => loadConfig()).toThrow('JWT_SECRET');
        vi.stubEnv('JWT_SECRET', 'test-key');
        vi.stubEnv('DATABASE_URL', 'malformed-sensitive-database-secret');
        try {
            loadConfig();
        } catch (error) {
            expect(String(error)).toContain('DATABASE_URL');
            expect(String(error)).not.toContain(
                'malformed-sensitive-database-secret',
            );
        }
    });
    it('无效配置先于数据库与认证模块加载失败', async () => {
        vi.stubEnv('PORT', 'invalid-port');
        vi.stubEnv('DATABASE_URL', 'invalid-database');
        const { createApp } = await import('../dist/bootstrap.js');
        await expect(createApp()).rejects.toThrow('PORT');
    });
});
