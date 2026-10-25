import type { MenuNode } from '@/lib/api-types';

import { ApiClientError, fetchApi } from '@/lib/api-client';

/**
 * 菜单模块 API 层：管理树拉取 + CRUD（无 target 字段）。
 */

/**
 * 菜单错误码 → 本地化文案（未命中回退后端 message）
 */
export function getMenuErrorMessage(error: unknown): string {
    const code = error instanceof ApiClientError ? error.code : undefined;

    switch (code) {
        case 'MENU_NOT_FOUND':
            return '菜单不存在';
        case 'MENU_TO_EXISTS':
            return '路由路径已存在';
        case 'MENU_TO_INVALID':
            return '路由路径必须以 / 或 https:// 开头';
        case 'MENU_HAS_CHILDREN':
            return '该菜单存在子菜单，无法删除';
        case 'MENU_PARENT_INVALID':
            return '父菜单不合法（不存在或移动到自身及下级菜单下）';
        case 'INVALID_OPERATION':
            return 'permissions 不是合法的权限位掩码';
        default:
            return error instanceof Error ? error.message : String(error);
    }
}

/**
 * 管理用全量菜单树查询 key（与导航树 MENUS_QUERY_KEY 分离，便于精准失效）
 */
export const MENUS_TREE_QUERY_KEY = ['menus', 'manageTree'] as const;

/**
 * GET /api/admin/menus/tree — 全量树（含停用/隐藏节点；search 后端模糊过滤）
 */
export function fetchManageMenuTree(search?: string) {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';

    return fetchApi<MenuNode[]>(`/menus/tree${query}`);
}

/**
 * 菜单创建/更新载荷（UpdateMenuDto 为部分更新语义）
 */
export interface MenuSaveInput {
    /**
     * 界面展示的中文名称或控件标签。
     */
    label: string;

    /**
     * 图标名称，按当前组件的图标约定渲染。
     */
    icon: string;
    /**
     * 页面路由或外部链接；空值表示没有直接跳转目标。
     */
    to?: string | null;
    /**
     * 父级记录 ID；null 表示顶层节点。
     */
    parentId?: string | null;
    /**
     * 菜单排序值，导航默认降序，管理树可选择方向。
     */
    sort?: number;
    /**
     * 是否缓存页面组件状态。
     */
    keepAlive?: boolean;
    /**
     * 是否在导航中隐藏；不代表撤销路由或接口授权。
     */
    hideInMenu?: boolean;
    /**
     * 是否启用；true 启用，false 停用。
     */
    enabled?: boolean;
    /**
     * 组件初始化时是否展开内容。
     */
    defaultOpen?: boolean;
    /**
     * bigint 位掩码字符串（勾选权限位的 OR）
     */
    permissions?: string;
}

/**
 * POST /api/admin/menus — 创建顶级/指定父级菜单
 */
export function createMenu(input: MenuSaveInput) {
    return fetchApi<MenuNode>('/menus', { method: 'POST', body: input });
}

/**
 * POST /api/admin/menus/:id/add-child — 新增子菜单（ADD_CHILD 位）
 */
export function addChildMenu(parentId: string, input: MenuSaveInput) {
    return fetchApi<MenuNode>(`/menus/${parentId}/add-child`, {
        method: 'POST',
        body: input,
    });
}

/**
 * PUT /api/admin/menus/:id — 更新（to 传 null 表示清空路由，转为目录节点）
 */
export function updateMenu(id: string, input: MenuSaveInput) {
    return fetchApi<MenuNode>(`/menus/${id}`, { method: 'PUT', body: input });
}

/**
 * DELETE /api/admin/menus/:id — 删除（有子菜单后端 409 拦截）
 */
export function deleteMenu(id: string) {
    return fetchApi<null>(`/menus/${id}`, { method: 'DELETE' });
}
