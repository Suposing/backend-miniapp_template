import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createApp } from '../dist/bootstrap.js';
import { db } from '../dist/db/client.js';
import { seed } from '../prisma/seed';
import { db as seedDb } from '../src/db/client';
import { TEST_DATABASE_NAME } from '../../../scripts/test-database.mjs';

let app: Awaited<ReturnType<typeof createApp>>;
let base = '',
    adminToken = '',
    editorToken = '',
    editorId = '',
    roleId = '',
    noticeId = '';
const password = 'NoticePass123';
async function request(
    path: string,
    method = 'GET',
    token = adminToken,
    body?: unknown,
) {
    const response = await fetch(base + '/api/admin' + path, {
        method,
        headers: {
            ...(token ? { Authorization: 'Bearer ' + token } : {}),
            ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : null };
}
async function login(username: string, value: string, rememberMe = false) {
    return request('/auth/login', 'POST', '', {
        username,
        password: value,
        rememberMe,
    });
}

beforeAll(async () => {
    const database = await db.$queryRawUnsafe<{ name: string }[]>(
        'SELECT current_database() AS name',
    );
    if (database[0]?.name !== TEST_DATABASE_NAME)
        throw new Error('拒绝清理非测试数据库');
    await db.$executeRawUnsafe(
        'TRUNCATE TABLE users, roles, menus, depts, dict_types, logs, notices, settings CASCADE',
    );
    await seed();
    await seed();
    await seedDb.$disconnect();
    app = await createApp();
    await app.listen(0, '127.0.0.1');
    base = await app.getUrl();
    const result = await login('admin', process.env.SEED_ADMIN_PASSWORD!);
    expect(result.status).toBe(200);
    adminToken = result.body.data.accessToken;
});
afterAll(async () => {
    if (app) await app.close();
    await db.$disconnect();
    await seedDb.$disconnect();
});

describe.sequential('通用基础后台：真实 PostgreSQL 与 HTTP 回归', () => {
    it('后台和小程序 H5 来源通过预检，未知来源不会获得跨域授权', async () => {
        for (const origin of [
            'http://localhost:5174',
            'http://localhost:5173',
        ]) {
            const response = await fetch(base + '/api/admin/auth/login', {
                method: 'OPTIONS',
                headers: {
                    Origin: origin,
                    'Access-Control-Request-Method': 'POST',
                    'Access-Control-Request-Headers':
                        'content-type,authorization',
                },
            });
            expect(response.status).toBe(204);
            expect(response.headers.get('access-control-allow-origin')).toBe(
                origin,
            );
            expect(
                response.headers.get('access-control-allow-credentials'),
            ).toBe('true');
        }
        const blocked = await fetch(base + '/api/admin/auth/login', {
            method: 'OPTIONS',
            headers: {
                Origin: 'https://unknown.example.test',
                'Access-Control-Request-Method': 'POST',
            },
        });
        expect(blocked.headers.get('access-control-allow-origin')).toBeNull();
    });
    it('配置控制实际签发时长，刷新轮换保留原会话到期时间', async () => {
        vi.stubEnv('JWT_EXPIRES_IN', '2m');
        vi.stubEnv('REFRESH_EXPIRES_IN', '2d');
        vi.stubEnv('REFRESH_EXPIRES_IN_SHORT', '3h');
        const claims = (token: string): { iat: number; exp: number } =>
            JSON.parse(
                Buffer.from(token.split('.')[1], 'base64url').toString(),
            );
        try {
            const short = await login(
                'admin',
                process.env.SEED_ADMIN_PASSWORD!,
            );
            expect(short.status).toBe(200);
            const access = claims(short.body.data.accessToken);
            const refresh = claims(short.body.data.refreshToken);
            expect(access.exp - access.iat).toBe(120);
            expect(refresh.exp - refresh.iat).toBe(10800);

            const long = await login(
                'admin',
                process.env.SEED_ADMIN_PASSWORD!,
                true,
            );
            expect(long.status).toBe(200);
            const longRefresh = claims(long.body.data.refreshToken);
            expect(longRefresh.exp - longRefresh.iat).toBe(172800);

            const renewed = await request('/auth/refresh', 'POST', '', {
                refreshToken: short.body.data.refreshToken,
            });
            expect(renewed.status).toBe(200);
            const renewedAccess = claims(renewed.body.data.accessToken);
            const renewedRefresh = claims(renewed.body.data.refreshToken);
            expect(renewedAccess.exp - renewedAccess.iat).toBe(120);
            expect(renewedRefresh.exp).toBeLessThanOrEqual(refresh.exp);
            expect(renewedRefresh.exp).toBeGreaterThanOrEqual(refresh.exp - 1);
        } finally {
            vi.unstubAllEnvs();
        }
    });
    it('健康检查独立，旧业务路由和小程序下的后台接口均不可用', async () => {
        const health = await fetch(base + '/api/health');
        expect(health.status).toBe(200);
        expect((await health.json()).data.status).toBe('ok');

        for (const [path, method] of [
            ['/api/auth/login', 'POST'],
            ['/api/users', 'GET'],
            ['/api/miniapp/auth/login', 'POST'],
            ['/api/miniapp/users', 'GET'],
            ['/api/miniapp/roles', 'GET'],
            ['/api/miniapp/account/profile', 'GET'],
            ['/api/admin/health', 'GET'],
        ]) {
            const response = await fetch(base + path, {
                method,
                headers: { Authorization: 'Bearer ' + adminToken },
            });
            expect(response.status, method + ' ' + path).toBe(404);
        }
    });
    it('后台和系统文档分别暴露各自路由，旧文档入口已移除', async () => {
        const adminResponse = await fetch(base + '/docs/admin-json');
        expect(adminResponse.status).toBe(200);
        const adminPaths = Object.keys((await adminResponse.json()).paths);
        expect(adminPaths).toContain('/api/admin/auth/login');
        expect(adminPaths).toContain('/api/admin/org/depts');
        expect(adminPaths).toContain('/api/admin/notifications');
        expect(adminPaths.every((path) => path.startsWith('/api/admin/'))).toBe(
            true,
        );

        const systemResponse = await fetch(base + '/docs/system-json');
        expect(systemResponse.status).toBe(200);
        expect(Object.keys((await systemResponse.json()).paths)).toEqual([
            '/api/health',
        ]);
        for (const path of ['/docs/admin', '/docs/system']) {
            expect((await fetch(base + path)).status, path).toBe(200);
        }
        for (const path of ['/docs', '/docs-json', '/docs/miniapp']) {
            expect((await fetch(base + path)).status, path).toBe(404);
        }
    });
    it('初始化可重复执行，未登录访问被拒绝', async () => {
        expect(await db.users.count({ where: { username: 'admin' } })).toBe(1);
        expect((await request('/users', 'GET', '')).status).toBe(401);
        expect((await login('admin', 'WrongPassword123')).status).toBe(401);
        const me = await request('/auth/me');
        expect(me.body.data.roles).toContain('super_admin');
        expect(me.body.data).not.toHaveProperty('passwordHash');
    });
    it('菜单和字典仅使用名称，翻译键已从数据库与接口移除', async () => {
        const columns = await db.$queryRaw<Array<{ column_name: string }>>`
            SELECT column_name FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name IN ('menus', 'dict_items')
              AND column_name = 'i18n_key'
        `;
        expect(columns).toEqual([]);

        const menu = await request('/menus', 'POST', adminToken, {
            label: '中文菜单验证',
            icon: 'menu',
            to: '/single-language-check',
        });
        expect(menu.status).toBe(200);
        expect(menu.body.data.label).toBe('中文菜单验证');
        expect(menu.body.data).not.toHaveProperty('i18nKey');
        const renamed = await request(
            `/menus/${menu.body.data.id}`,
            'PUT',
            adminToken,
            { label: '中文菜单改名' },
        );
        expect(renamed.body.data.label).toBe('中文菜单改名');
        expect(
            (
                await request(
                    `/menus/${menu.body.data.id}`,
                    'PUT',
                    adminToken,
                    { i18nKey: 'menu.removed' },
                )
            ).status,
        ).toBe(400);
        expect(
            (await request(`/menus/${menu.body.data.id}`, 'DELETE')).status,
        ).toBe(200);

        const item = await request(
            '/dict/types/user_status/items',
            'POST',
            adminToken,
            {
                value: 'single_language_check',
                label: '中文字典验证',
            },
        );
        expect(item.status).toBe(200);
        expect(item.body.data.label).toBe('中文字典验证');
        expect(item.body.data).not.toHaveProperty('i18nKey');
        expect(
            (
                await request(
                    `/dict/items/${item.body.data.id}`,
                    'PUT',
                    adminToken,
                    { i18nKey: 'dict.removed' },
                )
            ).status,
        ).toBe(400);
        expect(
            (await request(`/dict/items/${item.body.data.id}`, 'DELETE'))
                .status,
        ).toBe(200);
    });
    it('管理员可以读取完整基础模块，角色授权响应兼容前端', async () => {
        for (const route of [
            '/users',
            '/roles',
            '/menus',
            '/menus/tree',
            '/permissions',
            '/dict/types',
            '/logs',
            '/org/depts',
            '/org/depts/tree',
            '/org/posts',
            '/org/directory',
            '/notices',
            '/notices/mine',
            '/notifications',
            '/notifications/unread-count',
            '/account/profile',
            '/stats/overview',
        ]) {
            const result = await request(route);
            expect(
                result.status,
                route + ': ' + JSON.stringify(result.body),
            ).toBe(200);
        }
        const grants = await request('/roles/role-super-admin/menus');
        expect(grants.body.data.roleId).toBe('role-super-admin');
        expect(Array.isArray(grants.body.data.menus)).toBe(true);
    });
    it('创建按公告模块授权的普通员工', async () => {
        const role = await request('/roles', 'POST', adminToken, {
            name: '公告编辑',
            code: 'notice_editor',
            enabled: true,
        });
        expect(role.status).toBe(200);
        roleId = role.body.data.id;
        expect(
            (
                await request(
                    '/roles/' + roleId + '/menus',
                    'PUT',
                    adminToken,
                    {
                        menus: [{ menuId: 'menu-notices', permissions: '7' }],
                    },
                )
            ).status,
        ).toBe(200);
        const user = await request('/users', 'POST', adminToken, {
            username: 'notice-editor',
            email: 'editor@example.test',
            password,
            displayName: '公告编辑员',
            roleIds: [roleId],
            status: 'active',
            deptId: 'dept-company',
        });
        expect(user.status).toBe(200);
        editorId = user.body.data.id;
        const session = await login('notice-editor', password);
        expect(session.status).toBe(200);
        editorToken = session.body.data.accessToken;
    });
    it('公告的查看和编辑权不会扩散到用户、菜单、财务等其他资源', async () => {
        expect((await request('/notices', 'GET', editorToken)).status).toBe(
            200,
        );
        expect((await request('/users', 'GET', editorToken)).status).toBe(403);
        expect(
            (
                await request('/users/admin-user', 'PUT', editorToken, {
                    displayName: '不应写入',
                })
            ).status,
        ).toBe(403);
        expect((await request('/roles', 'GET', editorToken)).status).toBe(403);
        expect((await request('/menus/tree', 'GET', editorToken)).status).toBe(
            403,
        );
        expect(
            (await db.users.findUniqueOrThrow({ where: { id: 'admin-user' } }))
                .displayName,
        ).toBe('系统管理员');
        const menus = await request('/menus', 'GET', editorToken);
        expect(JSON.stringify(menus.body)).not.toContain('/settings/users');
        expect(JSON.stringify(menus.body)).toContain('/org/notices');
    });
    it('用户编辑权限允许保存未改变的角色，但禁止自行提权；列表排序生效', async () => {
        await request('/roles/' + roleId + '/menus', 'PUT', adminToken, {
            menus: [
                { menuId: 'menu-notices', permissions: '7' },
                { menuId: 'menu-users', permissions: '5' },
            ],
        });
        const unchanged = await request(
            '/users/' + editorId,
            'PUT',
            editorToken,
            {
                displayName: '公告专员',
                roleIds: [roleId],
            },
        );
        expect(unchanged.status).toBe(200);
        expect(
            (
                await request('/users/' + editorId, 'PUT', editorToken, {
                    roleIds: ['role-super-admin'],
                })
            ).status,
        ).toBe(403);
        const ascending = await request('/users?sort=username&order=asc');
        const descending = await request('/users?sort=username&order=desc');
        expect(
            ascending.body.data.map((u: { username: string }) => u.username),
        ).toEqual(['admin', 'notice-editor']);
        expect(
            descending.body.data.map((u: { username: string }) => u.username),
        ).toEqual(['notice-editor', 'admin']);
    });
    it('权限撤销和角色停用对现有令牌立即生效', async () => {
        expect(
            (
                await request(
                    '/roles/' + roleId + '/menus',
                    'PUT',
                    adminToken,
                    {
                        menus: [],
                    },
                )
            ).status,
        ).toBe(200);
        expect((await request('/notices', 'GET', editorToken)).status).toBe(
            403,
        );
        await request('/roles/' + roleId + '/menus', 'PUT', adminToken, {
            menus: [{ menuId: 'menu-notices', permissions: '7' }],
        });
        await request('/roles/' + roleId, 'PUT', adminToken, {
            enabled: false,
        });
        expect((await request('/notices', 'GET', editorToken)).status).toBe(
            403,
        );
        expect(
            (await request('/roles?enabled=true')).body.data.some(
                (r: { id: string }) => r.id === roleId,
            ),
        ).toBe(false);
        await request('/roles/' + roleId, 'PUT', adminToken, { enabled: true });
    });
    it('保护内置管理员和超级管理员授权', async () => {
        expect(
            (
                await request('/users/admin-user/status', 'PUT', adminToken, {
                    status: 'disabled',
                })
            ).status,
        ).toBe(403);
        expect(
            (
                await request(
                    '/roles/role-super-admin/menus',
                    'PUT',
                    adminToken,
                    {
                        menus: [],
                    },
                )
            ).status,
        ).toBe(403);
        expect(
            (
                await request(
                    '/roles/' + roleId + '/menus',
                    'PUT',
                    adminToken,
                    {
                        menus: [{ menuId: 'menu-notices', permissions: '-1' }],
                    },
                )
            ).status,
        ).toBe(400);
    });
    it('组织排序拒绝循环，关联岗位阻止删除组织', async () => {
        const dept = await request('/org/depts', 'POST', adminToken, {
            name: '施工管理组',
            parentId: 'dept-company',
        });
        expect(dept.status).toBe(200);
        const id = dept.body.data.id;
        const post = await request('/org/posts', 'POST', adminToken, {
            name: '施工负责人',
            deptId: id,
            category: 'production',
        });
        expect(post.status).toBe(200);
        expect((await request('/org/depts/' + id, 'DELETE')).status).toBe(400);
        expect(
            (
                await request('/org/depts/sort', 'PATCH', adminToken, {
                    items: [{ id: 'dept-company', parentId: id }],
                })
            ).status,
        ).toBe(400);
        expect((await request('/org/depts/unknown', 'GET')).status).toBe(404);
    });
    it('公告按收件范围显示，通知已读仅作用于本人', async () => {
        const created = await request('/notices', 'POST', adminToken, {
            title: '施工准备通知',
            content: '<p>请核对项目资料</p>',
            scopeTargets: [{ scopeType: 'user', targetId: editorId }],
        });
        expect(created.status).toBe(200);
        noticeId = created.body.data.id;
        expect(created.body.data.status).toBe('published');
        const mine = await request('/notices/mine', 'GET', editorToken);
        expect(
            mine.body.data.some((n: { id: string }) => n.id === noticeId),
        ).toBe(true);
        const notification = await db.notifications.findFirstOrThrow({
            where: { recipientId: editorId },
        });
        expect(
            (
                await request(
                    '/notifications/' + notification.id + '/read',
                    'POST',
                    adminToken,
                )
            ).status,
        ).toBe(404);
        expect(
            (
                await request(
                    '/notifications/' + notification.id + '/read',
                    'POST',
                    editorToken,
                )
            ).status,
        ).toBe(200);
        expect(
            (await request('/notices/' + noticeId, 'GET', editorToken)).body
                .data.myReadAt,
        ).not.toBeNull();
    });
    it('刷新令牌轮换，旧令牌及并发重放只能成功一次', async () => {
        const session = await login('notice-editor', password);
        const token = session.body.data.refreshToken;
        const results = await Promise.all([
            request('/auth/refresh', 'POST', '', { refreshToken: token }),
            request('/auth/refresh', 'POST', '', { refreshToken: token }),
        ]);
        expect(results.map((r) => r.status).sort()).toEqual([200, 401]);
        expect(
            (
                await request('/auth/refresh', 'POST', '', {
                    refreshToken: token,
                })
            ).status,
        ).toBe(401);
    });
    it('修改密码撤销所有已有会话，日志不保存密码', async () => {
        expect(
            (
                await request('/account/password', 'PUT', editorToken, {
                    currentPassword: password,
                    newPassword: 'ChangedPass456',
                })
            ).status,
        ).toBe(200);
        expect((await request('/auth/me', 'GET', editorToken)).status).toBe(
            401,
        );
        expect((await login('notice-editor', password)).status).toBe(401);
        expect((await login('notice-editor', 'ChangedPass456')).status).toBe(
            200,
        );
        const records = await db.logs.findMany();
        expect(JSON.stringify(records)).not.toContain(password);
        expect(JSON.stringify(records)).not.toContain('ChangedPass456');
    });
});
