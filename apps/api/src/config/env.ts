import { isIP } from 'node:net';

/**
 * API 运行配置的唯一读取与校验入口；错误只包含变量名，不输出密钥或连接串。
 */
function readEnv(name: string, fallback?: string): string {
    const value = process.env[name]?.trim() || fallback;
    if (value === undefined) throw new Error(`[config] ${name} 未设置或为空`);
    return value;
}

function invalid(name: string, expected: string): never {
    throw new Error(`[config] ${name} ${expected}`);
}

function integer(
    name: string,
    fallback: number,
    min: number,
    max: number,
): number {
    const text = readEnv(name, String(fallback));
    const value = Number(text);
    if (
        !/^\d+$/.test(text) ||
        !Number.isSafeInteger(value) ||
        value < min ||
        value > max
    ) {
        invalid(name, `必须为 ${min}～${max} 的整数`);
    }
    return value;
}

function boolean(name: string, fallback: boolean): boolean {
    const value = readEnv(name, String(fallback));
    if (value !== 'true' && value !== 'false')
        invalid(name, '必须为 true 或 false');
    return value === 'true';
}

function duration(name: string, fallback: string): number {
    const match = /^([1-9]\d*)(s|m|h|d)?$/.exec(readEnv(name, fallback));
    if (!match) invalid(name, '必须为正整数秒数或带 s/m/h/d 单位的正整数');
    const multiplier = (
        { s: 1, m: 60, h: 3600, d: 86400 } as Record<string, number>
    )[match[2] ?? 's'];
    const seconds = Number(match[1]) * multiplier;
    if (
        !Number.isSafeInteger(seconds) ||
        seconds * 1000 > 8.64e15 - Date.now()
    ) {
        invalid(name, '有效期超出支持范围');
    }
    return seconds;
}

function httpUrl(name: string, value: string): URL {
    let url: URL;
    try {
        url = new URL(value);
    } catch {
        invalid(name, '必须为完整的 HTTP(S) 地址');
    }
    if (
        !['http:', 'https:'].includes(url.protocol) ||
        url.username ||
        url.password ||
        url.search ||
        url.hash
    ) {
        invalid(name, '必须为不含凭据、查询参数和片段的 HTTP(S) 地址');
    }
    return url;
}

/**
 * 校验 PostgreSQL 连接地址；数据库工具可以独立调用，不要求提供 JWT 配置。
 */
export function getDatabaseUrl(name = 'DATABASE_URL'): string {
    const value = readEnv(name);
    let url: URL;
    try {
        url = new URL(value);
    } catch {
        invalid(name, '必须为有效的 PostgreSQL 连接地址');
    }
    if (
        !['postgres:', 'postgresql:'].includes(url.protocol) ||
        !url.hostname ||
        url.pathname.length <= 1
    ) {
        invalid(name, '必须为包含主机和数据库名的 PostgreSQL 连接地址');
    }
    return value;
}

/**
 * 读取访问令牌签名密钥，空值不可启动。
 */
export function getJwtSecret(): string {
    return readEnv('JWT_SECRET');
}

/**
 * 刷新令牌密钥；未单独提供时沿用访问令牌密钥。
 */
export function getRefreshSecret(): string {
    return readEnv('JWT_REFRESH_SECRET', getJwtSecret());
}

/**
 * 访问令牌有效期，归一为秒；默认 15 分钟，登录和刷新均使用此配置。
 */
export function getJwtExpiresIn(): number {
    return duration('JWT_EXPIRES_IN', '15m');
}

/**
 * 新建刷新会话的有效期，归一为秒；已有会话轮换时不延长原到期时间。
 */
export function getRefreshExpiresIn(rememberMe: boolean): number {
    return rememberMe
        ? duration('REFRESH_EXPIRES_IN', '30d')
        : duration('REFRESH_EXPIRES_IN_SHORT', '1d');
}

/**
 * 后台演示只读开关，默认关闭。
 */
export function isDemoMode(): boolean {
    return boolean('DEMO_MODE', false);
}

/**
 * 后台认证限流开关，默认开启；测试环境显式关闭。
 */
export function isThrottleEnabled(): boolean {
    return boolean('THROTTLE_ENABLED', true);
}

/**
 * 公开资源地址，可包含部署子路径；统一去除末尾斜杠。
 */
export function getPublicApiUrl(): string {
    const fallback = `http://localhost:${integer('PORT', 3000, 1, 65535)}`;
    return httpUrl(
        'PUBLIC_API_URL',
        readEnv('PUBLIC_API_URL', fallback),
    ).href.replace(/\/$/, '');
}

/**
 * 启动前校验所有运行配置；环境变量按当前进程读取，不跨应用共享密钥。
 */
export function loadConfig() {
    const nodeEnv = readEnv('NODE_ENV', 'development');
    if (!['development', 'test', 'production'].includes(nodeEnv)) {
        invalid('NODE_ENV', '必须为 development、test 或 production');
    }
    const host = readEnv('HOST', '127.0.0.1');
    if (host !== 'localhost' && !isIP(host))
        invalid('HOST', '必须为 IP 地址或 localhost');
    const corsOrigins = readEnv(
        'CORS_ORIGINS',
        'http://localhost:5174,http://localhost:5173',
    )
        .split(',')
        .map((origin) => {
            const url = httpUrl('CORS_ORIGINS', origin.trim());
            if (url.pathname !== '/')
                invalid('CORS_ORIGINS', '只能包含来源地址，不能包含业务路径');
            return url.origin;
        });
    if (process.env.DATABASE_TEST_URL?.trim())
        getDatabaseUrl('DATABASE_TEST_URL');
    return {
        nodeEnv,
        host,
        port: integer('PORT', 3000, 1, 65535),
        corsOrigins: [...new Set(corsOrigins)],
        trustProxyHops: integer('TRUST_PROXY_HOPS', 0, 0, 255),
        publicApiUrl: getPublicApiUrl(),
        databaseUrl: getDatabaseUrl(),
        jwtSecret: getJwtSecret(),
        refreshSecret: getRefreshSecret(),
        jwtExpiresIn: getJwtExpiresIn(),
        refreshExpiresIn: getRefreshExpiresIn(true),
        refreshExpiresInShort: getRefreshExpiresIn(false),
        demoMode: isDemoMode(),
        throttleEnabled: isThrottleEnabled(),
    };
}
