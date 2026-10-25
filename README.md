# Backend + Miniapp Template

Vue 3 + NestJS + PostgreSQL + Prisma 管理后台与 uni-app 微信小程序的通用基础模板。
包含认证、资源权限、用户、角色、组织、菜单、字典、日志及通知等通用模块；客户登录和具体业务由新项目实现，范围见 [模板范围](docs/requirements.md)。

新建项目先阅读 [使用与重命名指南](docs/template.md)，再执行下方初始化命令。
三端固定中文，已移除业务国际化与语言切换；菜单和字典直接显示维护的名称。

## 开发环境

- Node.js 22.22.2+（22.x）、24.15+（24.x）或 26+
- pnpm 9.15.9
- Docker / Docker Compose（本地 PostgreSQL 17）

## 首次运行

在项目根目录执行：

```powershell
pnpm install --frozen-lockfile
node scripts/setup.mjs
docker compose up -d --wait postgres
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

setup 按文件和配置项补齐根目录、API、管理端及小程序的本地环境，保留已有非空值、密码和密钥；重复执行不会改写完整配置。可从已有本地数据库连接串恢复缺失的 Compose 凭据，发现冲突时停止并提示核对。
初始管理员账号及种子密码见 `.local/credentials.txt`，该文件已存在时不会覆盖。详细变量说明见 [环境配置](docs/configuration.md)。
初始化数据可重复执行，已有管理员密码不会被重置。数据库仅监听本机 15432 端口。

分别打开两个终端启动：

```powershell
pnpm dev:api
pnpm dev:admin
```

- 管理后台：http://localhost:5174
- 后台 API：http://localhost:3000/api/admin
- 后台接口文档：http://localhost:3000/docs/admin
- 健康检查：http://localhost:3000/api/health
- 系统接口文档：http://localhost:3000/docs/system

小程序使用独立的 `/api/miniapp` 前缀，目前仅建立模块入口，客户登录与业务接口尚未实现。
原 `/api/auth/*`、`/api/users` 等后台地址及 `/docs` 文档入口已移除，不保留兼容路由。
静态接口契约分别维护在 `apps/api/openapi/admin.yaml` 与 `apps/api/openapi/system.yaml`。

## 微信小程序

本地 uni-base 模板已接入 `apps/miniapp`，与后台共用根目录的 pnpm workspace 和锁文件。

```powershell
pnpm dev:miniapp
pnpm build:miniapp
pnpm check:miniapp
```

开发时在微信开发者工具导入 `apps/miniapp/dist/dev/mp-weixin`；生产构建输出 `apps/miniapp/dist/build/mp-weixin`。
`node scripts/setup.mjs` 会补齐 `apps/miniapp/.env.local`；AppID 和 API 地址配置见 `apps/miniapp/.env.example`。现有页面仍是模板示例，微信客户登录与具体业务尚未开发。
H5 调试使用固定端口 5173，管理端使用 5174；API 默认跨域白名单同时允许这两个 localhost 来源，端口占用时直接报错。
详细说明见 [小程序 README](apps/miniapp/README.md)。根 `pnpm build/test` 覆盖共享包、API 和管理端，小程序构建和测试使用独立命令；`pnpm lint` 统一覆盖三端与共享包。

## 共享基础层

`packages/shared` 是三端共同依赖的 `@app/shared`，集中维护不依赖运行端的基础定义：

| 导入入口                  | 维护内容                               |
| ------------------------- | -------------------------------------- |
| `@app/shared/api`         | 成功响应、分页、错误和权限项类型       |
| `@app/shared/constants`   | 超级管理员角色编码、字典类型编码规则   |
| `@app/shared/permissions` | 操作位定义、权限解析、归一化与纯位运算 |

```ts
import type { ApiEnvelope, ApiListEnvelope } from '@app/shared/api';
import { DICT_TYPE_CODE_PATTERN } from '@app/shared/constants';
```

类型使用 `import type`，避免给运行产物引入无用代码。原管理端、API、小程序的公共导入入口继续可用，内部已转发到共享包。
源码按 `src/api/index.ts`、`src/constants/index.ts`、`src/permissions/index.ts` 分目录组织，后续内容放入对应目录并由 `index.ts` 导出。
共享包不放 Vue 组件、store、请求客户端、Prisma 模型或环境配置；API 继续负责资源授权，小程序客户与后台员工使用各自的身份模型。

安装依赖时自动构建共享包，根开发、构建、测试和 seed 命令也会先构建所需产物。修改共享源码时可单独执行：

```powershell
pnpm build:shared
pnpm test:shared
```

联调时另开终端执行 `pnpm dev:shared` 持续编译，共享包同时输出 ESM 和 CommonJS。API 进程需要重启以加载更新后的 CommonJS 产物；仅运行 `pnpm dev:api` 不会自动监听共享源码。

## 验证

```powershell
pnpm build
pnpm test
pnpm lint
pnpm format:check
```

API 回归仅使用本机 Compose 的 `localhost/127.0.0.1:15432/app_template_test`。建库脚本与测试引导共用目标校验，拒绝其它库名、远程主机、不同端口及查询参数；测试在清理前再次核对实际数据库名称。
`pnpm test:setup` 同时检查配置补缺和测试库入口；其中密码解析回归需要 Docker Compose CLI，仅运行 `config --environment`，不启动容器。

## 代码规范与编辑器

三端与共享包共用根 `eslint.config.mjs` 和 ESLint 10.13.0；`pnpm lint` 覆盖管理端、API、小程序、共享包、测试与工程脚本。
Prettier 单独负责格式，统一为 4 空格、单引号、分号、LF。执行 `pnpm format` 格式化，`pnpm format:check` 检查格式，`pnpm lint:fix` 修复代码规则。
日志约定：API 业务源码使用 NestJS Logger，直接调用 console 会触发 ESLint 错误；管理后台和小程序允许使用 console，不产生此类警告。
生成文件、第三方来源与数据库迁移由忽略规则保护。

注释遵循全项目统一的 [JSDOC_STYLE.md](JSDOC_STYLE.md)，覆盖 Vue、小程序、NestJS、类型字段、Prisma/SQL 和测试；新增或修改代码时同步维护业务说明。

请用 VS Code 打开克隆后的项目根目录。工作区已指定 Prettier 为格式化器、ESLint 为保存修复器，并覆盖用户设置中 Tab、去分号、JSON/SCSS 格式化器和单条规则修复限制。
项目中的 `.vscode/settings.json`、`.editorconfig` 和 `.prettierrc.json` 会保持编辑器与命令行一致。所需扩展已列入 `.vscode/extensions.json`。
前端保留上游的组件、路由、权限与工具函数测试；后端增加真实 PostgreSQL + HTTP 回归。

## 数据库变更

```powershell
pnpm --filter @app/api db:dev --name describe_change
pnpm db:generate
```

模型位于 `apps/api/prisma/schema.prisma`，迁移位于 `apps/api/prisma/migrations`。
部分唯一索引（软删除名称、邮箱、主岗等）通过迁移 SQL 明确维护，变更时需保留相应约束。
部署已有迁移用 `pnpm db:migrate`；不要用 `db push` 替代版本化迁移。

## 目录

- `apps/admin`：Vue 3 / Vite / Nuxt UI 管理端。
- `apps/api`：NestJS / Prisma 接口服务、DTO、迁移与测试。
- `apps/miniapp`：uni-app / Vue 3 微信小程序基础工程。
- `packages/shared`：三端共用的 TypeScript 契约、常量、权限及测试。
- `docs`：模板使用、范围、架构、配置和验证记录。
- `AGENTS.md`：基础模板 AI 开发规范。
- `JSDOC_STYLE.md`：全项目中文注释规范与示例。
- `.agents/skills`：保留的 Vue、Nuxt UI、Pinia、Vite、Vitest、pnpm 相关技能。
- `third-party`：Better Admin 来源说明与许可证。

## 本地停止与部署

终端按 Ctrl+C 停止应用；`docker compose stop` 停止数据库并保留数据。
不要执行 `docker compose down -v`，除非明确要删除本地数据库。

部署时由运维提供 PostgreSQL、JWT 密钥、初始管理员密码、CORS_ORIGINS 和 PUBLIC_API_URL。
在仓库根安装依赖并运行 `pnpm build`，API 运行环境须包含 `@app/shared` 的工作区依赖及 `packages/shared/dist`，不能仅复制 `apps/api/dist`。管理端和小程序由各自构建工具打包。
数据库 SSL 使用 PostgreSQL 连接参数配置，支持本地无 SSL 和云数据库连接；不会跳过证书验证。
头像当前落地到 `apps/api/uploads`，需要持久化该目录；后续可接入自己的对象存储。
API 默认 `HOST=127.0.0.1`、`PORT=3000`，可按实际部署或联调方式配置。反向代理链路使用 `TRUST_PROXY_HOPS`，默认不信任转发头；公开资源地址通过 `PUBLIC_API_URL` 设置。
