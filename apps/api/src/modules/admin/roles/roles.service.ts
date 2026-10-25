import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { db } from '../../../db/client';
import {
    audit,
    contains,
    invalid,
    paged,
    paging,
    requireSuperAdmin,
} from '../../../db/helpers';
import type { Prisma } from '../../../generated/prisma/client';
import { RoleQueryDto } from './dto/role-query.dto';
import { RoleUsersQueryDto } from './dto/role-users-query.dto';
import { CreateRoleDto } from './dto/role-create.dto';
import { UpdateRoleDto } from './dto/role-update.dto';
import { RoleMenusUpdateDto } from './dto/role-menus.dto';
/**
 * 内部角色及资源授权维护，敏感写操作要求超级管理员。
 */
@Injectable()
export class RolesService {
    /**
     * 分页查询角色，附带未删除关联账号的数量和最多三个账号摘要。
     */
    async findAll(query: RoleQueryDto) {
        const q = query as RoleQueryDto & { keyword?: string; search?: string };
        const term = q.keyword ?? q.search;
        const where: Prisma.rolesWhereInput = term
            ? { OR: [{ name: contains(term) }, { code: contains(term) }] }
            : {};
        if (q.enabled !== undefined) where.enabled = q.enabled === 'true';
        const { skip, take } = paging(q);
        const [rows, total] = await Promise.all([
            db.roles.findMany({
                where,
                skip,
                take,
                orderBy: { sort: 'desc' },
                include: { userRoles_roleId: { include: { userRef: true } } },
            }),
            db.roles.count({ where }),
        ]);
        return paged(
            rows.map(({ userRoles_roleId, ...role }) => ({
                ...role,
                userCount: userRoles_roleId.filter((x) => !x.userRef.deletedAt)
                    .length,
                users: userRoles_roleId
                    .filter((x) => !x.userRef.deletedAt)
                    .slice(0, 3)
                    .map((x) => ({
                        id: x.userRef.id,
                        displayName: x.userRef.displayName,
                        username: x.userRef.username,
                        avatar: x.userRef.avatar,
                    })),
            })),
            total,
            q,
        );
    }
    /**
     * 读取角色详情。
     *
     * @throws {NotFoundException} 角色不存在时抛出
     */
    async findOne(id: string) {
        const role = await db.roles.findUnique({ where: { id } });
        if (!role) throw new NotFoundException('角色不存在');
        return role;
    }
    /**
     * 分页读取指定角色关联的未删除账号，用于成员穿透查看。
     */
    async findUsers(id: string, query: RoleUsersQueryDto) {
        await this.findOne(id);
        const { skip, take } = paging(query);
        const where = {
            deletedAt: null,
            userRoles_userId: { some: { roleId: id } },
        };
        const [data, total] = await Promise.all([
            db.users.findMany({
                where,
                skip,
                take,
                select: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatar: true,
                    employeeNo: true,
                },
            }),
            db.users.count({ where }),
        ]);
        return paged(data, total, query);
    }
    /**
     * 读取指定角色的菜单授权，以十进制字符串返回权限位，避免数值精度丢失。
     */
    async getMenus(id: string) {
        await this.findOne(id);
        const grants = await db.roleMenus.findMany({ where: { roleId: id } });
        return {
            roleId: id,
            menus: grants.map((g) => ({
                menuId: g.menuId,
                permissions: g.permissions.toString(),
            })),
        };
    }
    /**
     * 由超级管理员创建角色；super_admin 是保留编码，不允许创建。
     */
    async create(dto: CreateRoleDto, operatorId: string | null) {
        await requireSuperAdmin(operatorId);
        if (dto.code === 'super_admin') invalid('保留角色编码');
        const result = await db.roles.create({ data: dto });
        await audit('role.create', operatorId, { id: result.id });
        return result;
    }
    /**
     * 由超级管理员更新角色资料；内置超级管理员角色不能修改。
     */
    async update(id: string, dto: UpdateRoleDto, operatorId: string | null) {
        await requireSuperAdmin(operatorId);
        const current = await this.findOne(id);
        if (current.code === 'super_admin')
            throw new ForbiddenException('内置超级管理员角色不可修改');
        const result = await db.roles.update({ where: { id }, data: dto });
        await audit('role.update', operatorId, { id });
        return result;
    }
    /**
     * 由超级管理员全量替换角色的菜单授权，并记录操作审计。
     * 拒绝重复菜单、不存在的菜单、负权限位和超出菜单声明的操作位。
     * 删除旧授权与创建新授权在同一事务完成；内置超级管理员授权不可修改。
     */
    async updateMenus(
        id: string,
        dto: RoleMenusUpdateDto,
        operatorId: string | null,
    ) {
        await requireSuperAdmin(operatorId);
        const current = await this.findOne(id);
        if (current.code === 'super_admin')
            throw new ForbiddenException('内置超级管理员授权不可修改');
        const ids = dto.menus.map((g) => g.menuId);
        if (new Set(ids).size !== ids.length) invalid('菜单授权重复');
        const menus = await db.menus.findMany({ where: { id: { in: ids } } });
        if (menus.length !== ids.length) invalid('菜单不存在');
        for (const grant of dto.menus) {
            const bits = BigInt(grant.permissions),
                declared = menus.find(
                    (m) => m.id === grant.menuId,
                )!.permissions;
            if (bits < 0n || (bits & declared) !== bits)
                invalid('授权超出菜单允许操作');
        }
        await db.$transaction([
            db.roleMenus.deleteMany({ where: { roleId: id } }),
            db.roleMenus.createMany({
                data: dto.menus.map((g) => ({
                    roleId: id,
                    menuId: g.menuId,
                    permissions: BigInt(g.permissions),
                })),
            }),
        ]);
        await audit('role.grant', operatorId, { id });
        return this.getMenus(id);
    }
    /**
     * 由超级管理员删除未关联账号的普通角色；内置超级管理员角色不可删除。
     */
    async remove(id: string, operatorId: string | null) {
        await requireSuperAdmin(operatorId);
        const role = await this.findOne(id);
        if (role.code === 'super_admin')
            throw new ForbiddenException('不能删除超级管理员角色');
        if (await db.userRoles.count({ where: { roleId: id } }))
            invalid('请先解除角色与用户的关联');
        await db.roles.delete({ where: { id } });
        await audit('role.delete', operatorId, { id });
        return null;
    }
}

/**
 * 角色详情读取方法返回的资料类型。
 */
export type RoleView = Awaited<ReturnType<RolesService['findOne']>>;
