# 基础模板开发规范

## 项目与范围

通用管理后台、API 与微信小程序基础工程。保留认证、权限、组织和通用管理能力，具体业务由新项目确定。
需求以 `docs/requirements.md` 和用户当前明确指令为准。

## 技术约定

- `apps/admin`：Vue 3、TypeScript、Vite、Nuxt UI；单一管理端。
- `apps/api`：NestJS、TypeScript、Prisma、PostgreSQL；小程序和管理端共用业务服务。
- `apps/miniapp`：基于本地 uni-base 的 uni-app、Vue 3、TypeScript、Pinia、UnoCSS；业务组件优先 Wot Design Uni。
- `packages/shared`：三端共用的纯 TypeScript 接口契约、业务常量与权限定义；源码按 `src/<模块>/index.ts` 分目录，不依赖 Vue、NestJS、Prisma、浏览器或小程序运行时，不读取环境配置和密钥。
- 通用定义从 `@app/shared/api`、`/constants`、`/permissions` 导入；类型使用 `import type`。端内 UI、请求、会话和服务端授权仍放在各应用，不能跨应用引用源码。
- 三端固定使用中文，不维护语言切换、业务语言包或翻译键；菜单和字典直接使用 label，组件内置文案指定中文。
- 只使用 Prisma 访问数据库；复杂 SQL 用参数化 `$queryRaw`，迁移由 Prisma 管理。
- 不维护 React、Next.js、Nuxt 多套实现；不受上游多端同步或固定 Drizzle 规则约束。
- 后端先按端、再按业务组织：`apps/api/src/modules/admin` 为后台，`modules/miniapp` 为微信客户，`modules/health` 为公共健康检查。不要为了未来可能出现的需求提前实现业务模块。
- 后台控制器使用 `AdminController` 标记，资源路径不重复写 admin；根 RouterModule 为后台功能清单添加 `/api/admin` 前缀。新增后台功能模块同时加入 `ADMIN_FEATURE_MODULES`，供模块装配、路由和文档使用。
- 小程序只使用 `/api/miniapp`；新增子模块时显式注册端内路由，不导入后台控制器或员工认证模块。端内 DTO/Service 留在对应业务目录，真正共用的业务逻辑按实际需求提取。
- 后台演示只读与员工审计仅作用于后台控制器；共用响应、异常处理、配置与 Prisma 基础设施。旧后台 URL 不提供兼容入口。

## 权限与数据

- 后端授权必须同时检查资源和操作；禁止将所有菜单操作位合并后充当接口授权。
- 菜单隐藏不等于后端授权。账号停用、角色停用、权限撤销应及时生效。
- 客户身份和内部员工账号分别建模；客户业务接口必须限定本人可访问的数据。
- 金额使用整数分或 Decimal，禁止浮点累计。线上支付通知必须验签、幂等处理。
- 涉及支付与订单时区分业务状态和款项状态；涉及多表的写入使用事务。
- 重要写操作保留审计记录；日志不得保存密码、令牌、密钥等敏感值。

## 开发与验收

- 三端统一使用根目录 ESLint 10.13.0 配置；质量规则共用，Vue、Node 和小程序环境按文件路径区分。
- 统一由 Prettier 格式化：4 空格、单引号、分号、LF；VS Code 工作区配置同步遵守根规则。
- 日志按运行端区分：API 业务源码使用 NestJS Logger，禁止直接调用 console；管理后台与小程序允许 console.log/warn/error，按日志语义选用级别。
- `pnpm lint` 检查全项目，`pnpm lint:fix` 修复可自动处理的问题，`pnpm format` / `pnpm format:check` 管理格式。
- 安装时构建共享包；根开发、构建和测试命令先构建共享包。联调修改共享源码时另开终端执行 `pnpm dev:shared`，重启 API 以加载更新后的 CommonJS 产物。
- 生成代码、依赖、第三方来源和数据库迁移记录不参与格式化，避免构建反复改写或破坏迁移校验。
- 改动前检查现有接口、DTO、数据库模型和相关测试。查询当前框架官方文档。
- 优先使用现有 Nuxt UI 组件、Vue 原生机制与 NestJS 模块，不引入重复抽象。
- 更新数据模型时同时提交迁移；改接口时同步 OpenAPI 和前端类型。后台契约在 `apps/api/openapi/admin.yaml`，公共健康检查在 `apps/api/openapi/system.yaml`；小程序有真实接口后再建立独立契约和文档入口。
- 完成改动后执行受影响项目的构建、类型检查及关键测试。
- 权限、认证、事务、支付幂等和状态转换必须有有意义的自动化测试。
- 本地配置写入忽略的 `.env`，提交不含秘密的 `.env.example`。
- API 运行环境只从 `apps/api/src/config/env.ts` 读取和校验，新增变量同步 `.env.example` 与 `docs/configuration.md`；布尔值使用 true/false，有效期先归一为秒再签发令牌。
- 默认后台 5174、小程序 H5 5173、API 3000；修改端口时同步 CORS、初始化示例与联调测试。`node scripts/setup.mjs` 仅补齐缺失或空的必需配置，禁止覆盖已有非空配置和凭据。
- 所有数据库测试必须使用独立测试数据库，禁止重置开发或生产库。
- 不把“有测试文件”表述成“测试已通过”；在 `docs/progress.md` 记录真实结果。
- 保留 `third-party` 中的上游许可证和来源说明。

## 文档

- `JSDOC_STYLE.md`：全项目唯一注释规范；新增或修改的注释必须遵循，公共业务接口、字段及非直观逻辑需说明用途和边界。
- JSDoc 必须使用多行格式：`/**`、正文、`*/` 分行，即使只有一句说明也不压成单行；类型字段、Props 和事件同样遵守。
- 注释默认用中文，解释业务含义与原因；TypeScript 以类型声明和字段注释为准，不为凑覆盖率注释每个变量，也不批量改写无关存量注释。
- `README.md`：安装、启动和验证命令。
- `docs/requirements.md`：已确认的业务要求和本期边界。
- `docs/architecture.md`：目录、认证、权限、Prisma 和部署方式。
- `docs/progress.md`：完成情况、验证证据和明确的后续工作。
