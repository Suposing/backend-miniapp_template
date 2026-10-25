# 基础模板小程序开发规范

继承项目根目录 `AGENTS.md`，业务要求以 `../../docs/requirements.md` 和用户指令为准。

- 基于 uni-base 模板接入，来源与基线见根目录 `third-party/README.md`。
- 技术栈为 uni-app、Vue 3、TypeScript、Pinia、UnoCSS；新增业务组件优先 Wot Design Uni。
- 小程序固定中文，业务代码直接使用中文文案，不引入 vue-i18n 或语言切换。
- 当前只完成模板接入，原有页面和 `src/apis/user` 是示例，不能当作已实现的客户登录或订单。
- 统一在仓库根目录安装依赖；小程序的 Vite 5 和 uni-app 编译器保持配套版本，不跟随后台 Vite 版本升级。
- `pnpm dev:miniapp` 启动微信编译；`pnpm build:miniapp` 构建；`pnpm check:miniapp` 执行类型、请求层回归和 lint。
- 请求成功结构为 `{ data, pagination? }`，HTTP 错误为 `{ code, message }`；Token 只放在 Authorization 请求头，禁止放在 query、body 或日志。
- 客户身份和后台员工账号独立；不接用后台员工登录接口，不伪造微信登录成功。
- `APP_BASE_URL` 使用 `/api/miniapp` 前缀；后台 `/api/admin` 不用于客户请求。当前小程序接口仍未实现，不能以模板示例表示已完成接入。
- `manifest.config.ts` / `pages.config.ts` 是配置源文件；不要手改生成的 `src/manifest.json` / `src/pages.json`。
- `APP_*` 为公开前端配置，禁止放 AppSecret、支付密钥或数据库连接串。
- 升级前核对 peerDependencies，uni-app 编译器包必须保持同一版本；Vite、TypeScript、UnoCSS 和 Vitest 按配套范围更新。
- 当前依赖已不需要 VueUse / unconfig 旧补丁；新增补丁应在 workspace 根声明，并验证重新安装。
- 沿用 TypeScript、单引号、分号、4 空格缩进；注释遵循根 [JSDOC_STYLE.md](../../JSDOC_STYLE.md)，组件 Props、事件、公开方法和非直观逻辑按统一规范说明。
- 所有 JSDoc 块注释必须换行书写，即使只有一句说明；不使用单行 JSDoc。
- 继承根 ESLint / Prettier / VS Code 配置；保持 TypeScript strict，未使用变量由共享的 `@typescript-eslint/no-unused-vars` 错误规则检查。
- 小程序允许使用 console.log、console.warn、console.error，不触发 no-console 警告；调试日志避免包含令牌等敏感信息。
