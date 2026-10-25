<h1 align="center">designated-driving</h1>

<br>

## 特性

- ⚡️ [Vue 3](https://github.com/vuejs/core), [Vite](https://github.com/vitejs/vite), [pnpm](https://pnpm.io) 优先 - 就是快！
- 📲 [组件自动加载](https://github.com/uni-helper/vite-plugin-uni-components)
- 📥 [API 自动加载](https://github.com/antfu/unplugin-auto-import) - 直接使用 Composition API 无需引入
- 🎨 [UnoCSS](https://github.com/unocss/unocss) - 高性能且极具灵活性的原子化 CSS 引擎
- 😃 [各种图标集为你所用](https://github.com/iconify/icon-sets) - 150+ 图标集, 200000+ 图标为你所用, 从不妥协
- 🍍 [使用 Pinia 的状态管理](https://pinia.vuejs.org)
- 🔥 使用 [新的 `<script setup>` 语法](https://github.com/vuejs/rfcs/pull/227)
- 🦾 TypeScript 支持
- ☁️ 零配置部署 Netlify 和 Vercel

<br>

## 预配置

### UI 框架
  - [UnoCSS](https://github.com/unocss/unocss) - 高性能且极具灵活性的即时原子化 CSS 引擎

### Icons
  - [Iconify](https://iconify.design) - 使用任意的图标集, 使用 [Icônes](https://icones.netlify.app) 或 [iconify](https://icon-sets.iconify.design) 查看或搜索图标
    - [用 CSS 的方式使用图标](https://unocss.dev/presets/icons)

### 组件库
  - [uni-ui](https://uniapp.dcloud.net.cn/component/uniui/uni-ui.html)
  - [wot-design-uni](https://wot-design-uni.pages.dev)
  - [nutui-uniapp](https://github.com/nutui-uniapp/nutui-uniapp)

### 插件
  - [Pinia](https://pinia.vuejs.org) - 直接的, 类型安全的, 使用 Composition API 的轻便灵活的 Vue 状态管理
  - [vite-plugin-uni-components](https://github.com/uni-helper/vite-plugin-uni-components) - 自动加载组件
  - [unplugin-auto-import](https://github.com/antfu/unplugin-auto-import) - 直接使用 Composition API 等，无需导入
  - [VueUse](https://github.com/antfu/vueuse) - 实用的 Composition API 工具合集

### 编码风格
  - 使用 Composition API 的 [\<script setup\> SFC 语法](https://github.com/vuejs/rfcs/pull/227)
  - [ESLint](https://eslint.org) 配置为 [@moomfe/eslint-config](https://github.com/MoomFE/eslint-config), 单引号, 有分号

### 开发工具
  - [TypeScript](https://www.typescriptlang.org)
  - [pnpm](https://pnpm.js.org) - 快, 节省磁盘空间的包管理器
  - [VS Code](https://code.visualstudio.com)- IDE
  - VS Code 扩展
    - [Volar](https://marketplace.visualstudio.com/items?itemName=johnsoncodehk.volar) - Vue 3 `<script setup>` IDE 支持
    - [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) - 代码风格检查及修正
    - [UnoCSS](https://marketplace.visualstudio.com/items?itemName=antfu.unocss) - UnoCSS 样式提示及自动补全
    - [Iconify IntelliSense](https://marketplace.visualstudio.com/items?itemName=antfu.iconify) - 图标内联显示及自动补全
    - [uni-app-schemas](https://marketplace.visualstudio.com/items?itemName=uni-helper.uni-app-schemas-vscode) - 为 `pages.json` 和 `manifest.json` 等文件提供代码提示
    - [uni-app-snippets](https://marketplace.visualstudio.com/items?itemName=uni-helper.uni-app-snippets-vscode) - 提供 uni-app 的条件编译及基础组件代码补全等功能
    - [uni-ui-snippets](https://marketplace.visualstudio.com/items?itemName=uni-helper.uni-ui-snippets-vscode) - 提供 uni-ui 组件代码补全功能
    - [uni-highlight](https://marketplace.visualstudio.com/items?itemName=uni-helper.uni-highlight-vscode) - 提供 uni-app - 条件编译语法高亮支持

<br>

## 项目目录结构

- **\*\*\*.code-workspace**: VsCode 工作区文件, 使用这个打开项目
- **public**: 打包后需要放到根目录的文件
- **locales**: 国际化文件
- **dist**: 打包后的代码
- **src**: 源码
  - **static**: 存放静态资源
  - **styles**: 公共样式
  - **shared**: 公用变量 or 函数
  - **lib**: 外部依赖库 ( 不满足需求需要重构时或者外部依赖库有 BUG 时, 从 node_modules 移至这里 )
  - **utils**: 工具函数
  - **Apis**: 接口
  - **modules**: 项目依赖类库的配置
  - **workers**: 存放独立的 Web Worker 应用
  - **stores**: 状态存储
  - **composables**: 组合式函数
  - **components**: 公共组件 ( 相对独立的组件, 离开当前项目也能使用的组件 )
  - **components-private**: 私有组件 ( 只能在当前项目中使用的组件, 比如说包含了业务代码的组件 )
  - **layouts**: 布局组件
  - **pages**: 页面

<br>

## 开始

使用项目根目录的 `***.code-workspace` 文件进入 VsCode 工作区

安装相应的 VsCode 扩展 ( 首次进入工作区时, 右下角会提示安装 ), 可以在扩展界面, 输入 `@recommended` 检查安装状态

执行以下命令就可以启动项目 ( 默认启动 `h5` 项目, 其他指令查看 `package.json` )

```bash
  pnpm dev # 如果你没装过 pnpm, 可以先运行: npm install -g pnpm
```

<br>

## 模板使用说明

### 运行环境

- 项目通过 `package.json` 的 `volta.node` 固定 Node 版本，安装 Volta 后进入项目会自动切换。
- 包管理器使用 `pnpm@9.15.9`，首次运行开发或构建命令时脚本会先执行 `pnpm install`。

### 配置文件

- 路由配置维护在 `pages.config.ts`，不要手动改生成后的 `src/pages.json`。
- 应用清单维护在 `manifest.config.ts`，不要手动改生成后的 `src/manifest.json`。
- Vite 环境变量前缀为 `APP_`，代码里通过 `import.meta.env.APP_*` 读取。
- `@`、`~` 指向 `src`，`@@` 指向项目根目录。

### 状态与请求

- Pinia 在 `src/modules/pinia/index.ts` 中统一创建，并接入持久化插件。
- 登录 Token 维护在 `src/stores/auth.ts`，请求层会自动读取并写入请求头。
- 业务页面判断登录态时优先使用 `useAuthStore().isLogin`，不要直接操作本地存储。
- 统一请求实例在 `src/modules/axios/index.ts`，业务接口通过 `src/utils/request.ts` 使用。
- 请求层已包含 Token 注入、公共参数注入、重复请求取消、失败重试、错误提示与错误事件派发。
- 调用方默认不需要重复弹错误提示；需要静默处理时，在请求配置中传入 `silentError`。

### 样式与工具

- 全局样式入口是 `src/styles/styles.scss`，主题变量集中在 `src/styles/theme.scss`。
- TypeScript 侧主题色维护在 `src/shared/theme.ts`，UnoCSS 会同步生成 `src/shared/unocss.theme.ts`。
- 模板中优先使用 UnoCSS 原子类，复杂样式再结合 SCSS 和 `--uno`。
- 小程序更新提示封装在 `src/utils/update.ts`，由 `App.vue` 初始化。
- 常用工具位于 `src/utils`，包括 `time`、`money`、`layout`、`client`、`update`。
