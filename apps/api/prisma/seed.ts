import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { db } from '../src/db/client';
/**
 * 幂等初始化基础字典、菜单与管理员角色账号；管理员密码从服务端环境读取。
 */
export async function seed() {
    const password = process.env.SEED_ADMIN_PASSWORD;
    if (!password || password.length < 8)
        throw new Error('请先设置 SEED_ADMIN_PASSWORD，至少8位');
    const company = await db.depts.upsert({
        where: { id: 'dept-company' },
        create: { id: 'dept-company', name: '示例公司', code: 'APP' },
        update: {},
    });
    const role = await db.roles.upsert({
        where: { code: 'super_admin' },
        create: {
            id: 'role-super-admin',
            name: '超级管理员',
            code: 'super_admin',
            description: '平台基础配置与授权管理',
        },
        update: {},
    });
    const admin = await db.users.upsert({
        where: { id: 'admin-user' },
        create: {
            id: 'admin-user',
            username: 'admin',
            email: 'admin@example.test',
            displayName: '系统管理员',
            passwordHash: await bcrypt.hash(password, 10),
            deptId: company.id,
            employeeNo: 'APP001',
            employmentStatus: 'employed',
        },
        update: {},
    });
    await db.userRoles.upsert({
        where: { userId_roleId: { userId: admin.id, roleId: role.id } },
        create: { userId: admin.id, roleId: role.id },
        update: {},
    });
    const menuData = [
        {
            id: 'menu-settings',
            label: '系统管理',
            icon: 'settings',
            to: null,
            parentId: null,
            permissions: 0n,
            sort: 100,
        },
        {
            id: 'menu-users',
            label: '用户管理',
            icon: 'users',
            to: '/settings/users',
            parentId: 'menu-settings',
            permissions: 159n,
            sort: 60,
        },
        {
            id: 'menu-roles',
            label: '角色管理',
            icon: 'shield-check',
            to: '/settings/roles',
            parentId: 'menu-settings',
            permissions: 271n,
            sort: 50,
        },
        {
            id: 'menu-permissions',
            label: '权限说明',
            icon: 'key-round',
            to: '/settings/permissions',
            parentId: 'menu-settings',
            permissions: 1n,
            sort: 40,
        },
        {
            id: 'menu-menus',
            label: '菜单管理',
            icon: 'menu',
            to: '/settings/menus',
            parentId: 'menu-settings',
            permissions: 47n,
            sort: 30,
        },
        {
            id: 'menu-dicts',
            label: '字典管理',
            icon: 'book-open',
            to: '/settings/dicts',
            parentId: 'menu-settings',
            permissions: 15n,
            sort: 20,
        },
        {
            id: 'menu-logs',
            label: '操作日志',
            icon: 'scroll-text',
            to: '/settings/logs',
            parentId: 'menu-settings',
            permissions: 25n,
            sort: 10,
        },
        {
            id: 'menu-org',
            label: '组织中心',
            icon: 'network',
            to: null,
            parentId: null,
            permissions: 0n,
            sort: 90,
        },
        {
            id: 'menu-depts',
            label: '组织管理',
            icon: 'building-2',
            to: '/org/depts',
            parentId: 'menu-org',
            permissions: 15n,
            sort: 60,
        },
        {
            id: 'menu-posts',
            label: '岗位管理',
            icon: 'briefcase-business',
            to: '/org/posts',
            parentId: 'menu-org',
            permissions: 15n,
            sort: 50,
        },
        {
            id: 'menu-directory',
            label: '人员通讯录',
            icon: 'contact',
            to: '/org/directory',
            parentId: 'menu-org',
            permissions: 513n,
            sort: 40,
        },
        {
            id: 'menu-notices',
            label: '公告管理',
            icon: 'megaphone',
            to: '/org/notices',
            parentId: 'menu-org',
            permissions: 15n,
            sort: 30,
        },
        {
            id: 'menu-chart',
            label: '组织架构',
            icon: 'git-branch',
            to: '/org/chart',
            parentId: 'menu-org',
            permissions: 1n,
            sort: 20,
        },
    ];
    for (const menu of menuData) {
        await db.menus.upsert({
            where: { id: menu.id },
            create: menu,
            update: menu,
        });
        await db.roleMenus.upsert({
            where: { roleId_menuId: { roleId: role.id, menuId: menu.id } },
            create: {
                roleId: role.id,
                menuId: menu.id,
                permissions: menu.permissions,
            },
            update: { permissions: menu.permissions },
        });
    }
    const dicts = [
        {
            code: 'user_status',
            name: '账号状态',
            items: [
                ['active', '启用'],
                ['disabled', '停用'],
            ],
        },
        {
            code: 'log_type',
            name: '日志类型',
            items: [
                ['operation', '操作日志'],
                ['login', '登录日志'],
                ['api', '接口日志'],
                ['error', '错误日志'],
            ],
        },
        {
            code: 'notice_status',
            name: '公告状态',
            items: [
                ['draft', '待发布'],
                ['published', '已发布'],
                ['withdrawn', '已撤回'],
            ],
        },
    ];
    for (const dict of dicts) {
        await db.dictTypes.upsert({
            where: { code: dict.code },
            create: { code: dict.code, name: dict.name },
            update: { name: dict.name },
        });
        for (const [value, label] of dict.items) {
            await db.dictItems.upsert({
                where: { typeCode_value: { typeCode: dict.code, value } },
                create: { typeCode: dict.code, value, label },
                update: { label },
            });
        }
    }
}
if (process.argv[1]?.replaceAll('\\', '/').endsWith('/prisma/seed.ts'))
    seed()
        .then(() =>
            console.log('基础模板基础数据初始化完成（现有管理员密码未覆盖）'),
        )
        .finally(() => db.$disconnect());
