/**
 * 单个权限操作的名称、位值与图标；不包含用户授权或资源范围。
 */
export interface PermissionMeta {
    /**
     * 枚举键名，如 'ADD'
     */
    value: string;
    /**
     * 下发前端的标签，如 'add'
     */
    label: string;
    /**
     * 位掩码值（bigint）
     */
    bits: bigint;
    /**
     * 图标（裸 lucide 图标名，如 'plus'；前端 DynamicIcon 直接消费，与 menus.icon 约定一致）
     */
    icon: string;
}

/**
 * 后台操作权限定义；每个操作占一个独立位，实际授权仍由 API 按资源检查。
 */
export const Permissions = {
    SEARCH: { value: 'SEARCH', label: 'search', bits: 1n, icon: 'search' },
    ADD: { value: 'ADD', label: 'add', bits: 2n, icon: 'plus' },
    EDIT: { value: 'EDIT', label: 'edit', bits: 4n, icon: 'pencil-line' },
    DELETE: { value: 'DELETE', label: 'delete', bits: 8n, icon: 'trash-2' },
    BATCH_DELETE: {
        value: 'BATCH_DELETE',
        label: 'batchDelete',
        bits: 16n,
        icon: 'list-x',
    },
    ADD_CHILD: {
        value: 'ADD_CHILD',
        label: 'addChild',
        bits: 32n,
        icon: 'git-branch-plus',
    },
    RESET: { value: 'RESET', label: 'reset', bits: 64n, icon: 'rotate-ccw' },
    RESET_PASSWORD: {
        value: 'RESET_PASSWORD',
        label: 'resetPassword',
        bits: 128n,
        icon: 'key-round',
    },
    GRANT: { value: 'GRANT', label: 'grant', bits: 256n, icon: 'shield-check' },
    EXPORT: { value: 'EXPORT', label: '导出', bits: 512n, icon: 'download' },
} as const satisfies Record<string, PermissionMeta>;

/**
 * 超级管理员全量位，内部存储以 -1n 表示。
 */
export const SUPER_ADMIN_BITS = -1n;

export { SUPER_ADMIN_ROLE_CODE } from '../constants/index.js';

/**
 * 超级管理员全量位的正数表示（2^63 - 1 = 9223372036854775807）。
 * 对外 JSON 以十进制字符串传输，避免 JavaScript number 丢失整数精度。
 */
export const SUPER_ADMIN_BITS_POSITIVE = 9223372036854775807n;

/**
 * 将负权限位与 2^63-1 按位与，保留低 63 位；非负值原样返回。
 * 超级管理员内部值 -1n 因此转换为 9223372036854775807n。
 * 用于对外输出（auth/me、menus.userPermissions、roles/:id/menus）。
 */
export function normalizePermissionBits(bits: bigint): bigint {
    return bits < 0n ? bits & SUPER_ADMIN_BITS_POSITIVE : bits;
}

/**
 * 判定当前资源的授权位是否包含任一所需操作；不负责查询角色或资源范围。
 *
 * @param userBits 当前资源的用户授权位，不可传入所有菜单的合并值
 * @param requiredBit 所需操作位，多个位表示任一操作符合即可
 * @returns 是否拥有该权限
 */
export function hasPermission(userBits: bigint, requiredBit: bigint): boolean {
    // 全量位识别：内部存储的有符号 -1n 与对外正数 2^63-1 均视为超级管理员全量
    if (userBits === -1n || userBits === SUPER_ADMIN_BITS_POSITIVE) return true;
    return (userBits & requiredBit) !== 0n;
}

/**
 * 解析接口下发的权限位；空值或无法转换的值返回 null。
 * 大权限位必须使用十进制字符串，已失真的 number 无法恢复原始精度。
 */
export function parsePermissionBits(
    bits: string | number | null | undefined,
): bigint | null {
    if (bits === null || bits === undefined || bits === '') return null;

    // 保留既有 number 输入兼容；转为字符串无法恢复已经丢失的整数精度。
    const normalized = typeof bits === 'number' ? String(bits) : bits;

    try {
        return BigInt(normalized);
    } catch {
        return null;
    }
}
