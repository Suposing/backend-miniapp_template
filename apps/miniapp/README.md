# 基础模板小程序

基于 uni-base 接入，来源提交 `3884407eb8faa852f266518c308854d9641d541f`，详情见根目录 `third-party/README.md`。
采用 uni-app、Vue 3、TypeScript、Pinia、UnoCSS。工程由根目录 pnpm workspace 管理。

## 当前范围

已完成工程复制、workspace 接入、品牌名称与 AppID 配置、Windows 编译兼容补丁，以及 NestJS 请求协议适配。
现有三个页面和 `src/apis/user` 仍是模板示例；示例接口未接入现有 API。
页面、导航、微信客户登录及业务接口由新项目按需求开发。

## 安装与启动

在仓库根目录执行：

```powershell
pnpm install --frozen-lockfile
pnpm dev:miniapp
```

微信开发者工具导入 `apps/miniapp/dist/dev/mp-weixin`。
生产编译命令为 `pnpm build:miniapp`，输出 `apps/miniapp/dist/build/mp-weixin`。
复制 `.env.example` 为本目录的 `.env.local` 后配置公开的 API 地址和微信 AppID。
默认 `touristappid` 仅用于本地模板构建；真机预览需填写新项目自己的 AppID。
真机 API 地址需使用手机可访问的服务地址，不能沿用电脑的 localhost；发布前配置 HTTPS API 地址和小程序合法域名。
`APP_*` 会进入前端配置，不可填写 AppSecret、支付密钥等秘密。

H5 辅助调试可执行 `pnpm dev:miniapp:h5`；H5 端口及 CORS 需按运行环境配置。微信端为当前验证目标。

## 请求约定

- `APP_BASE_URL` 默认 `http://localhost:3000/api/miniapp`，与后台 `/api/admin` 分离；模板用户接口仍未实现，调整地址不代表已接入客户登录。
- 成功保留 `{ data, pagination? }`；失败使用 HTTP 状态和 `{ code, message }`。
- 认证使用 `Authorization: Bearer <token>`。已删除旧公共参数注入文件及其字段。
- 401 清除对应的过期会话，较早请求的 401 不清除刚建立的新会话；403 保留登录状态。
- 错误诊断事件只记录方法、去除查询字符串的路径、HTTP 状态及错误码。
- 客户登录与后台员工账号独立，不能将现有员工登录 API 当作小程序客户登录。

## 验证与维护

```powershell
pnpm build:miniapp
pnpm check:miniapp
```

所有命令在根目录执行。构建不再隐式执行 pnpm install。
首次类型检查前先构建，生成页面、自动导入和实际使用组件的类型声明。TypeScript 保持 strict，未使用变量由 ESLint 错误规则检查。
`manifest.config.ts`、`pages.config.ts` 是配置源文件，生成的 JSON 与 dist 不提交。

2026-10-23 已更新依赖，旧 VueUse / unconfig 补丁已经移除。运行环境要求 Node.js 22.22.2+（22.x）、24.15+（24.x）或 26+。

主要版本：uni-app `3.0.0-alpha-5030320261021002`、Vue `3.5.44`、Pinia `4.1.0`、VueUse `15.0.0`、Axios `1.20.0`、unh `0.5.0`。
Pinia 持久化配置使用 `pick`，保持原有缓存 key 和数据结构；Vite 从真实安装路径解析 Pinia，兼容 uni-app/pnpm 的符号链接和传递依赖。

以下工具按兼容范围维护：Vite `5.2.8`、TypeScript `5.9.3`、UnoCSS `66.10.5`、Vitest `3.2.7`、`@dcloudio/types` `3.4.31`。
`pnpm --filter @app/miniapp up` 仅在已声明范围内更新；升级 uni-app 时应成套更新全部编译器包并重新验证。

小程序保留与 uni-app 配套的 Vite 5；后台保持独立的 Vite 版本。
模板仍有上游依赖弃用与 peer dependency 警告，具体以安装输出和根进度文档为准。
