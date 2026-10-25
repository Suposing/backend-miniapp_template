import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../../../db/client';
import { audit, invalid, requireSuperAdmin } from '../../../db/helpers';
import type { menus } from '../../../generated/prisma/client';
import type { AuthUser } from '../auth/auth.service';
import { CreateMenuDto } from './dto/menu-create.dto';
import { UpdateMenuDto } from './dto/menu-update.dto';
import { AddChildDto } from './dto/menu-add-child.dto';
/**
 * 包含子菜单及字符串权限位的菜单树节点。
 */
export type MenuNode = Omit<menus, 'permissions'> & {
    /**
     * 操作权限位的十进制字符串，避免 bigint 精度丢失。
     */
    permissions: string;
    /**
     * 当前用户在此菜单资源上的实际操作授权位字符串。
     */
    userPermissions: string | null;
    /**
     * 当前节点的直接子节点列表；空数组表示叶节点。
     */
    children: MenuNode[];
};
/**
 * 将菜单记录组装为树，并将权限 bigint 转为字符串；各层按排序值降序。
 *
 * @param grants 按菜单路由索引的当前用户授权
 * @param all true 时用户授权取菜单全部声明位
 */
export function menuTree(
    rows: menus[],
    grants: Record<string, string> = {},
    all = false,
): MenuNode[] {
    const map = new Map(
        rows.map((row) => [
            row.id,
            {
                ...row,
                permissions: row.permissions.toString(),
                userPermissions: all
                    ? row.permissions.toString()
                    : row.to
                      ? (grants[row.to] ?? '0')
                      : '0',
                children: [],
            } as MenuNode,
        ]),
    );
    const roots: MenuNode[] = [];
    for (const node of map.values()) {
        const parent = node.parentId ? map.get(node.parentId) : null;
        if (parent) parent.children.push(node);
        else roots.push(node);
    }
    const sort = (list: MenuNode[]) => {
        list.sort((a, b) => b.sort - a.sort);
        for (const node of list) sort(node.children);
    };
    sort(roots);
    return roots;
}
/**
 * 后台导航与权限资源树的读取、维护及层级校验。
 */
@Injectable()
export class MenusService {
    /**
     * 生成当前用户的启用菜单树，补齐授权菜单的父目录。
     * 未登录返回空数组；超级管理员取得全部启用菜单。隐藏菜单仍保留在树中供路由判权。
     */
    async findTree(user: AuthUser | null) {
        if (!user) return [];
        const rows = await db.menus.findMany({ where: { enabled: true } });
        if (user.roles.includes('super_admin')) return menuTree(rows, {}, true);
        const grants = await db.roleMenus.findMany({
            where: {
                roleRef: {
                    enabled: true,
                    userRoles_roleId: { some: { userId: user.id } },
                },
                menuRef: { enabled: true },
            },
        });
        const ids = new Set(grants.map((g) => g.menuId)),
            byId = new Map(rows.map((r) => [r.id, r]));
        for (const id of [...ids]) {
            let cur = byId.get(id);
            const visited = new Set<string>();
            while (cur?.parentId && !visited.has(cur.parentId)) {
                visited.add(cur.parentId);
                ids.add(cur.parentId);
                cur = byId.get(cur.parentId);
            }
        }
        return menuTree(
            rows.filter((r) => ids.has(r.id)),
            user.resourcePermissions,
        );
    }
    /**
     * 读取管理用菜单树，包含停用菜单；关键词匹配时补齐父目录。
     *
     * @param order 各层菜单的排序方向，默认升序
     */
    async findManageTree(
        user: AuthUser | null,
        search?: string,
        order: 'asc' | 'desc' = 'asc',
    ) {
        const all = await db.menus.findMany();
        let rows = all;
        if (search) {
            const matched = new Set(
                all
                    .filter(
                        (r) =>
                            r.label
                                .toLowerCase()
                                .includes(search.toLowerCase()) ||
                            (r.to ?? '').includes(search),
                    )
                    .map((r) => r.id),
            );
            const map = new Map(all.map((r) => [r.id, r]));
            for (const id of [...matched]) {
                let cur = map.get(id);
                while (cur?.parentId) {
                    matched.add(cur.parentId);
                    cur = map.get(cur.parentId);
                }
            }
            rows = all.filter((r) => matched.has(r.id));
        }
        const tree = menuTree(
            rows,
            user?.resourcePermissions ?? {},
            user?.roles.includes('super_admin') ?? false,
        );
        if (order === 'asc') {
            const reverse = (list: MenuNode[]) => {
                list.reverse();
                list.forEach((n) => reverse(n.children));
            };
            reverse(tree);
        }
        return tree;
    }
    /**
     * 读取菜单详情，将声明权限和用户授权转换为字符串。
     *
     * @throws {NotFoundException} 菜单不存在时抛出
     */
    async findOne(id: string, _user?: AuthUser | null) {
        const row = await db.menus.findUnique({ where: { id } });
        if (!row) throw new NotFoundException('菜单不存在');
        return {
            ...row,
            permissions: row.permissions.toString(),
            userPermissions: _user?.roles.includes('super_admin')
                ? row.permissions.toString()
                : (_user?.resourcePermissions[row.to ?? ''] ?? '0'),
            children: [],
        };
    }
    private async parent(id: string | undefined, parentId?: string | null) {
        if (!parentId) return;
        const rows = await db.menus.findMany();
        const map = new Map(rows.map((r) => [r.id, r]));
        if (!map.has(parentId)) invalid('父菜单不存在');
        let cur = map.get(parentId);
        const seen = new Set<string>();
        while (cur) {
            if (cur.id === id || seen.has(cur.id)) invalid('菜单不能形成循环');
            seen.add(cur.id);
            cur = cur.parentId ? map.get(cur.parentId) : undefined;
        }
    }
    /**
     * 由超级管理员创建菜单，校验父级存在且无循环；空跳转目标归一为 null。
     */
    async create(dto: CreateMenuDto, operatorId: string | null) {
        await requireSuperAdmin(operatorId);
        await this.parent(undefined, dto.parentId);
        const row = await db.menus.create({
            data: {
                ...dto,
                to: dto.to || null,
                permissions: BigInt(dto.permissions ?? 0),
            },
        });
        await audit('menu.create', operatorId, { id: row.id });
        return this.findOne(row.id);
    }
    /**
     * 在指定菜单下创建子菜单，沿用创建菜单的超级管理员和父级校验。
     */
    async addChild(id: string, dto: AddChildDto, operatorId: string | null) {
        return this.create({ ...dto, parentId: id }, operatorId);
    }
    /**
     * 由超级管理员更新菜单，先检查新父级不会形成循环；省略字段保留原值。
     */
    async update(id: string, dto: UpdateMenuDto, operatorId: string | null) {
        await requireSuperAdmin(operatorId);
        await this.parent(id, dto.parentId);
        await db.menus.update({
            where: { id },
            data: {
                ...dto,
                to: dto.to === undefined ? undefined : dto.to || null,
                permissions:
                    dto.permissions === undefined
                        ? undefined
                        : BigInt(dto.permissions),
            },
        });
        await audit('menu.update', operatorId, { id });
        return this.findOne(id);
    }
    /**
     * 由超级管理员删除没有子节点的菜单，并记录操作审计。
     */
    async remove(id: string, operatorId: string | null) {
        await requireSuperAdmin(operatorId);
        if (await db.menus.count({ where: { parentId: id } }))
            invalid('请先删除子菜单');
        await db.menus.delete({ where: { id } });
        await audit('menu.delete', operatorId, { id });
        return null;
    }
}
