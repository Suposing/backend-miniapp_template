# 使用模板创建新项目

## 创建仓库

在 GitHub 模板仓库使用 **Use this template → Create a new repository**，然后克隆新仓库。也可以下载源码后在新目录初始化 Git。

源代码中只提供 `.env.example`，每个项目单独生成本地密码和密钥。不要复制其它项目的 `.env`、`.local`、数据库数据卷或上传目录。

## 首次运行前调整命名

基础功能可以直接运行；开始新业务前按下表修改需要区分的标识。建议在安装依赖、初始化数据库之前完成，避免旧缓存、旧环境配置和已有数据卷继续使用旧值。

| 标识                 | 默认值                     | 修改位置                                                                                                                          |
| -------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 根包名               | `backend-miniapp-template` | 根 `package.json`                                                                                                                 |
| 工作区作用域         | `@app/*`                   | 各 `package.json`、源码 import、测试、根脚本和 `pnpm-lock.yaml`                                                                   |
| Compose 项目名       | `backend-miniapp-template` | `compose.yaml` 顶部 `name`；不同项目使用不同名字以隔离容器和数据卷                                                                |
| 数据库与默认用户     | `app_template`             | `compose.yaml`、根/API `.env.example`、`scripts/setup.mjs`、测试与配置文档                                                        |
| 独立回归库           | `app_template_test`        | `scripts/test-database.mjs`、API `.env.example`、相关测试和文档；必须与业务库分离                                                 |
| 小程序缓存前缀       | `app_template:miniapp`     | `apps/miniapp/src/shared/env.ts` 和持久化测试                                                                                     |
| 后台显示信息         | 基础模板                   | `apps/admin/.env.example`、`src/lib/env.ts`、`src/layouts/AuthLayout.vue`、`src/components/layout/SidebarBrand.vue`、`index.html` |
| 小程序名称与描述     | 基础模板                   | `apps/miniapp/manifest.config.ts`、`pages.config.ts`、`index.html`                                                                |
| 微信 AppID           | `touristappid`             | 初始化后的 `apps/miniapp/.env.local`；真机预览填写新项目自己的 AppID                                                              |
| 组织与初始管理员资料 | 示例公司 / 系统管理员      | `apps/api/prisma/seed.ts` 和对应回归断言                                                                                          |
| API 文档标题         | 基础模板后台 / 系统 API    | `apps/api/src/bootstrap.ts`、`src/main.ts`、`openapi/*.yaml`                                                                      |

可通过编辑器全文搜索 `@app/`、`app_template`、`backend-miniapp-template` 和 `基础模板` 检查遗漏。数据库标识建议使用小写字母、数字和下划线；工作区重命名必须同时更新引用。更换自己的 Logo、图标和站点清单时检查 `apps/admin/public` 与 `apps/miniapp/src/static`。

如果修改了依赖名称但尚未同步锁文件，先执行 `pnpm install --lockfile-only`，确认只发生预期工作区变更后，再使用 `--frozen-lockfile` 安装。

本地默认端口为后台 `5174`、小程序 H5 `5173`、API `3000`、PostgreSQL `15432`。同时运行多个项目时应分配不同端口，并同步前端地址、CORS、Compose、初始化脚本与测试库校验；只改 Compose 项目名不能避免端口冲突。

## 安装、初始化和验证

在新仓库根目录执行：

```powershell
pnpm install --frozen-lockfile
node scripts/setup.mjs
docker compose up -d --wait postgres
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm build
pnpm test
pnpm build:miniapp
pnpm check:miniapp
pnpm lint
pnpm format:check
```

初始管理员账号为 `admin`，生成的密码仅保存在本地 `.local/credentials.txt`。初始化可重复执行：补齐缺失配置，保留已有非空配置和凭据，不重置已有管理员密码。

日常启动命令见根 [README](../README.md)，变量用途见 [环境配置](configuration.md)。开发业务前更新 [需求范围](requirements.md)，保留第三方来源与许可证。

## 发布前需要补齐的内容

确认小程序示例接口已替换为真实客户接口，按新项目实现身份和数据范围。配置正式 API 地址、CORS、微信合法域名及服务端密钥；`APP_*` 和 `VITE_*` 只放公开前端配置。

模板中的组织、管理员邮箱和图表示例为占位内容。按业务需要调整 seed；对已初始化的数据库使用明确的数据迁移或管理操作，单纯修改 seed 不会自动覆盖已有记录。
