/**
 * 补齐本地三端配置，保留已有非空值、密码和密钥；不修改数据库。
 * 可从已有本地数据库连接串恢复 Compose 凭据，所有写入前先检查是否冲突。
 */
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';

const projectRoot = resolve(import.meta.dirname, '..');
const secret = () => randomBytes(24).toString('hex');

function read(file) {
    return existsSync(file) ? parseEnv(readFileSync(file, 'utf8')) : {};
}

function encode(value, key, compose = false) {
    const literal = "'" + value + "'";
    // Compose 会展开裸值和双引号内的 $；单引号必须同时能被 Node 原样读取。
    const candidates =
        compose && value.includes('$')
            ? value.endsWith('\\')
                ? []
                : [literal]
            : [value, literal, '"' + value + '"'];
    for (const text of candidates) {
        if (parseEnv('VALUE=' + text).VALUE === value) return text;
    }
    throw new Error(`无法自动序列化 ${key}，请在环境文件中手动配置`);
}

function fill(file, values, changed, compose = false) {
    let content = existsSync(file) ? readFileSync(file, 'utf8') : '';
    const original = content;
    const current = parseEnv(content);
    for (const [key, value] of Object.entries(values)) {
        if (
            current[key]?.trim() ||
            (Object.hasOwn(current, key) && value === '')
        )
            continue;
        const line = key + '=' + encode(value, key, compose);
        if (Object.hasOwn(current, key)) {
            content = content.replace(
                new RegExp(
                    '^[ \\t]*(?:export[ \\t]+)?' + key + '[ \\t]*=[^\\r\\n]*',
                    'gm',
                ),
                () => line,
            );
        } else {
            content +=
                (content && !content.endsWith('\n') ? '\n' : '') + line + '\n';
        }
    }
    if (content !== original) {
        mkdirSync(dirname(file), { recursive: true });
        writeFileSync(file, content);
        changed.push(file);
    }
}

function localDatabase(value, name) {
    if (!value?.trim()) return undefined;
    let url;
    try {
        url = new URL(value);
    } catch {
        throw new Error(`apps/api/.env 的 ${name} 不是有效连接地址`);
    }
    if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
        throw new Error(`apps/api/.env 的 ${name} 必须使用 PostgreSQL`);
    }
    if (
        ['localhost', '127.0.0.1'].includes(url.hostname) &&
        url.port === '15432'
    ) {
        try {
            return {
                user: decodeURIComponent(url.username),
                password: decodeURIComponent(url.password),
            };
        } catch {
            throw new Error(`apps/api/.env 的 ${name} 凭据编码无效`);
        }
    }
}

/**
 * 从示例文件补齐指定项目的本地环境；测试使用独立临时目录。
 *
 * @param {string} root 项目根目录，默认当前脚本所在项目
 * @returns {string[]} 本次创建或补齐的文件路径，不包含配置值
 */
export function setup(root = projectRoot) {
    const rootFile = resolve(root, '.env');
    const apiFile = resolve(root, 'apps/api/.env');
    const adminFile = resolve(root, 'apps/admin/.env');
    const miniFile = resolve(root, 'apps/miniapp/.env.local');
    const rootEnv = read(rootFile);
    const api = read(apiFile);
    const apiTemplate = read(resolve(root, 'apps/api/.env.example'));
    const local = ['DATABASE_URL', 'DATABASE_TEST_URL']
        .map((name) => localDatabase(api[name], name))
        .filter(Boolean);
    const user =
        rootEnv.POSTGRES_USER?.trim() || local[0]?.user || 'app_template';
    const password =
        (rootEnv.POSTGRES_PASSWORD?.trim()
            ? rootEnv.POSTGRES_PASSWORD
            : undefined) ||
        local[0]?.password ||
        secret();
    if (
        local.some(
            (value) => value.user !== user || value.password !== password,
        )
    ) {
        throw new Error(
            '本地数据库连接串与 Compose 凭据不一致；请核对配置，未写入任何文件',
        );
    }

    const portText = api.PORT?.trim() || apiTemplate.PORT;
    const port = Number(portText);
    if (
        !/^\d+$/.test(portText) ||
        !Number.isInteger(port) ||
        port < 1 ||
        port > 65535
    )
        throw new Error('PORT 必须为 1～65535 的整数');
    let publicUrl;
    try {
        publicUrl = new URL(
            api.PUBLIC_API_URL?.trim() || `http://localhost:${port}`,
        );
    } catch {
        throw new Error('PUBLIC_API_URL 必须为 HTTP(S) 地址');
    }
    if (
        !['http:', 'https:'].includes(publicUrl.protocol) ||
        publicUrl.username ||
        publicUrl.password ||
        publicUrl.search ||
        publicUrl.hash
    ) {
        throw new Error(
            'PUBLIC_API_URL 不得包含凭据、查询参数或片段，且必须使用 HTTP(S)',
        );
    }
    const publicApiUrl = publicUrl.href.replace(/\/$/, '');
    const database = `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@127.0.0.1:15432/app_template`;
    const adminPassword = api.SEED_ADMIN_PASSWORD?.trim()
        ? api.SEED_ADMIN_PASSWORD
        : `App${secret().slice(0, 12)}`;
    const mini = {
        ...read(resolve(root, 'apps/miniapp/.env')),
        ...read(miniFile),
    };
    const changed = [];
    fill(
        rootFile,
        {
            ...read(resolve(root, '.env.example')),
            POSTGRES_USER: user,
            POSTGRES_PASSWORD: password,
        },
        changed,
        true,
    );
    fill(
        apiFile,
        {
            ...apiTemplate,
            DATABASE_URL: database,
            DATABASE_TEST_URL: database + '_test',
            JWT_SECRET: api.JWT_SECRET?.trim() || secret(),
            // 已有访问密钥而缺少刷新密钥时保留原有回退语义，避免补缺导致会话失效。
            JWT_REFRESH_SECRET:
                api.JWT_REFRESH_SECRET?.trim() ||
                api.JWT_SECRET?.trim() ||
                secret(),
            SEED_ADMIN_PASSWORD: adminPassword,
            PUBLIC_API_URL: publicApiUrl,
        },
        changed,
    );
    fill(
        adminFile,
        {
            ...read(resolve(root, 'apps/admin/.env.example')),
            VITE_API_BASE_URL: publicApiUrl + '/api/admin',
        },
        changed,
    );
    fill(
        miniFile,
        {
            ...read(resolve(root, 'apps/miniapp/.env.example')),
            APP_BASE_URL:
                mini.APP_BASE_URL?.trim() || publicApiUrl + '/api/miniapp',
            APP_MP_WEIXIN_APPID:
                mini.APP_MP_WEIXIN_APPID?.trim() || 'touristappid',
        },
        changed,
    );
    const credentials = resolve(root, '.local/credentials.txt');
    if (!existsSync(credentials)) {
        mkdirSync(dirname(credentials), { recursive: true });
        writeFileSync(
            credentials,
            `仅本地开发使用，请勿提交或分享。\n后台：http://localhost:5174\n账号：admin\n初始种子密码：${adminPassword}\n已有账号密码不会被初始化脚本重置。\n`,
            { flag: 'wx' },
        );
        changed.push(credentials);
    }
    return changed;
}

if (
    process.argv[1] &&
    resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
    const changed = setup();
    console.log(
        changed.length
            ? `已补齐 ${changed.length} 个本地配置文件，已有非空配置和凭据已保留。`
            : '本地配置完整，无需修改。',
    );
}
