# 小程序注释规范入口

小程序、管理后台、API 和工程脚本统一遵循根目录的 [全项目注释规范](../../JSDOC_STYLE.md)。

本文件保留为原路径入口，不再独立维护另一份规范。新增或修改代码时，以根规范为准。

JSDoc 即使只有一句说明，也必须分行：

```ts
/**
 * 查询用户列表时使用的缓存 key 前缀。
 */
export const USERS_QUERY_KEY = ['users'] as const;
```

具体的函数、类型字段、Props、事件、状态、DTO、Prisma/SQL 和测试写法，请查看根规范。
