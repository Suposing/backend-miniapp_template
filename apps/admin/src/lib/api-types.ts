export type {
    ApiEnvelope,
    ApiListEnvelope,
    ApiError,
    PermissionItem,
} from '@app/shared/api';

/**
 * 认证用户（/auth/login、/auth/me 返回）
 */
export interface AuthUser {
    /**
     * 内部用户 ID。
     */
    id: string;
    /**
     * 内部账号的登录用户名。
     */
    username: string;
    /**
     * 界面展示的用户姓名或昵称。
     */
    displayName: string;
    /**
     * 用户邮箱（前端统一用户信息展示，侧边栏次行）
     */
    email: string;
    /**
     * 头像 URL（侧边栏 / 我的账户展示）
     */
    avatar: string | null;
    /**
     * 联系电话；null 表示未设置。
     */
    phone: string | null;
    /**
     * 当前账号的个人标签列表，可在我的账户中维护。
     */
    tags: string[];
    /**
     * 个人网站裸域名（只读；展示前缀 https:// 由前端拼接）
     */
    website: string | null;
    /**
     * GitHub 用户名裸值（只读）
     */
    githubUsername: string | null;
    /**
     * X（Twitter）用户名裸值（只读）
     */
    xUsername: string | null;
    /**
     * 当前账号有效角色的编码列表。
     */
    roles: string[];
    /**
     * 操作权限聚合位，服务端通过十进制字符串下发。
     * 前端兼容 number；具体操作判权使用当前菜单的 userPermissions，不能以全局聚合位授权。
     */
    permissions: string | number;
}

/**
 * 内部账号登录成功后的令牌与用户资料。
 */
export interface LoginResponse {
    /**
     * 访问令牌，仅用于 Authorization；禁止写入日志。
     */
    accessToken: string;
    /**
     * 刷新会话令牌，刷新轮换后使用新值；禁止写入日志。
     */
    refreshToken: string;
    /**
     * 当前用户的安全资料与授权快照。
     */
    user: AuthUser;
}

/**
 * 模板保留的演示登录请求类型；当前基础模板后端未启用演示免密登录。
 */
export type DemoLoginKind = 'admin' | 'random';

/**
 * 刷新响应（refreshToken 轮换，旧 token 作废）
 */
export interface RefreshResponse {
    /**
     * 访问令牌，仅用于 Authorization；禁止写入日志。
     */
    accessToken: string;
    /**
     * 刷新会话令牌，刷新轮换后使用新值；禁止写入日志。
     */
    refreshToken: string;
}

/**
 * 菜单节点（/menus 树，路由层的导航数据源）
 */
export interface MenuNode {
    /**
     * 菜单资源 ID。
     */
    id: string;
    /**
     * 界面展示的中文名称或控件标签。
     */
    label: string;

    /**
     * 图标名称，按当前组件的图标约定渲染。
     */
    icon: string;
    /**
     * 页面路由或外部链接；空值表示没有直接跳转目标。
     */
    to?: string | null;
    /**
     * 父级记录 ID；null 表示顶层节点。
     */
    parentId?: string | null;
    /**
     * 菜单排序值，导航默认降序，管理树支持指定方向。
     */
    sort: number;
    /**
     * 是否缓存页面组件状态。
     */
    keepAlive: boolean;
    /**
     * 是否在导航中隐藏；不代表撤销路由或接口授权。
     */
    hideInMenu: boolean;
    /**
     * 是否启用；true 启用，false 停用。
     */
    enabled: boolean;
    /**
     * 组件初始化时是否展开内容。
     */
    defaultOpen: boolean;
    /**
     * bigint 位掩码字符串（该菜单所需权限集）
     */
    permissions: string;
    /**
     * 当前登录用户在此菜单的实际授权位（登录态返回；null 表示未下发）
     */
    userPermissions?: string | null;
    /**
     * 当前节点的直接子节点列表；空数组表示叶节点。
     */
    children?: MenuNode[];
}

/**
 * 列表通用查询参数（后端各 QueryDTO 均含 page/pageSize，多数含 search）
 */
export interface ListQueryParams {
    /**
     * 页码，从 1 开始。
     */
    page?: number;
    /**
     * 每页记录数。
     */
    pageSize?: number;
    /**
     * 当前提交并生效的搜索文本。
     */
    search?: string;
    [key: string]: unknown;
}

/* ---------------------------------------------------------------------------
 * 业务实体类型（与 admin.yaml 各模块 schema 对齐；M1：用户/角色/组织中心）
 * ------------------------------------------------------------------------- */

/**
 * 用户状态（users.status）
 */
export type UserStatus = 'active' | 'disabled';

/**
 * 用户角色摘要（users 响应内嵌的 roles 数组项）
 */
export interface UserRoleSummary {
    /**
     * 内部角色 ID。
     */
    id: string;
    /**
     * 记录或选项的展示名称。
     */
    name: string;
    /**
     * 稳定的业务编码。
     */
    code: string;
}

/**
 * 我的账户详情（GET /account/profile，；当前后台使用的）
 */
export interface AccountProfile {
    /**
     * 内部用户 ID。
     */
    id: string;
    /**
     * 内部账号的登录用户名。
     */
    username: string;
    /**
     * 用户邮箱地址。
     */
    email: string;
    /**
     * 界面展示的用户姓名或昵称。
     */
    displayName: string;
    /**
     * 头像访问地址；null 表示未设置。
     */
    avatar: string | null;
    /**
     * 联系电话；null 表示未设置。
     */
    phone: string | null;
    /**
     * 当前账号的个人标签列表，可在我的账户中维护。
     */
    tags: string[];
    /**
     * 个人网站裸域名（如 baiwumm.com，不带协议；展示前缀由前端拼接）
     */
    website: string | null;
    /**
     * GitHub 用户名裸值（展示前缀 https://github.com/ 由前端拼接）
     */
    githubUsername: string | null;
    /**
     * X（Twitter）用户名裸值（展示前缀 https://x.com/ 由前端拼接）
     */
    xUsername: string | null;
    /**
     * 账号启停状态：active 正常，disabled 停用。
     */
    status: UserStatus;
    /**
     * 当前账号或记录关联的角色摘要列表。
     */
    roles: UserRoleSummary[];
    /**
     * 记录创建时刻，接口使用带时区的日期时间字符串。
     */
    createdAt: string;
    /**
     * 记录最后更新时间，接口使用带时区的日期时间字符串。
     */
    updatedAt: string;
    /**
     * 最近一次登录成功时间（从未登录为 null）
     */
    lastLoginAt: string | null;
}

/**
 * PUT /account/profile 请求体（字段缺省表示不修改）
 */
export interface UpdateAccountProfileInput {
    /**
     * 界面展示的用户姓名或昵称。
     */
    displayName?: string;
    /**
     * 联系电话；null 表示未设置。
     */
    phone?: string | null;
    /**
     * 当前账号的个人标签列表，可在我的账户中维护。
     */
    tags?: string[];
    /**
     * 个人网站裸域名（null 清空；提交时服务端自动剥 http(s):// 前缀）
     */
    website?: string | null;
    /**
     * GitHub 用户名裸值（null 清空；服务端自动剥主页前缀）
     */
    githubUsername?: string | null;
    /**
     * X 用户名裸值（null 清空；服务端自动剥主页前缀）
     */
    xUsername?: string | null;
}

/**
 * PUT /account/email 请求体（需当前密码确认）
 */
export interface UpdateAccountEmailInput {
    /**
     * 用户邮箱地址。
     */
    email: string;
    /**
     * 用于确认当前账号身份的密码，只在请求中提交，禁止记录。
     */
    currentPassword: string;
}

/**
 * PUT /account/password 请求体（成功后全端强制下线，需重新登录）
 */
export interface UpdateAccountPasswordInput {
    /**
     * 用于确认当前账号身份的密码，只在请求中提交，禁止记录。
     */
    currentPassword: string;
    /**
     * 需要设置的新密码；格式及跨字段约束由密码策略校验。
     */
    newPassword: string;
}

/**
 * 在职状态：employed 在职、resigned 离职；与账号启停状态独立。
 */
export type EmploymentStatus = 'employed' | 'resigned';

/**
 * 组织/岗位通用状态
 */
export type DeptStatus = 'enabled' | 'disabled';

/**
 * 岗位类别，当前后端支持 management、professional、production。
 */
export type PostCategory = string;

/**
 * 用户岗位摘要（user_posts → posts 联查，主岗在前；）
 */
export interface UserPostSummary {
    /**
     * 内部岗位 ID。
     */
    id: string;
    /**
     * 记录或选项的展示名称。
     */
    name: string;
    /**
     * 是否主岗
     */
    isMain: boolean;
    /**
     * 所属组织路径；当前账号详情未回填此可选字段。
     */
    deptPath?: string;
}

/**
 * 用户实体（/users）
 */
export interface User {
    /**
     * 内部用户 ID。
     */
    id: string;
    /**
     * 内部账号的登录用户名。
     */
    username: string;
    /**
     * 用户邮箱地址。
     */
    email: string;
    /**
     * 界面展示的用户姓名或昵称。
     */
    displayName: string;
    /**
     * 头像访问地址；null 表示未设置。
     */
    avatar: string | null;
    /**
     * 账号启停状态：active 正常，disabled 停用。
     */
    status: UserStatus;
    /**
     * 账号会话版本；递增后旧版本令牌失效。
     */
    tokenVersion: number;
    /**
     * 当前账号或记录关联的角色摘要列表。
     */
    roles: UserRoleSummary[];
    /**
     * 记录创建时刻，接口使用带时区的日期时间字符串。
     */
    createdAt: string;
    /**
     * 记录最后更新时间，接口使用带时区的日期时间字符串。
     */
    updatedAt: string;
    /**
     * 最近一次登录成功时间（从未登录为 null）
     */
    lastLoginAt: string | null;
    /**
     * 个人网站裸域名（只读；展示前缀 https:// 由前端拼接）
     */
    website: string | null;
    /**
     * GitHub 用户名裸值（只读）
     */
    githubUsername: string | null;
    /**
     * X（Twitter）用户名裸值（只读）
     */
    xUsername: string | null;
    /**
     * 所属组织 ID / 名称（组织中心，可空）
     */
    deptId: string | null;
    /**
     * 所属组织名称；null 表示未分配或无法读取。
     */
    deptName: string | null;
    /**
     * 工号（可空）
     */
    employeeNo: string | null;
    /**
     * 入职日期（YYYY-MM-DD，可空）
     */
    entryDate: string | null;
    /**
     * 在职状态，与账号启停独立；服务端对未设置状态的输出仍可能为空，展示时应按当前页面规则兜底。
     */
    employmentStatus: EmploymentStatus;
    /**
     * 性别（阶段 2 补充；male 男 / female 女，null = 未设置）
     */
    gender: 'male' | 'female' | null;
    /**
     * 关联岗位（user_posts → posts 联查，主岗在前；）
     */
    posts: UserPostSummary[];
}

/**
 * 角色关联用户摘要（管理列表回填；按分配时间倒序最多 3 个）
 */
export interface RoleReader {
    /**
     * 内部用户 ID。
     */
    id: string;
    /**
     * 用户姓名（display_name）
     */
    name: string;
    /**
     * 用户头像 URL（未设置时为 null）
     */
    avatar: string | null;
}

/**
 * 角色（/roles）
 */
export interface Role {
    /**
     * 内部角色 ID。
     */
    id: string;
    /**
     * 记录或选项的展示名称。
     */
    name: string;
    /**
     * 稳定的业务编码。
     */
    code: string;
    /**
     * 供使用者理解当前项目或操作的说明。
     */
    description: string | null;
    /**
     * 是否启用；true 启用，false 停用。
     */
    enabled: boolean;
    /**
     * 管理列表或组织树的排序值，默认降序。
     */
    sort: number;
    /**
     * 未删除的关联账号数量；当前角色列表不按在职状态过滤。
     */
    userCount?: number;
    /**
     * 前端兼容的关联账号摘要字段；当前后端列表以 users 字段返回摘要。
     */
    readers?: RoleReader[];
    /**
     * 记录创建时刻，接口使用带时区的日期时间字符串。
     */
    createdAt: string;
    /**
     * 记录最后更新时间，接口使用带时区的日期时间字符串。
     */
    updatedAt: string;
}

/**
 * 组织树节点（GET /org/depts/tree，含停用组织）
 */
export interface DeptTreeNode {
    /**
     * 内部组织 ID。
     */
    id: string;
    /**
     * 父级记录 ID；null 表示顶层节点。
     */
    parentId: string | null;
    /**
     * 记录或选项的展示名称。
     */
    name: string;
    /**
     * 稳定的业务编码。
     */
    code: string | null;
    /**
     * 负责人用户 ID（补充；编辑弹窗回显负责人需要）
     */
    leaderId: string | null;
    /**
     * 组织负责人姓名；null 表示未指定或无法读取。
     */
    leaderName: string | null;
    /**
     * 负责人头像 URL（图谱卡片展示用）
     */
    leaderAvatar: string | null;
    /**
     * 管理列表或组织树的排序值，默认降序。
     */
    sort: number;
    /**
     * 启停状态：enabled 启用，disabled 停用。
     */
    status: DeptStatus;
    /**
     * 当前节点的直接子节点列表；空数组表示叶节点。
     */
    children: DeptTreeNode[];
}

/* ---------------------------------------------------------------------------
 * 组织管理模块（/org/depts*，契约 v1.6.0 阶段 1）
 * ------------------------------------------------------------------------- */

/**
 * 组织（GET /org/depts 分页列表项）
 */
export interface Dept {
    /**
     * 内部组织 ID。
     */
    id: string;
    /**
     * 父级记录 ID；null 表示顶层节点。
     */
    parentId: string | null;
    /**
     * 记录或选项的展示名称。
     */
    name: string;
    /**
     * 稳定的业务编码。
     */
    code: string | null;
    /**
     * 组织负责人的内部用户 ID；null 表示未指定。
     */
    leaderId: string | null;
    /**
     * 组织负责人姓名；null 表示未指定或无法读取。
     */
    leaderName: string | null;
    /**
     * 管理列表或组织树的排序值，默认降序。
     */
    sort: number;
    /**
     * 启停状态：enabled 启用，disabled 停用。
     */
    status: DeptStatus;
    /**
     * 记录创建时刻，接口使用带时区的日期时间字符串。
     */
    createdAt: string;
    /**
     * 记录最后更新时间，接口使用带时区的日期时间字符串。
     */
    updatedAt: string;
}

/**
 * 创建组织载荷（parentId null = 顶级组织）
 */
export interface DeptCreateInput {
    /**
     * 记录或选项的展示名称。
     */
    name: string;
    /**
     * null = 不设置编码
     */
    code: string | null;
    /**
     * 父级记录 ID；null 表示顶层节点。
     */
    parentId: string | null;
    /**
     * null = 不设置负责人
     */
    leaderId: string | null;
    /**
     * 管理列表或组织树的排序值，默认降序。
     */
    sort: number;
    /**
     * 启停状态：enabled 启用，disabled 停用。
     */
    status: DeptStatus;
}

/**
 * 更新组织载荷（字段语义同创建；parentId null = 移为顶级）
 */
export type DeptUpdateInput = DeptCreateInput;

/**
 * 组织排序项（PATCH /org/depts/sort 整批提交）
 */
export interface DeptSortItem {
    /**
     * 内部组织 ID。
     */
    id: string;
    /**
     * 父级记录 ID；null 表示顶层节点。
     */
    parentId: string | null;
    /**
     * 管理列表或组织树的排序值，默认降序。
     */
    sort: number;
}

/**
 * 岗位（/org/posts）
 */
export interface Post {
    /**
     * 内部岗位 ID。
     */
    id: string;
    /**
     * 所属或筛选组织的内部 ID。
     */
    deptId: string;
    /**
     * 所属组织完整路径，如「集团/技术研发中心/前端开发部」
     */
    deptPath: string;
    /**
     * 记录或选项的展示名称。
     */
    name: string;
    /**
     * 岗位类别：management 管理、professional 专业、production 生产。
     */
    category: PostCategory;
    /**
     * 岗位职级（P1-P10 / M1-M5），空串表示未设置
     */
    rank: string;
    /**
     * 启停状态：enabled 启用，disabled 停用。
     */
    status: DeptStatus;
    /**
     * 在职人数（穿透查看入口）
     */
    userCount: number;
    /**
     * 记录创建时刻，接口使用带时区的日期时间字符串。
     */
    createdAt: string;
    /**
     * 记录最后更新时间，接口使用带时区的日期时间字符串。
     */
    updatedAt: string;
}

/**
 * 创建岗位请求体（阶段 2）
 */
export interface PostCreateInput {
    /**
     * 记录或选项的展示名称。
     */
    name: string;
    /**
     * 所属或筛选组织的内部 ID。
     */
    deptId: string;
    /**
     * 岗位类别：management 管理、professional 专业、production 生产。
     */
    category: PostCategory;
    /**
     * 岗位职级说明；空字符串表示未设置。
     */
    rank?: string;
    /**
     * 启停状态：enabled 启用，disabled 停用。
     */
    status?: DeptStatus;
}

/**
 * 更新岗位请求体（字段缺省表示不修改）
 */
export interface PostUpdateInput {
    /**
     * 记录或选项的展示名称。
     */
    name?: string;
    /**
     * 所属或筛选组织的内部 ID。
     */
    deptId?: string;
    /**
     * 岗位类别：management 管理、professional 专业、production 生产。
     */
    category?: PostCategory;
    /**
     * 岗位职级说明；空字符串表示未设置。
     */
    rank?: string;
    /**
     * 启停状态：enabled 启用，disabled 停用。
     */
    status?: DeptStatus;
}

/**
 * 人员通讯录条目（/org/directory 与 /org/posts/:id/members 共用；）
 */
export interface DirectoryEntry {
    /**
     * 内部用户 ID。
     */
    id: string;
    /**
     * 内部账号的登录用户名。
     */
    username: string;
    /**
     * 界面展示的用户姓名或昵称。
     */
    displayName: string;
    /**
     * 头像访问地址；null 表示未设置。
     */
    avatar: string | null;
    /**
     * 员工工号；null 表示未设置。
     */
    employeeNo: string | null;
    /**
     * 所属或筛选组织的内部 ID。
     */
    deptId: string | null;
    /**
     * 所属组织完整路径，如「集团/技术部/前端组」
     */
    deptPath: string | null;
    /**
     * 主岗的内部岗位 ID；null 表示无主岗。
     */
    mainPostId: string | null;
    /**
     * 主岗名称；null 表示无主岗或无法读取。
     */
    mainPostName: string | null;
    /**
     * 联系电话；null 表示未设置。
     */
    phone: string | null;
    /**
     * 用户邮箱地址。
     */
    email: string | null;
    /**
     * 入职日期（YYYY-MM-DD，可空）
     */
    entryDate: string | null;
    /**
     * 在职状态：employed 在职、resigned 离职，与账号启停独立；空值处理由具体接口决定。
     */
    employmentStatus: EmploymentStatus;
}

/**
 * 创建用户请求体
 */
export interface CreateUserInput {
    /**
     * 内部账号的登录用户名。
     */
    username: string;
    /**
     * 用户邮箱地址。
     */
    email: string;
    /**
     * 需要校验或展示强度的密码；只用于当前操作，不记录到日志。
     */
    password: string;
    /**
     * 界面展示的用户姓名或昵称。
     */
    displayName: string;
    /**
     * 账号启停状态：active 正常，disabled 停用。
     */
    status?: UserStatus;
    /**
     * 关联角色 ID 列表。
     */
    roleIds: string[];
    /**
     * 初始所属组织 ID，须存在且未删除；null 表示无组织。
     */
    deptId?: string | null;
    /**
     * 员工工号；null 表示未设置。
     */
    employeeNo?: string | null;
    /**
     * 入职日期（YYYY-MM-DD）
     */
    entryDate?: string | null;
    /**
     * 在职状态：employed 在职、resigned 离职，与账号启停独立；空值处理由具体接口决定。
     */
    employmentStatus?: EmploymentStatus | null;
    /**
     * 性别（null = 未设置）
     */
    gender?: 'male' | 'female' | null;
    /**
     * 初始关联岗位 ID 列表，最多 20 个；岗位须存在且未删除。
     */
    postIds?: string[];
    /**
     * 主岗（须在 postIds 中）
     */
    mainPostId?: string | null;
}

/* ---------------------------------------------------------------------------
 * 角色模块（/roles）
 * ------------------------------------------------------------------------- */

/**
 * 角色创建/编辑载荷（code 创建后锁定，UpdateRoleInput 不含 code）
 */
export interface SaveRoleInput {
    /**
     * 记录或选项的展示名称。
     */
    name: string;
    /**
     * 稳定的业务编码。
     */
    code: string;
    /**
     * 供使用者理解当前项目或操作的说明。
     */
    description?: string;
    /**
     * 是否启用；true 启用，false 停用。
     */
    enabled: boolean;
    /**
     * 管理列表或组织树的排序值，默认降序。
     */
    sort?: number;
}

/**
 * 角色-菜单授权记录（位掩码字符串：该角色在此菜单的实际授权位）
 */
export interface RoleMenuGrant {
    /**
     * 菜单资源的内部 ID。
     */
    menuId: string;
    /**
     * 操作权限位的十进制字符串，避免 bigint 精度丢失。
     */
    permissions: string;
}

/**
 * 角色菜单授权载荷（GET / PUT /roles/:id/menus）
 */
export interface RoleMenusPayload {
    /**
     * 内部角色 ID。
     */
    roleId: string;
    /**
     * 该角色的菜单授权列表；更新时按全量替换处理。
     */
    menus: RoleMenuGrant[];
}

/**
 * 更新用户请求体（不含 username/password——
 * 用户名创建后锁定，改密走 POST /users/:id/reset-password）。
 * roleIds 传数组（含空数组）为全量替换语义，缺省表示不修改。
 * deptId/employeeNo/entryDate/employmentStatus 为
 * 「undefined 不修改 / null 清空」语义；postIds 同 roleIds 全量替换。
 */
export interface UpdateUserInput {
    /**
     * 用户邮箱地址。
     */
    email?: string;
    /**
     * 界面展示的用户姓名或昵称。
     */
    displayName?: string;
    /**
     * 头像访问地址；null 表示未设置。
     */
    avatar?: string | null;
    /**
     * 账号启停状态：active 正常，disabled 停用。
     */
    status?: UserStatus;
    /**
     * 角色全量替换列表；空数组清空，省略保留。发生角色变化时要求超级管理员。
     */
    roleIds?: string[];
    /**
     * 所属或筛选组织的内部 ID。
     */
    deptId?: string | null;
    /**
     * 员工工号；null 表示未设置。
     */
    employeeNo?: string | null;
    /**
     * 入职日期，格式为 YYYY-MM-DD；null 表示未设置。
     */
    entryDate?: string | null;
    /**
     * 在职状态：employed 在职、resigned 离职，与账号启停独立；空值处理由具体接口决定。
     */
    employmentStatus?: EmploymentStatus | null;
    /**
     * 性别（undefined 不修改 / null 清空为未设置）
     */
    gender?: 'male' | 'female' | null;
    /**
     * 岗位全量替换列表；空数组清空，省略保留。
     */
    postIds?: string[];
    /**
     * 主岗的内部岗位 ID；null 表示无主岗。
     */
    mainPostId?: string | null;
}

/* ---------------------------------------------------------------------------
 * 字典模块（/dict/*，契约 v1.4：类型/项均无分页，全量数组）
 * ------------------------------------------------------------------------- */

/**
 * 字典类型（以 code 定位，code 创建后不可变更）
 */
export interface DictType {
    /**
     * 字典记录主键。
     */
    id: string;
    /**
     * 稳定的业务编码。
     */
    code: string;
    /**
     * 记录或选项的展示名称。
     */
    name: string;
    /**
     * 供使用者理解当前项目或操作的说明。
     */
    description: string | null;
    /**
     * 记录创建时刻，接口使用带时区的日期时间字符串。
     */
    createdAt: string;
    /**
     * 记录最后更新时间，接口使用带时区的日期时间字符串。
     */
    updatedAt: string;
}

/**
 * 字典项（挂在类型下，按 sort、创建时间升序）
 */
export interface DictItem {
    /**
     * 字典记录主键。
     */
    id: string;
    /**
     * 所属字典类型的唯一编码。
     */
    typeCode: string;
    /**
     * 当前字段的业务键值或控件值。
     */
    value: string;
    /**
     * 界面展示的中文名称或控件标签。
     */
    label: string;

    /**
     * 字典项显示顺序，数值越小越靠前。
     */
    sort: number;
    /**
     * 是否启用；true 启用，false 停用。
     */
    enabled: boolean;
}
/* ---------------------------------------------------------------------------
 * 日志模块（/logs）
 * ------------------------------------------------------------------------- */

/**
 * 日志分类：操作、登录、接口访问和错误。
 */
export type LogType = 'operation' | 'login' | 'api' | 'error';

/**
 * 日志（系统自动写入；操作人摘要为 left join users，可空）
 */
export interface Log {
    /**
     * 日志记录 ID。
     */
    id: string;
    /**
     * 日志类别：operation 操作、login 登录、api 接口、error 错误。
     */
    type: LogType;
    /**
     * 内部用户 ID。
     */
    userId: string | null;
    /**
     * 内部账号的登录用户名。
     */
    username: string | null;
    /**
     * 界面展示的用户姓名或昵称。
     */
    displayName: string | null;
    /**
     * 用户邮箱地址。
     */
    email: string | null;
    /**
     * 头像访问地址；null 表示未设置。
     */
    avatar: string | null;
    /**
     * 稳定的业务动作标识或接口请求动作。
     */
    action: string;
    /**
     * 请求来源 IP；null 表示未采集。
     */
    ip: string | null;
    /**
     * 客户端 User-Agent；null 表示未采集。
     */
    userAgent: string | null;
    /**
     * 采样亮度方差，用于优先拆分细节较多的网格。
     */
    detail: unknown;
    /**
     * 记录创建时刻，接口使用带时区的日期时间字符串。
     */
    createdAt: string;
}

/* ---------------------------------------------------------------------------
 * 公告 + 站内信（契约 v1.7.0 阶段 3，/notices /notifications）
 * ------------------------------------------------------------------------- */

/**
 * 发布范围类型（dept 按组织 / post 按岗位 / user 按具体人员）
 */
export type NoticeScopeType = 'dept' | 'post' | 'user';

/**
 * 公告状态：draft（含定时未到）/ published / withdrawn（撤回）
 */
export type NoticeStatus = 'draft' | 'published' | 'withdrawn';

/**
 * 发布范围单项
 */
export interface NoticeScope {
    /**
     * 公告范围类型：dept 为组织，post 为岗位，user 为指定人员。
     */
    scopeType: NoticeScopeType;
    /**
     * 范围目标 ID，所属实体由 scopeType 决定。
     */
    targetId: string;
    /**
     * 目标展示名（列表与详情接口均回填；目标已删除时为 null）
     */
    targetName: string | null;
}

/**
 * 已读人员摘要（管理列表回填；按已读时间倒序最多 3 个）
 */
export interface NoticeReader {
    /**
     * 内部用户 ID。
     */
    id: string;
    /**
     * 阅读人员的显示姓名。
     */
    name: string;
    /**
     * 用户头像 URL（未设置时为 null）
     */
    avatar: string | null;
}

/**
 * 公告实体（/notices，管理列表与我的公告共用；）
 */
export interface Notice {
    /**
     * 公告记录 ID。
     */
    id: string;
    /**
     * 界面展示的标题。
     */
    title: string;
    /**
     * 富文本内容（Tiptap HTML；列表不含，详情返回）
     */
    content?: string;
    /**
     * 公告发布人的内部用户 ID；null 表示无法关联。
     */
    publisherId: string | null;
    /**
     * 公告发布人姓名；null 表示无法读取。
     */
    publisherName: string | null;
    /**
     * 发布人邮箱（发布人被删除时为 null）
     */
    publisherEmail: string | null;
    /**
     * 发布人头像（发布人被删除时为 null）
     */
    publisherAvatar: string | null;
    /**
     * 是否在公告列表中置顶。
     */
    isTop: boolean;
    /**
     * 公告发布状态：draft 待发布、published 已发布、withdrawn 已撤回。
     */
    status: NoticeStatus;
    /**
     * 发布时间（定时发布为计划时间）
     */
    publishTime: string;
    /**
     * 范围目标条数（详情返回；列表为 undefined）
     */
    scopeCount?: number;
    /**
     * 范围明细（列表接口返回，targetName 已回填；内容不随列表返回）
     */
    scopes?: NoticeScope[];
    /**
     * 已读人数
     */
    readCount: number;
    /**
     * 最近已读人员（按已读时间倒序最多 3 个；管理列表回填，总数用 readCount）
     */
    readers?: NoticeReader[];
    /**
     * 范围内总人数（去重）
     */
    totalCount: number;
    /**
     * 已读率 0-100；totalCount 为 0 时 null
     */
    readRate: number | null;
    /**
     * 当前用户首次阅读时间（我的公告列表返回；其它列表可能缺省）
     */
    myReadAt?: string | null;
    /**
     * 记录创建时刻，接口使用带时区的日期时间字符串。
     */
    createdAt: string;
    /**
     * 记录最后更新时间，接口使用带时区的日期时间字符串。
     */
    updatedAt: string;
}

/**
 * 公告详情（Notice 全字段 + 范围明细 + 当前用户阅读时间）
 */
export interface NoticeDetail extends Notice {
    /**
     * 公告接收范围明细，包含可展示的目标名称。
     */
    scopes: NoticeScope[];
    /**
     * 当前用户的首次阅读时间（范围内进详情即记首读；管理视角或范围外查看为 null）
     */
    myReadAt?: string | null;
}

/**
 * 创建公告请求体（publishTime 缺省 = 立即发布；未来时间 = 定时草稿）
 */
export interface NoticeCreateInput {
    /**
     * 界面展示的标题。
     */
    title: string;
    /**
     * 公告非空富文本 HTML；渲染前必须过滤不安全内容。
     */
    content: string;
    /**
     * 公告接收范围列表，提供时按全量替换处理。
     */
    scopeTargets: NoticeScope[];
    /**
     * 是否在公告列表中置顶。
     */
    isTop?: boolean;
    /**
     * 公告计划发布时间，使用带时区的日期时间。
     */
    publishTime?: string | null;
}

/**
 * 更新公告请求体（缺省表示不修改；scopeTargets 为全量替换）
 */
export interface NoticeUpdateInput {
    /**
     * 界面展示的标题。
     */
    title?: string;
    /**
     * 替换公告富文本 HTML；省略不修改，渲染前必须过滤不安全内容。
     */
    content?: string;
    /**
     * 公告接收范围列表，提供时按全量替换处理。
     */
    scopeTargets?: NoticeScope[];
    /**
     * 是否在公告列表中置顶。
     */
    isTop?: boolean;
    /**
     * 公告计划发布时间，使用带时区的日期时间。
     */
    publishTime?: string | null;
}

/**
 * 已读/未读名单条目（/notices/:id/read-stats）
 */
export interface NoticeReadStatEntry {
    /**
     * 已读或未读名单中的内部用户 ID。
     */
    userId: string;
    /**
     * 界面展示的用户姓名或昵称。
     */
    displayName: string;
    /**
     * 内部账号的登录用户名。
     */
    username: string;
    /**
     * 头像访问地址；null 表示未设置。
     */
    avatar: string | null;
    /**
     * 从顶层到所属组织的完整名称路径。
     */
    deptPath: string | null;
    /**
     * 主岗名称；null 表示无主岗或无法读取。
     */
    mainPostName: string | null;
    /**
     * 在职状态：employed 在职、resigned 离职，与账号启停独立；空值处理由具体接口决定。
     */
    employmentStatus: EmploymentStatus;
    /**
     * 首次阅读时间（未读 Tab 为 null）
     */
    readAt: string | null;
}

/**
 * 站内信通知（/notifications，铃铛数据源）
 */
export interface AppNotification {
    /**
     * 站内通知 ID。
     */
    id: string;
    /**
     * 站内通知类别：系统、公告发布或公告催读。
     */
    type: 'notice_publish' | 'notice_remind' | 'system';
    /**
     * 界面展示的标题。
     */
    title: string;
    /**
     * 通知摘要或正文；null 表示无补充内容。
     */
    content: string | null;
    /**
     * 点击跳转的前端路由
     */
    link: string | null;
    /**
     * 已读时间；null = 未读
     */
    readAt: string | null;
    /**
     * 记录创建时刻，接口使用带时区的日期时间字符串。
     */
    createdAt: string;
}

/**
 * 概览统计序列点（/stats/overview，；date 为 UTC+8 日界 YYYY-MM-DD）
 */
export interface StatsSeriesPoint {
    /**
     * 当前统计日期，按接口或数据源的日界约定解释。
     */
    date: string;
    /**
     * 当前统计项的数量。
     */
    count: number;
}

/**
 * 概览统计 KPI 计数组（迷你序列固定近 7 日）
 */
export interface StatsKpis {
    /**
     * 用户总数（未删除）
     */
    usersTotal: number;
    /**
     * 今日新增用户数
     */
    usersTodayNew: number;
    /**
     * 近 7 日每日新增用户序列
     */
    usersDailyNew: StatsSeriesPoint[];
    /**
     * 今日登录次数（logs type=login）
     */
    loginsToday: number;
    /**
     * 昨日登录次数（环比基准）
     */
    loginsYesterday: number;
    /**
     * 近 7 日每日登录序列
     */
    loginsDailyNew: StatsSeriesPoint[];
    /**
     * 累计操作日志数（type=operation）
     */
    logsTotal: number;
    /**
     * 今日操作日志数
     */
    logsToday: number;
    /**
     * 近 7 日每日操作日志序列
     */
    logsDailyNew: StatsSeriesPoint[];
    /**
     * 部门总数
     */
    deptsCount: number;
    /**
     * 岗位总数
     */
    postsCount: number;
}

/**
 * 角色占比切片
 */
export interface StatsRoleSlice {
    /**
     * 角色程序编码。
     */
    roleCode: string;
    /**
     * 角色中文展示名称。
     */
    roleName: string;
    /**
     * 当前统计项的数量。
     */
    count: number;
}

/**
 * 最新公告条目（标题 + 时间 + 发布人显示名，不含正文）
 */
export interface StatsNoticeItem {
    /**
     * 公告记录 ID。
     */
    id: string;
    /**
     * 界面展示的标题。
     */
    title: string;
    /**
     * 公告计划发布时间，使用带时区的日期时间。
     */
    publishTime: string;
    /**
     * 发布人显示名（发布人已删除或无发布人时为 null）
     */
    publisherName: string | null;
    /**
     * 发布人头像 URL（公开信息；发布人已删除或未设置头像时为 null）
     */
    publisherAvatar: string | null;
}

/**
 * 最近操作日志条目（不含 email / IP；avatar 为操作人头像 URL，公开信息）
 */
export interface StatsLogItem {
    /**
     * 日志记录 ID。
     */
    id: string;
    /**
     * 稳定的业务动作标识或接口请求动作。
     */
    action: string;
    /**
     * 内部账号的登录用户名。
     */
    username: string | null;
    /**
     * 界面展示的用户姓名或昵称。
     */
    displayName: string | null;
    /**
     * 头像访问地址；null 表示未设置。
     */
    avatar: string | null;
    /**
     * 记录创建时刻，接口使用带时区的日期时间字符串。
     */
    createdAt: string;
}

/**
 * Dashboard 概览统计（GET /stats/overview，只读聚合，任意已登录用户）
 */
export interface StatsOverview {
    /**
     * 概览关键计数及其近期趋势序列。
     */
    kpis: StatsKpis;
    /**
     * 登录趋势序列（契约固定近 30 日；7/30 日区间由前端本地 slice 截取）
     */
    loginTrend: StatsSeriesPoint[];
    /**
     * 概览中的角色人数分布。
     */
    roleDistribution: StatsRoleSlice[];
    /**
     * 概览中的最近公告摘要。
     */
    latestNotices: StatsNoticeItem[];
    /**
     * 概览中的最近操作日志摘要。
     */
    recentLogs: StatsLogItem[];
}
