# 上游来源

## Better Admin

- 仓库：https://github.com/baiwumm/better-admin
- 基线提交：4884d852cb8315b35d25b4b8b46e8512b4f58bf5（2026-10-16）。
- Vue 管理端与 NestJS 接口基础来源于该项目，许可证原文见 `better-admin.LICENSE`。
- vue3-admin：https://github.com/baiwumm/vue3-admin，仅作为设计与 Prisma 集成参考，未整体合并其旧后端。

本模板在上游基础上进行单一管理端收敛、Prisma/PostgreSQL 改造、资源权限隔离、分端 API 和共享包整合。

## uni-base

- 仓库：https://github.com/Suposing/uni-base
- 基线提交：3884407eb8faa852f266518c308854d9641d541f（2026-06-29）。
- 接入路径：`apps/miniapp`；上游说明原文保存在 `uni-base.README.md`，其中命令和版本描述反映上游基线，当前工程以根目录及小程序 README 为准。
- 接入工作包括 Windows 配置加载兼容、workspace 整合、中文文案与 API 响应适配；早期 VueUse / unconfig 补丁已随依赖更新移除。
- 不包含上游 Git 历史、依赖目录、构建产物或本地环境配置。
