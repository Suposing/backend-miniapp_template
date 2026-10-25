import assert from 'node:assert/strict';
import { test, mock } from 'node:test';
import fs from 'node:fs';
import childProcess from 'node:child_process';
import { syncBuiltinESMExports } from 'node:module';
import { resolve } from 'node:path';
import { parseTestDatabaseUrl, TEST_DATABASE_NAME } from '../test-database.mjs';

const project = resolve(import.meta.dirname, '../..');
const databaseUrl =
    'postgresql://fixture:example-password@127.0.0.1:15432/app_template_test';

/**
 * 使用虚构配置和进程替身执行真实建库入口，避免回归测试接触任何数据库。
 */
function isolate(t, exists) {
    const previous = process.env.DATABASE_TEST_URL;
    const readFile = fs.readFileSync;
    mock.method(fs, 'readFileSync', (file, ...args) => {
        if (String(file) === resolve(project, '.env')) return '';
        if (String(file) === resolve(project, 'apps/api/.env'))
            return 'DATABASE_TEST_URL=' + databaseUrl + '\n';
        return readFile(file, ...args);
    });
    const calls = [];
    mock.method(childProcess, 'spawnSync', (command, args, options) => {
        calls.push({ command, args, env: { ...options.env } });
        return { status: 0, stdout: exists ? '1\n' : '' };
    });
    mock.method(console, 'log', () => {});
    syncBuiltinESMExports();
    t.after(() => {
        if (previous === undefined) delete process.env.DATABASE_TEST_URL;
        else process.env.DATABASE_TEST_URL = previous;
        mock.restoreAll();
        syncBuiltinESMExports();
    });
    return calls;
}

test('测试库只接受本机 Compose 的固定目标，错误不包含凭据', () => {
    for (const host of ['localhost', '127.0.0.1']) {
        for (const protocol of ['postgres', 'postgresql']) {
            assert.equal(
                parseTestDatabaseUrl(
                    `${protocol}://fixture:password@${host}:15432/${TEST_DATABASE_NAME}`,
                ).pathname,
                '/app_template_test',
            );
        }
    }
    for (const value of [
        undefined,
        '',
        'invalid-private-value',
        databaseUrl.replace('app_template_test', 'custom_test'),
        databaseUrl.replace('app_template_test', 'app_template'),
        databaseUrl.replace('127.0.0.1', 'db.example.test'),
        databaseUrl.replace('15432', '5432'),
        databaseUrl.replace('postgresql:', 'https:'),
        databaseUrl + '?dbname=app_template',
        databaseUrl + '?host=db.example.test',
        databaseUrl + '#fragment',
    ]) {
        assert.throws(
            () => parseTestDatabaseUrl(value),
            (error) => {
                assert.match(error.message, /DATABASE_TEST_URL/);
                assert.ok(!error.message.includes('example-password'));
                assert.ok(!error.message.includes('invalid-private-value'));
                return true;
            },
        );
    }
});

test('配置其它库名时，建库入口在调用任何外部命令前拒绝', async (t) => {
    const calls = isolate(t, false);
    process.env.DATABASE_TEST_URL = databaseUrl.replace(
        'app_template_test',
        'custom_test',
    );
    await assert.rejects(
        import('../test-db.mjs?case=invalid-database'),
        /DATABASE_TEST_URL/,
    );
    assert.equal(calls.length, 0);
});

test('查询、创建和迁移使用同一个固定测试库及环境', async (t) => {
    const calls = isolate(t, false);
    process.env.DATABASE_TEST_URL = databaseUrl;
    await import('../test-db.mjs?case=create-database');
    assert.equal(calls.length, 3);
    assert.equal(
        calls[0].args.at(-1),
        "SELECT 1 FROM pg_database WHERE datname = 'app_template_test'",
    );
    assert.ok(calls[1].args.includes('createdb'));
    assert.equal(calls[1].args.at(-1), 'app_template_test');
    assert.deepEqual(calls[2].args.slice(-2), ['migrate', 'deploy']);
    assert.equal(calls[2].env.DATABASE_URL, databaseUrl);
    for (const call of calls) {
        assert.equal(call.env.DATABASE_TEST_URL, databaseUrl);
    }
});

test('测试库已存在时不再次建库，只应用迁移', async (t) => {
    const calls = isolate(t, true);
    process.env.DATABASE_TEST_URL = databaseUrl;
    await import('../test-db.mjs?case=existing-database');
    assert.equal(calls.length, 2);
    assert.ok(calls.every((call) => !call.args.includes('createdb')));
    assert.equal(calls[1].env.DATABASE_URL, databaseUrl);
});
