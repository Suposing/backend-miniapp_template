/**
 * 确保本地独立测试库存在并应用 Prisma 迁移。
 * 仅允许本机 Compose 的 app_template_test，所有操作使用同一已校验目标。
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseEnv } from 'node:util';
import { parseTestDatabaseUrl, TEST_DATABASE_NAME } from './test-database.mjs';
const root = resolve(import.meta.dirname, '..');
const env = {
    ...parseEnv(readFileSync(resolve(root, '.env'), 'utf8')),
    ...parseEnv(readFileSync(resolve(root, 'apps/api/.env'), 'utf8')),
    ...process.env,
};
const url = parseTestDatabaseUrl(env.DATABASE_TEST_URL);
env.DATABASE_TEST_URL = url.href;
const databaseUser = decodeURIComponent(url.username);
const run = (cmd, args, options = {}) => {
    const r = spawnSync(cmd, args, {
        cwd: root,
        env,
        stdio: 'inherit',
        ...options,
    });
    if (r.status !== 0) throw Error(cmd + ' failed');
};
const existing = spawnSync(
    'docker',
    [
        'compose',
        'exec',
        '-T',
        'postgres',
        'psql',
        '-U',
        databaseUser,
        '-d',
        'postgres',
        '-tAc',
        `SELECT 1 FROM pg_database WHERE datname = '${TEST_DATABASE_NAME}'`,
    ],
    { cwd: root, env, encoding: 'utf8' },
);
if (existing.status !== 0) throw Error('PostgreSQL 容器不可用');
if (!existing.stdout.trim())
    run('docker', [
        'compose',
        'exec',
        '-T',
        'postgres',
        'createdb',
        '-U',
        databaseUser,
        TEST_DATABASE_NAME,
    ]);
env.DATABASE_URL = env.DATABASE_TEST_URL;
const cli = resolve(root, 'apps/api/node_modules/prisma/build/index.js');
run(process.execPath, [cli, 'migrate', 'deploy'], {
    cwd: resolve(root, 'apps/api'),
});
console.log('独立测试数据库已就绪');
