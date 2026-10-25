/**
 * 集中维护路由的公共访问、登录、后台布局和菜单授权要求。
 * 页面标题直接保存中文，动态详情标题按最长路径前缀匹配。
 */
export const PUBLIC_PATHS = ['/sign-in'] as const;

/**
 * 全屏页（渲染于 AdminLayout / AuthLayout 之外）：登录页 + 独立错误页。
 * 供布局分支（AppShell）与路由过渡编排（KeepAliveOutlet）共用；
 * catch-all 404 由路由 name 单独判定，不在此表。
 */
export const FULLSCREEN_PATHS = ['/sign-in', '/403', '/404', '/500'] as const;

/**
 * 「登录即可访问」的路径白名单：不参与菜单权限校验（后端不管理这些页面）。
 */
export const LOGIN_REQUIRED_PATHS = ['/', '/account', '/my-notices'] as const;

/**
 * 「登录即可访问」的动态路由前缀：仅需登录态，不走菜单权限校验。
 *
 * 目前仅公告详情（/org/notices/:noticeId，通知消费入口）：站内信推送给
 * 发布范围内用户，接收者无需拥有公告管理菜单；可见性由详情接口服务端
 * 校验。前缀带尾斜杠，列表页 /org/notices 不在豁免范围（仍走菜单权限门卫）。
 */
export const LOGIN_REQUIRED_PREFIXES = ['/org/notices/'] as const;

/**
 * 需要菜单权限校验的路径（新增受菜单管理的页面时在此登记）。
 */
export const MENU_REQUIRED_PATHS = [
    '/org/depts',
    '/org/posts',
    '/org/directory',
    '/org/notices',
    '/org/chart',
    '/settings/users',
    '/settings/roles',
    '/settings/permissions',
    '/settings/menus',
    '/settings/dicts',
    '/settings/logs',
    '/playground/code-block',
    '/playground/count-to/number-flow',
    '/playground/count-to/animated-counter',
    '/playground/ai-kit/fluid-orb',
    '/playground/ai-kit/grid-reveal',
    '/playground/ai-kit/matrix-orb',
    '/playground/github-activity',
    '/playground/theme-switch-animation',
    '/playground/loaders',
    '/playground/okr-tree',
] as const;

/**
 * 按页面路径提供固定中文文档标题，同时用于面包屑。
 */
export const ROUTE_TITLES: Record<string, string> = {
    '/': '控制台',
    '/sign-in': '用户登录',
    // 独立全屏错误页：与 React 端各路由 staticData.titleText 同键（errors.*.title，
    // 即错误页正文标题本身），此前缺失导致文档标题回退为裸品牌名。
    '/403': '禁止访问',
    '/404': '页面不存在',
    '/500': '出错了',
    '/account': '我的账户',
    '/my-notices': '我的公告',
    '/org/depts': '组织管理',
    '/org/posts': '岗位管理',
    '/org/directory': '人员通讯录',
    '/org/notices': '公告管理',
    '/org/chart': '架构图谱',
    '/exception/403': '403',
    '/exception/404': '404',
    '/exception/500': '500',
    '/settings/users': '用户管理',
    '/settings/roles': '角色管理',
    '/settings/permissions': '权限管理',
    '/settings/menus': '菜单管理',
    '/settings/dicts': '字典管理',
    '/settings/logs': '日志管理',
    // 演示场（菜单页，标题直接复用菜单键，同 exception 口径）
    '/playground/code-block': '代码块',
    '/playground/count-to/number-flow': 'Number Flow',
    '/playground/count-to/animated-counter': 'Animated Counter',
    '/playground/ai-kit/fluid-orb': 'Fluid Orb',
    '/playground/ai-kit/grid-reveal': 'Grid Reveal',
    '/playground/ai-kit/matrix-orb': 'Matrix Orb',
    '/playground/github-activity': 'GitHub Activity',
    '/playground/theme-switch-animation': '主题切换动画',
    '/playground/loaders': '加载动画',
    '/playground/okr-tree': '组织架构树',
};

/**
 * 登录即可访问且不在菜单树中的页面图标，保存不带 i-lucide- 前缀的名称。
 */
export const ROUTE_TAB_ICONS: Record<string, string> = {
    '/account': 'id-card',
    '/my-notices': 'bell-ring',
};

/**
 * 解析路径的标签栏图标名（无登记返回 undefined；TagsBar 拼 i-lucide- 前缀）。
 */
export function resolveRouteTabIcon(pathname: string): string | undefined {
    return ROUTE_TAB_ICONS[pathname];
}

/**
 * 公共页判定（守卫放行：无需登录）。
 */
export function isPublicPath(pathname: string): boolean {
    return (PUBLIC_PATHS as readonly string[]).includes(pathname);
}

/**
 * 全屏页判定（不套 AdminLayout；布局分支与路由过渡编排共用）。
 */
export function isFullscreenPath(pathname: string): boolean {
    return (FULLSCREEN_PATHS as readonly string[]).includes(pathname);
}

/**
 * 动态详情页面的中文标题前缀映射，精确路径未匹配时取最长匹配前缀。
 */
export const ROUTE_TITLE_PREFIXES: Record<string, string> = {
    '/org/notices/': '公告管理',
};

/**
 * 读取页面中文标题，先精确匹配路径，再取最长动态前缀；无匹配时返回 undefined。
 */
export function resolveRouteTitle(pathname: string): string | undefined {
    const exact = ROUTE_TITLES[pathname];

    if (exact) return exact;

    let matched: string | undefined;
    let matchedLength = 0;

    for (const [prefix, key] of Object.entries(ROUTE_TITLE_PREFIXES)) {
        if (pathname.startsWith(prefix) && prefix.length > matchedLength) {
            matched = key;
            matchedLength = prefix.length;
        }
    }

    return matched;
}

/**
 * 使用品牌和登录表单布局的路径，目前只包含登录页。
 */
export const AUTH_LAYOUT_PATHS = ['/sign-in'] as const;

/**
 * 认证布局判定（AppShell 布局分支用）。
 */
export function isAuthLayoutPath(pathname: string): boolean {
    return (AUTH_LAYOUT_PATHS as readonly string[]).includes(pathname);
}

/**
 * 判断是否使用后台布局：排除全屏页和兜底 404 路由，与登录要求分别判定。
 */
export function isAdminLayoutRoute(route: {
    path: string;
    name?: unknown;
}): boolean {
    return !isFullscreenPath(route.path) && route.name !== '/[...all]';
}

/**
 * 登录可达判定：精确白名单路径，或命中动态前缀（通知消费路由）。
 */
export function isLoginRequiredPath(pathname: string): boolean {
    return (
        (LOGIN_REQUIRED_PATHS as readonly string[]).includes(pathname) ||
        LOGIN_REQUIRED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
    );
}

/**
 * 菜单权限校验判定。
 */
export function isMenuRequiredPath(pathname: string): boolean {
    return (MENU_REQUIRED_PATHS as readonly string[]).includes(pathname);
}
