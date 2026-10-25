import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import {
    copyFileSync,
    existsSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    realpathSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { parseEnv } from 'node:util';
import { spawnSync } from 'node:child_process';
import { setup } from '../setup.mjs';

const project = resolve(import.meta.dirname, '../..');
const roots = [];
const envFiles = [
    '.env',
    'apps/api/.env',
    'apps/admin/.env',
    'apps/miniapp/.env.local',
    '.local/credentials.txt',
];

function fixture() {
    const root = mkdtempSync(join(tmpdir(), 'app_template-setup-'));
    roots.push(root);
    for (const file of [
        '.env.example',
        'apps/api/.env.example',
        'apps/admin/.env.example',
        'apps/miniapp/.env.example',
        'compose.yaml',
    ]) {
        mkdirSync(dirname(join(root, file)), { recursive: true });
        copyFileSync(join(project, file), join(root, file));
    }
    return root;
}

function write(root, file, value) {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    writeFileSync(join(root, file), value);
}

const read = (root, file) => parseEnv(readFileSync(join(root, file), 'utf8'));
const snapshot = (root) =>
    envFiles.map((file) =>
        existsSync(join(root, file))
            ? readFileSync(join(root, file), 'utf8')
            : null,
    );

afterEach(() => {
    for (const root of roots.splice(0)) {
        const actual = realpathSync(root);
        assert.equal(dirname(actual), realpathSync(tmpdir()));
        assert.ok(actual.includes('app_template-setup-'));
        rmSync(actual, { recursive: true });
    }
});

test('空项目一次补齐三端配置，密钥独立且重复执行字节不变', () => {
    const root = fixture();
    assert.equal(setup(root).length, 5);
    const api = read(root, 'apps/api/.env');
    const compose = read(root, '.env');
    assert.equal(
        decodeURIComponent(new URL(api.DATABASE_URL).password),
        compose.POSTGRES_PASSWORD,
    );
    assert.notEqual(api.JWT_SECRET, api.JWT_REFRESH_SECRET);
    assert.equal(
        api.CORS_ORIGINS,
        'http://localhost:5174,http://localhost:5173',
    );
    assert.equal(api.JWT_EXPIRES_IN, '15m');
    assert.equal(
        read(root, 'apps/admin/.env').VITE_API_BASE_URL,
        'http://localhost:3000/api/admin',
    );
    assert.equal(
        read(root, 'apps/miniapp/.env.local').APP_BASE_URL,
        'http://localhost:3000/api/miniapp',
    );
    const before = snapshot(root);
    assert.deepEqual(setup(root), []);
    assert.deepEqual(snapshot(root), before);
});

test('只有根配置时复用含特殊字符的数据库密码并补齐应用', () => {
    const root = fixture();
    write(
        root,
        '.env',
        "POSTGRES_USER=custom_user\nPOSTGRES_PASSWORD='existing # secret'\n",
    );
    setup(root);
    const api = read(root, 'apps/api/.env');
    assert.equal(new URL(api.DATABASE_URL).username, 'custom_user');
    assert.equal(
        decodeURIComponent(new URL(api.DATABASE_URL).password),
        'existing # secret',
    );
    assert.equal(read(root, '.env').POSTGRES_PASSWORD, 'existing # secret');
});

test('只有 API 配置时从连接串恢复 Compose 凭据并保留认证密钥', () => {
    const root = fixture();
    write(
        root,
        'apps/api/.env',
        'DATABASE_URL=postgresql://app_template:recovered%23value@127.0.0.1:15432/app_template\nJWT_SECRET=existing-access\nJWT_REFRESH_SECRET=existing-refresh\nSEED_ADMIN_PASSWORD=ExistingSeed123\n',
    );
    setup(root);
    assert.equal(read(root, '.env').POSTGRES_PASSWORD, 'recovered#value');
    const api = read(root, 'apps/api/.env');
    assert.equal(api.JWT_SECRET, 'existing-access');
    assert.equal(api.JWT_REFRESH_SECRET, 'existing-refresh');
    assert.equal(api.SEED_ADMIN_PASSWORD, 'ExistingSeed123');
});

test('恢复含美元符号的数据库密码后，Compose 和 API 读取相同原值', () => {
    for (const password of [
        'Example$APP_SETUP_EXPANSION',
        'Example${APP_SETUP_EXPANSION}#suffix',
        ' dollars $$ end $ ',
        'quoted "value" $APP_SETUP_EXPANSION',
    ]) {
        const root = fixture();
        write(
            root,
            'apps/api/.env',
            `DATABASE_URL=postgresql://app_template:${encodeURIComponent(password)}@127.0.0.1:15432/app_template\n`,
        );
        setup(root);
        const env = { ...process.env, APP_SETUP_EXPANSION: 'must-not-expand' };
        delete env.POSTGRES_USER;
        delete env.POSTGRES_PASSWORD;
        const result = spawnSync(
            'docker',
            [
                'compose',
                '--project-directory',
                root,
                '--env-file',
                join(root, '.env'),
                '-f',
                join(root, 'compose.yaml'),
                'config',
                '--environment',
            ],
            { cwd: root, env, encoding: 'utf8' },
        );
        assert.equal(result.status, 0, '需要可用的 Docker Compose CLI');
        // 普通 config 导出会把字面 $ 再转义为 $$；这里读取 Compose 实际解析的环境。
        const composePassword = result.stdout
            .split(/\r?\n/)
            .find((line) => line.startsWith('POSTGRES_PASSWORD='))
            ?.slice('POSTGRES_PASSWORD='.length);
        assert.equal(composePassword, password);
        assert.equal(read(root, '.env').POSTGRES_PASSWORD, password);
        const api = read(root, 'apps/api/.env');
        for (const key of ['DATABASE_URL', 'DATABASE_TEST_URL']) {
            assert.equal(
                decodeURIComponent(new URL(api[key]).password),
                password,
            );
        }
        const before = snapshot(root);
        assert.deepEqual(setup(root), []);
        assert.deepEqual(snapshot(root), before);
    }
});

test('无法同时满足 Compose 和 Node 编码的密码在写入前报错', () => {
    const root = fixture();
    const password = "quoted'$APP_SETUP_EXPANSION";
    write(
        root,
        'apps/api/.env',
        `DATABASE_URL=postgresql://app_template:${encodeURIComponent(password)}@127.0.0.1:15432/app_template\n`,
    );
    const before = snapshot(root);
    assert.throws(() => setup(root), /POSTGRES_PASSWORD/);
    assert.deepEqual(snapshot(root), before);
});

test('空必需配置可补齐且不会产生重复键', () => {
    const root = fixture();
    write(
        root,
        'apps/api/.env',
        '# 保留注释\nJWT_SECRET=\nJWT_REFRESH_SECRET=""\n',
    );
    setup(root);
    const text = readFileSync(join(root, 'apps/api/.env'), 'utf8');
    assert.ok(read(root, 'apps/api/.env').JWT_SECRET);
    assert.equal(text.match(/^JWT_SECRET=/gm).length, 1);
    assert.equal(text.match(/^JWT_REFRESH_SECRET=/gm).length, 1);
    assert.ok(text.startsWith('# 保留注释\n'));
});

test('纯空白密码会补齐，有效密码的前后空格保持原样', () => {
    const root = fixture();
    write(root, '.env', 'POSTGRES_PASSWORD="   "\n');
    write(root, 'apps/api/.env', 'SEED_ADMIN_PASSWORD="   "\n');
    setup(root);
    const compose = read(root, '.env');
    const api = read(root, 'apps/api/.env');
    assert.ok(compose.POSTGRES_PASSWORD.trim());
    assert.ok(api.SEED_ADMIN_PASSWORD.trim());
    assert.equal(
        decodeURIComponent(new URL(api.DATABASE_URL).password),
        compose.POSTGRES_PASSWORD,
    );
    assert.ok(
        readFileSync(join(root, '.local/credentials.txt'), 'utf8').includes(
            api.SEED_ADMIN_PASSWORD,
        ),
    );
    const before = snapshot(root);
    assert.deepEqual(setup(root), []);
    assert.deepEqual(snapshot(root), before);

    const existing = fixture();
    write(existing, '.env', 'POSTGRES_PASSWORD=" existing # secret "\n');
    write(
        existing,
        'apps/api/.env',
        'SEED_ADMIN_PASSWORD=" ExistingSeed123 "\n',
    );
    setup(existing);
    assert.equal(
        read(existing, '.env').POSTGRES_PASSWORD,
        ' existing # secret ',
    );
    assert.equal(
        read(existing, 'apps/api/.env').SEED_ADMIN_PASSWORD,
        ' ExistingSeed123 ',
    );
    assert.equal(
        decodeURIComponent(
            new URL(read(existing, 'apps/api/.env').DATABASE_URL).password,
        ),
        ' existing # secret ',
    );
});

test('端口格式与 API 校验一致，非法端口不会写入文件', () => {
    for (const port of ['3e3', '0xBB8', '0', '65536']) {
        const root = fixture();
        write(root, 'apps/api/.env', `PORT=${port}\n`);
        const before = snapshot(root);
        assert.throws(() => setup(root), /PORT/);
        assert.deepEqual(snapshot(root), before);
    }
});

test('数据库凭据冲突时停止，不修改任一现有文件', () => {
    const root = fixture();
    write(root, '.env', 'POSTGRES_PASSWORD=root-password\n');
    write(
        root,
        'apps/api/.env',
        'DATABASE_URL=postgresql://app_template:different-password@127.0.0.1:15432/app_template\n',
    );
    const before = snapshot(root);
    assert.throws(() => setup(root), /凭据不一致/);
    assert.deepEqual(snapshot(root), before);
});

test('保留自定义来源、前端地址、AppID 和现有凭据文件', () => {
    const root = fixture();
    write(
        root,
        'apps/api/.env',
        'PORT=4200\nPUBLIC_API_URL=https://api.example.test/service\nCORS_ORIGINS=https://admin.example.test\n',
    );
    write(
        root,
        'apps/admin/.env',
        'VITE_API_BASE_URL=https://custom.example.test/api/admin\n',
    );
    write(
        root,
        'apps/miniapp/.env',
        'APP_BASE_URL=https://mini.example.test/api/miniapp\nAPP_MP_WEIXIN_APPID=wx-test-existing\n',
    );
    write(root, '.local/credentials.txt', 'existing credentials\n');
    setup(root);
    assert.equal(
        read(root, 'apps/api/.env').CORS_ORIGINS,
        'https://admin.example.test',
    );
    assert.equal(
        read(root, 'apps/admin/.env').VITE_API_BASE_URL,
        'https://custom.example.test/api/admin',
    );
    assert.equal(
        read(root, 'apps/miniapp/.env.local').APP_MP_WEIXIN_APPID,
        'wx-test-existing',
    );
    assert.equal(
        read(root, 'apps/miniapp/.env.local').APP_BASE_URL,
        'https://mini.example.test/api/miniapp',
    );
    assert.equal(
        readFileSync(join(root, '.local/credentials.txt'), 'utf8'),
        'existing credentials\n',
    );
});

test('自定义 API 端口可生成匹配的公开地址和两端请求地址', () => {
    const root = fixture();
    write(root, 'apps/api/.env', 'PORT=4200\n');
    setup(root);
    assert.equal(
        read(root, 'apps/api/.env').PUBLIC_API_URL,
        'http://localhost:4200',
    );
    assert.equal(
        read(root, 'apps/admin/.env').VITE_API_BASE_URL,
        'http://localhost:4200/api/admin',
    );
    assert.equal(
        read(root, 'apps/miniapp/.env.local').APP_BASE_URL,
        'http://localhost:4200/api/miniapp',
    );
});

test('缺少刷新密钥时保留已有回退签名语义', () => {
    const root = fixture();
    write(root, 'apps/api/.env', 'JWT_SECRET=existing-signing-key\n');
    setup(root);
    const api = read(root, 'apps/api/.env');
    assert.equal(api.JWT_SECRET, 'existing-signing-key');
    assert.equal(api.JWT_REFRESH_SECRET, 'existing-signing-key');
});
