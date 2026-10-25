/**
 * 建库脚本与 HTTP 回归共同使用的固定测试库；不得扩大到开发库。
 */
export const TEST_DATABASE_NAME = 'app_template_test';

/**
 * 只允许项目本机 Compose 的测试库，拒绝通过查询参数改写连接目标。
 * 在启动 Docker、数据库连接或迁移之前调用；错误不包含输入凭据。
 *
 * @param {string | undefined} value DATABASE_TEST_URL 原始配置
 * @returns {URL} 已校验的 PostgreSQL URL
 */
export function parseTestDatabaseUrl(value) {
    const message =
        'DATABASE_TEST_URL 仅允许 PostgreSQL 的 localhost/127.0.0.1:15432/app_template_test，且不能包含查询参数或片段';
    let url;
    try {
        url = new URL(value);
    } catch {
        throw new Error(message);
    }
    if (
        !['postgres:', 'postgresql:'].includes(url.protocol) ||
        !['localhost', '127.0.0.1'].includes(url.hostname) ||
        url.port !== '15432' ||
        url.pathname !== '/' + TEST_DATABASE_NAME ||
        url.search ||
        url.hash
    ) {
        throw new Error(message);
    }
    return url;
}
