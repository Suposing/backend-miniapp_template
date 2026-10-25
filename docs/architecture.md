# 基础架构

## 应用边界

一个 Vue 管理端，一个 NestJS API，一个 PostgreSQL 数据库。保留 Better Admin 的界面与通用模块，数据层统一迁移为 Prisma 7.10.1。没有保留 Drizzle 运行依赖，也不依赖 Supabase 才能启动。
前端请求格式保持上游兼容：成功返回 { data }，分页返回 { data, pagination }，错误返回 { code, message }。

三端采用单一中文界面：管理端不再注册 vue-i18n，Nuxt UI 固定中文内置文案，日期和数字固定中文格式；小程序移除直接的 vue-i18n 依赖。
菜单和字典仅使用 label；第二个数据库迁移删除两张表的 i18n_key 列，DTO、接口响应及 OpenAPI 同步移除翻译键。旧迁移保留以支持完整的空库初始化。

`apps/miniapp` 接入本地 uni-base 模板，与管理端共用 NestJS 服务的响应协议。
小程序保留配套的 uni-app/Vite 5 工具链，与后台的 Vite 工具链分别安装；当前依赖版本已不需要早期 VueUse / unconfig 补丁。
客户会话使用独立的 `app_template:miniapp` 缓存前缀；目前只完成请求基础层，客户认证接口和业务数据模型尚未实现。

## API 分端组织

统一保留 `api` 全局前缀，使用 NestJS RouterModule 为后台和小程序注册独立入口：

| 范围         | 路由             | 源码位置                       |
| ------------ | ---------------- | ------------------------------ |
| 内部员工后台 | `/api/admin/*`   | `apps/api/src/modules/admin`   |
| 微信客户     | `/api/miniapp/*` | `apps/api/src/modules/miniapp` |
| 公共健康检查 | `/api/health`    | `apps/api/src/modules/health`  |

后台按 auth、account、users、roles、menus、permissions、dict、logs、org、notice、stats 分业务目录；各自维护 Controller、DTO、Service 和 Module。
`AdminModule` 的 `ADMIN_FEATURE_MODULES` 是后台模块清单，同时用于装配、路由注册和 Swagger 文档范围。子模块使用空路径继承 admin 前缀，资源名由控制器声明。
后台控制器统一使用 `AdminController`；该装饰器同时声明资源路径和后台标记。员工 JWT 策略命名为 `admin-jwt`，具体接口保留原有鉴权和资源权限检查。
演示只读守卫仍在鉴权之前运行，但只检查带后台标记的控制器；员工审计同样只处理后台写请求，避免将客户 ID 写入关联内部 users 的日志表。
认证限流配置和守卫归入后台 auth 模块。通用响应拦截器、异常过滤器、数据库连接和配置继续共用；公共健康检查不归入后台权限和审计。

`MiniappModule` 目前只有模块入口，尚未注册客户认证和业务接口。未来新增子模块需要同时补齐小程序路由树；客户身份、令牌验证与数据授权独立实现，不直接导入后台员工控制器。
数据库和 Prisma Schema 继续按实体维护，不按访问端复制。同一订单等业务将来需要两端复用时，再提取无 HTTP 控制器的公共业务服务；两端 DTO 和授权分别维护。
`packages/shared` 仍只承载纯 TypeScript 契约和常量，不放 NestJS 服务或数据库模型。

管理端 `VITE_API_BASE_URL` 默认 `http://localhost:3000/api/admin`，小程序 `APP_BASE_URL` 默认 `http://localhost:3000/api/miniapp`。
此次直接迁移，不注册旧 `/api/auth/*`、`/api/users` 等业务地址；前后端必须同步切换。公开头像继续由 `/uploads/` 提供。
后台 Swagger 在 `/docs/admin`（JSON 为 `/docs/admin-json`），系统 Swagger 在 `/docs/system`（JSON 为 `/docs/system-json`）；旧 `/docs`、`/docs-json` 已移除。
静态 OpenAPI 分别为 `apps/api/openapi/admin.yaml` 与 `apps/api/openapi/system.yaml`。小程序有真实接口后再建立 `/docs/miniapp` 和对应契约，当前不发布空文档。

## 共享基础层

使用 pnpm 工作区包 `packages/shared` 集中维护基础定义，供 Vite 管理端、NestJS API 和 uni-app 小程序共同使用。

三端通过 `workspace:*` 依赖 `@app/shared`，依赖方向固定为 `apps/* → packages/shared`，共享包不反向引用应用，也不带运行时第三方依赖。

- `src/api/index.ts`：`ApiEnvelope`、`ApiListEnvelope`、`ApiPagination`、`ApiError`、`PermissionItem`；契约与现有 HTTP 响应一致。
- `src/constants/index.ts`：超级管理员角色编码、字典类型编码校验正则。
- `src/permissions/index.ts`：后台操作位、超级管理员位值、权限字符串解析和位运算纯函数。大权限位通过十进制字符串传输，调用方仍须限定资源范围。
- `src/index.ts`：统一导出入口；各端可按 `/api`、`/constants`、`/permissions` 子路径引用，类型使用 `import type`。

每类能力使用独立目录，以 `index.ts` 作为导出入口；后续增加相关类型或工具时可在对应目录拆分文件，再由该入口导出。

管理端原有 `lib/api-types`、`lib/constants`、权限解析入口，以及 API 常量和权限枚举入口保留转发；小程序 `ResponseData` 使用共享响应类型，分页字段明确为 page、pageSize、total。
API 全局响应拦截器、异常过滤器和权限列表使用共享类型约束。各业务 DTO、校验装饰器、Prisma Schema、UI 组件、请求客户端和会话存储仍在各自应用维护。

共享包由同一套源码输出 `dist/esm` 和 `dist/cjs`，各入口匹配自己的类型声明。现有 API 使用 CommonJS，前端使用 ESM；API 的 Node10 模块解析通过 `typesVersions` 显式映射到各模块的 `index.d.ts`。
`pnpm install` 通过 prepare 构建共享包，根命令显式保证先构建共享包再启动、构建或测试应用；CI 沿用根命令即可覆盖共享包。
开发共享源码时运行 `pnpm dev:shared`；NestJS 的源码监听范围仍在 API 应用内，共享运行时代码更新后需重启 API。

运行时部署保留共享包的构建产物及工作区依赖关系。共享源码和声明统一遵守根 `JSDOC_STYLE.md`、ESLint 和 Prettier，自动化测试覆盖双模块入口及权限边界。

## 已适配模块

认证与个人资料、用户、角色、菜单、操作权限说明、部门、岗位、通讯录、字典、日志、公告、通知、系统概览。
概览中的用户和登录统计是基础系统数据，不代表具体业务的经营统计。演示组件代码保留作开发参考，不加入初始化业务菜单。

## 权限

- 角色通过 roleMenus 为每个菜单配置操作位；权限按具体业务路由聚合。
- API 控制器声明 PermissionResource，例如 /settings/users；方法声明 Permissions，例如 EDIT。
- PermissionsGuard 检查当前资源的权限位，不使用全局合并权限做业务授权。
- 每次请求重新读取有效角色和授权，角色停用、授权撤销立即影响现有会话。
- 角色授权、菜单结构、用户角色绑定等高权限操作保留给超级管理员，防止通过配置接口自行提权。
- 公告和通知另外检查接收范围、发布人和本人身份。未来业务模块需独立实现客户、负责人、部门等数据范围。
- 后台 users 是内部账号；未来微信客户使用独立模型，不直接共用员工认证与权限。

## 会话

Access Token 短期有效，Refresh Token 在数据库仅存哈希。刷新以事务消费旧令牌并签发新令牌；并发重放仅一次成功。
访问令牌默认 15 分钟，长/短刷新会话默认 30 天/1 天，通过 `JWT_EXPIRES_IN`、`REFRESH_EXPIRES_IN`、`REFRESH_EXPIRES_IN_SHORT` 配置。配置统一解析为整数秒，登录、刷新签发和新会话数据库到期时间使用同一约定；刷新轮换继续保留原会话到期时间。
改密码或停用账号提升 tokenVersion，撤销已有访问令牌和刷新会话。没有开放免密演示登录。
密码、令牌和密钥不写入操作日志；前端只接触公开 VITE_* 配置。

## 环境配置

后台固定 5174，小程序 H5 固定 5173，两端均启用 strictPort；API 默认 3000，默认 CORS 允许这两个 localhost 来源。
API 的端口、监听地址、跨域来源、代理跳数、认证开关、密钥和令牌时长集中在 `src/config/env.ts` 读取与校验；启动先验证配置，再装载业务模块，错误不回显敏感值。
初始化脚本读取各端 `.env.example` 补齐配置，保留已有非空值和凭据。根配置缺失时优先从已有本地连接串恢复 Compose 用户与密码，冲突时拒绝自动改写；小程序生成 `.env.local` 并沿用已有 `.env` 中的公开配置。
运行变量、优先级、初始化边界与修改步骤见 [环境配置说明](configuration.md)。

## Prisma 与数据约束

Prisma Schema 为模型定义；迁移 SQL 管理实际数据库结构与特殊索引。18 个基础模型沿用上游数据概念，使用明确外键和事务。
初始迁移支持空库部署；seed 只初始化管理员、菜单、字典和组织，重复运行不会重置管理员密码。
具体业务表尚未建立，新项目先在 docs/requirements.md 确认需求，再扩展模型、迁移与测试。

## 验收约定

新功能同时补 API / DTO、前端类型、资源权限、数据库迁移和关键测试。
当前自动化以跨模块越权、角色撤销、管理员保护、组织循环、公告与通知隔离、刷新重放和改密失效为重点。
