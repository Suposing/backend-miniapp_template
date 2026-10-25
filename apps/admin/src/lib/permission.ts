import {
    parsePermissionBits,
    SUPER_ADMIN_BITS_POSITIVE,
} from '@app/shared/permissions';
import type { MenuNode } from '@/lib/api-types';

export { parsePermissionBits } from '@app/shared/permissions';

/**
 * 当前用户是否具备某菜单的访问权：
 * - userPermissions 为空（未下发，开发期 Mock/兼容）→ 视为可见；
 * - 否则要求至少一个授权位（位掩码非 0）。
 */
export function canAccessMenu(menu: MenuNode): boolean {
    if (!menu.enabled) return false;

    const bits = parsePermissionBits(menu.userPermissions);

    if (bits === null) return true;

    return bits !== 0n;
}

/**
 * 递归过滤当前用户无权访问的菜单节点；
 * 分组下无任何可见子项时整组隐藏（避免出现空分组）。
 *
 * 注意：后端 GET /menus 已按用户聚合权限位过滤，本函数仅作前端兜底；
 * 侧边栏渲染只叠加 filterHiddenMenus（见 menu-fetch.ts 的教训说明）。
 */
export function filterAccessibleMenus(nodes: MenuNode[]): MenuNode[] {
    const result: MenuNode[] = [];

    for (const node of nodes) {
        if (!canAccessMenu(node)) continue;

        if (node.children?.length) {
            const children = filterAccessibleMenus(node.children);

            if (children.length === 0) continue;

            result.push({ ...node, children });
        } else {
            result.push(node);
        }
    }

    return result;
}

/**
 * 递归过滤不应在侧边栏展示的菜单节点（hideInMenu）。
 * 注意：仅用于侧边栏渲染；路由守卫仍使用完整树（含 hideInMenu 节点），
 * 使隐藏页保持「菜单不显示但直接访问可通行」。
 */
export function filterHiddenMenus(nodes: MenuNode[]): MenuNode[] {
    const result: MenuNode[] = [];

    for (const node of nodes) {
        if (node.hideInMenu) continue;

        if (node.children?.length) {
            const children = filterHiddenMenus(node.children);

            if (children.length === 0) continue;

            result.push({ ...node, children });
        } else {
            result.push(node);
        }
    }

    return result;
}

/**
 * 操作级权限判断（业务页按钮显隐用）：
 * hasPermission(userBits, requiredBits)，例如 hasPermission(bits, 1n << 4n)。
 *
 * 语义与后端对齐：用户拥有 requiredBits 中的任意一个 bit 即通过（OR）。
 * 同时识别 super_admin 全量位（9223372036854775807）。
 */
export function hasPermission(
    userBits: string | number | bigint | null | undefined,
    requiredBits: bigint,
): boolean {
    const bits =
        typeof userBits === 'bigint' ? userBits : parsePermissionBits(userBits);

    if (bits === null) return false;

    // super_admin 全量位识别（与后端 normalizePermissionBits 输出对齐）
    if (bits === SUPER_ADMIN_BITS_POSITIVE) return true;

    return (bits & requiredBits) !== 0n;
}

/**
 * 递归查找菜单树中是否存在指定路径的叶子节点（路由守卫菜单权限判定用）。
 */
export function findMenuPath(nodes: MenuNode[], path: string): boolean {
    for (const node of nodes) {
        if (node.to === path) return true;

        if (node.children && findMenuPath(node.children, path)) return true;
    }

    return false;
}
