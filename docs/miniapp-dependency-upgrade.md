# 小程序依赖更新记录

日期：2026-10-23。依据当日 npm registry 的发布标签和 peerDependencies，更新 apps/miniapp/package.json 中 53 项版本声明，并同步根 pnpm-lock.yaml。

## 兼容约束

| 依赖                | 已选版本                     | 原因                                                |
| ------------------- | ---------------------------- | --------------------------------------------------- |
| uni-app 编译器全套  | 3.0.0-alpha-5030320261021002 | 使用 Vue 3 发布标签，各平台保持同一版本             |
| Vite                | 5.2.8                        | @dcloudio/vite-plugin-uni 明确要求该版本            |
| @dcloudio/types     | 3.4.31                       | @dcloudio/uni-app 明确要求该版本                    |
| TypeScript          | 5.9.3                        | uni-use 的 peer 范围仍为 TypeScript 4/5，不升级到 7 |
| UnoCSS              | 66.10.5                      | unocss-applet 0.15.1 要求 ~66.10.1                  |
| Vitest              | 3.2.7                        | 保持支持 Vite 5 的版本线                            |
| vite-plugin-inspect | 0.8.9                        | 当前版本线兼容 Vite 5，新主版本要求 Vite 8          |

Wot Design Uni、mixte、vue-tsc 等已在核对到的当前版本，保持不变。Node 要求同步为 22.22.2+（22.x）、24.15+（24.x）或 26+；本机为 22.23.1。

## 配套调整

- Pinia 持久化插件升级后将 paths 改为 pick；保留原缓存 key 和数据结构，新增实际缓存恢复、更新、退出登录回归。
- Vite 从真实安装路径解析 Pinia，解决 uni-app 保留符号链接时无法定位 pnpm 传递依赖的问题；未将传递依赖逐个加入 package.json。
- 显式提供组件自动导入插件声明的 Rollup peer 依赖。
- unh 0.5 自动生成配置，删除废弃的 autoGenerate 选项。
- 删除已不再需要的 VueUse 与 unconfig 补丁及根配置引用。
- up 脚本只在声明范围内更新，避免自动将 Vite、TypeScript 等推进不兼容主版本。

## 验证

- 冻结锁文件重新安装通过。
- 微信小程序和 H5 生产构建通过，确认构建日志均为 DONE Build complete。
- 小程序类型检查、ESLint、2 个测试文件共 9 项测试通过。
- 现有 NestJS/Prisma 和后台 Vue 构建、后台类型检查通过；后台直接依赖的基础版本未主动升级，workspace peer 快照有同步变化。
- 未进行微信开发者工具或真机运行验证。

仍有上游组件的 Sass 弃用提示、自动导入重名/UnoCSS 重复导入提示，以及 uni-app 内部 Vue server-renderer、webpack 的 peer 警告；不影响本次构建与检查通过。

## 版本变更

| 依赖                                   | 更新前声明                   | 更新后声明                   |
| -------------------------------------- | ---------------------------- | ---------------------------- |
| @dcloudio/uni-app                      | 3.0.0-alpha-5010320260611001 | 3.0.0-alpha-5030320261021002 |
| @dcloudio/uni-app-harmony              | 3.0.0-alpha-5010320260611001 | 3.0.0-alpha-5030320261021002 |
| @dcloudio/uni-app-plus                 | 3.0.0-alpha-5010320260611001 | 3.0.0-alpha-5030320261021002 |
| @dcloudio/uni-automator                | 3.0.0-alpha-5010320260611001 | 3.0.0-alpha-5030320261021002 |
| @dcloudio/uni-cli-shared               | 3.0.0-alpha-5010320260611001 | 3.0.0-alpha-5030320261021002 |
| @dcloudio/uni-components               | 3.0.0-alpha-5010320260611001 | 3.0.0-alpha-5030320261021002 |
| @dcloudio/uni-h5                       | 3.0.0-alpha-5010320260611001 | 3.0.0-alpha-5030320261021002 |
| @dcloudio/uni-mp-alipay                | 3.0.0-alpha-5010320260611001 | 3.0.0-alpha-5030320261021002 |
| @dcloudio/uni-mp-baidu                 | 3.0.0-alpha-5010320260611001 | 3.0.0-alpha-5030320261021002 |
| @dcloudio/uni-mp-harmony               | 3.0.0-alpha-5010320260611001 | 3.0.0-alpha-5030320261021002 |
| @dcloudio/uni-mp-jd                    | 3.0.0-alpha-5010320260611001 | 3.0.0-alpha-5030320261021002 |
| @dcloudio/uni-mp-kuaishou              | 3.0.0-alpha-5010320260611001 | 3.0.0-alpha-5030320261021002 |
| @dcloudio/uni-mp-lark                  | 3.0.0-alpha-5010320260611001 | 3.0.0-alpha-5030320261021002 |
| @dcloudio/uni-mp-qq                    | 3.0.0-alpha-5010320260611001 | 3.0.0-alpha-5030320261021002 |
| @dcloudio/uni-mp-toutiao               | 3.0.0-alpha-5010320260611001 | 3.0.0-alpha-5030320261021002 |
| @dcloudio/uni-mp-weixin                | 3.0.0-alpha-5010320260611001 | 3.0.0-alpha-5030320261021002 |
| @dcloudio/uni-mp-xhs                   | 3.0.0-alpha-5010320260611001 | 3.0.0-alpha-5030320261021002 |
| @dcloudio/uni-quickapp-webview         | 3.0.0-alpha-5010320260611001 | 3.0.0-alpha-5030320261021002 |
| @dcloudio/uni-stacktracey              | 3.0.0-alpha-5010320260611001 | 3.0.0-alpha-5030320261021002 |
| @dcloudio/uni-ui                       | ^1.5.7                       | ^1.5.12                      |
| @dcloudio/vite-plugin-uni              | 3.0.0-alpha-5010320260611001 | 3.0.0-alpha-5030320261021002 |
| @iconify/json                          | ^2.2.487                     | ^2.2.546                     |
| @moomfe/eslint-config                  | ^3.6.1                       | ^3.8.0                       |
| @rollup/pluginutils                    | ^5.4.0                       | ^5.5.1                       |
| @types/node                            | ^24.10.1                     | ^24.19.2                     |
| @uni-helper/axios-adapter              | ^1.18.0                      | ^1.20.2                      |
| @uni-helper/unh                        | ^0.2.10                      | ^0.5.0                       |
| @uni-helper/uni-app-types              | 1.0.0-alpha.7                | 1.4.0                        |
| @uni-helper/uni-ui-types               | 1.0.0-alpha.7                | 1.4.0                        |
| @uni-helper/vite-plugin-uni-components | ^0.2.3                       | ^0.3.4                       |
| @uni-helper/vite-plugin-uni-manifest   | ^0.2.12                      | ^0.6.1                       |
| @uni-helper/vite-plugin-uni-pages      | ^0.3.23                      | ^0.5.0                       |
| @unocss-applet/reset                   | ^0.12.2                      | ^0.15.1                      |
| @vue/runtime-core                      | 3.5.38                       | 3.5.44                       |
| @vueuse/core                           | ^11.3.0                      | ^15.0.0                      |
| @vueuse/math                           | ^11.3.0                      | ^15.0.0                      |
| axios                                  | ^1.18.0                      | ^1.20.0                      |
| baseline-browser-mapping               | ^2.10.38                     | ^2.11.31                     |
| eslint                                 | ^9.39.1                      | ^10.13.0                     |
| fs-extra                               | ^11.3.5                      | ^11.4.1                      |
| lodash-es                              | ^4.17.21                     | ^4.18.1                      |
| miniprogram-api-typings                | ^4.1.0                       | ^5.2.3                       |
| nutui-uniapp                           | ^1.9.4                       | ^1.11.2                      |
| pinia                                  | 2.1.7                        | 4.1.0                        |
| pinia-plugin-persistedstate            | ^3.2.3                       | ^4.7.1                       |
| rollup                                 | 新增 peer 依赖               | ^4.65.0                      |
| sass                                   | 1.78.0                       | 1.106.1                      |
| typescript                             | 5.8.2                        | 5.9.3                        |
| unocss                                 | 66.0.0                       | 66.10.5                      |
| unocss-applet                          | 0.12.2                       | 0.15.1                       |
| unplugin-auto-import                   | ^20.2.0                      | ^21.1.0                      |
| vitest                                 | 3.2.4                        | 3.2.7                        |
| vue                                    | 3.5.38                       | 3.5.44                       |
| vue-i18n                               | ^9.14.4                      | ^11.4.16                     |
