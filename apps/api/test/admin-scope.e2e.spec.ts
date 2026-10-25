import 'reflect-metadata';
import { Controller, HttpCode, Module, Post } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
    afterAll,
    afterEach,
    beforeAll,
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import { AppModule } from '../dist/app.module.js';
import { AdminController } from '../dist/modules/admin/decorators/admin-controller.decorator.js';
import { db } from '../dist/db/client.js';

/**
 * 测试模块不在业务路由树中，因此探针显式带端前缀，仅用于检查全局规则范围。
 */
class AdminProbeController {
    write() {
        return { accepted: true };
    }
}

class MiniappProbeController {
    write() {
        return { accepted: true };
    }
}

// 测试直接调用 NestJS 装饰器，避免依赖 Vitest 的旧版参数装饰器转译。
AdminController('admin/scope-probe')(AdminProbeController);
Controller('miniapp/scope-probe')(MiniappProbeController);
for (const controller of [AdminProbeController, MiniappProbeController]) {
    const descriptor = Object.getOwnPropertyDescriptor(
        controller.prototype,
        'write',
    )!;
    Post()(controller.prototype, 'write', descriptor);
    HttpCode(200)(controller.prototype, 'write', descriptor);
}

class ScopeTestModule {}
Module({
    imports: [AppModule],
    controllers: [AdminProbeController, MiniappProbeController],
})(ScopeTestModule);

let app: Awaited<ReturnType<typeof NestFactory.create>>;
let base = '';
const auditActions = [
    'POST /api/admin/scope-probe',
    'POST /api/miniapp/scope-probe',
];

beforeAll(async () => {
    await db.logs.deleteMany({ where: { action: { in: auditActions } } });
    app = await NestFactory.create(ScopeTestModule, { logger: false });
    app.setGlobalPrefix('api');
    await app.listen(0, '127.0.0.1');
    base = await app.getUrl();
});

afterEach(() => {
    vi.unstubAllEnvs();
});

afterAll(async () => {
    await db.logs.deleteMany({ where: { action: { in: auditActions } } });
    if (app) await app.close();
    await db.$disconnect();
});

describe.sequential('后台规则与客户接口隔离', () => {
    it('演示模式只拦截后台写入，并保留登录白名单', async () => {
        vi.stubEnv('DEMO_MODE', 'true');
        const admin = await fetch(base + '/api/admin/scope-probe', {
            method: 'POST',
        });
        expect(admin.status).toBe(403);
        expect((await admin.json()).code).toBe('DEMO_READONLY');

        const miniapp = await fetch(base + '/api/miniapp/scope-probe', {
            method: 'POST',
        });
        expect(miniapp.status).toBe(200);
        expect((await miniapp.json()).data.accepted).toBe(true);

        const login = await fetch(base + '/api/admin/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'scope-probe-missing-user',
                password: 'ScopeProbePass123',
                rememberMe: false,
            }),
        });
        expect(login.status).toBe(401);
    });

    it('关闭演示模式时允许后台写入并记录新路由审计', async () => {
        vi.stubEnv('DEMO_MODE', 'false');
        const response = await fetch(base + '/api/admin/scope-probe', {
            method: 'POST',
        });
        expect(response.status).toBe(200);
        await expect
            .poll(() =>
                db.logs.count({
                    where: {
                        action: auditActions[0],
                        type: 'api',
                        userId: null,
                    },
                }),
            )
            .toBe(1);
    });

    it('小程序公开写请求不进入员工审计', async () => {
        vi.stubEnv('DEMO_MODE', 'true');
        const response = await fetch(base + '/api/miniapp/scope-probe', {
            method: 'POST',
        });
        expect(response.status).toBe(200);
        // 后台对照请求确认异步审计已落库，再检查小程序请求没有生成员工日志。
        vi.stubEnv('DEMO_MODE', 'false');
        const control = await fetch(base + '/api/admin/scope-probe', {
            method: 'POST',
        });
        expect(control.status).toBe(200);
        await expect
            .poll(() => db.logs.count({ where: { action: auditActions[0] } }))
            .toBe(2);
        expect(
            await db.logs.count({ where: { action: auditActions[1] } }),
        ).toBe(0);
    });
});
