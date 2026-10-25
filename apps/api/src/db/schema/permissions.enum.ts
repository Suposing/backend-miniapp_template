/**
 * 保留 API 原有导入入口，权限定义与纯函数统一由共享基础包维护。
 */
export {
    Permissions,
    SUPER_ADMIN_BITS,
    SUPER_ADMIN_BITS_POSITIVE,
    SUPER_ADMIN_ROLE_CODE,
    hasPermission,
    normalizePermissionBits,
} from '@app/shared/permissions';
export type { PermissionMeta } from '@app/shared/permissions';
