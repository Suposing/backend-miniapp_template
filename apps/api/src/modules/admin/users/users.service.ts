import { sortBy } from '../../../db/helpers';
import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
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
import { CreateUserDto } from './dto/user-create.dto';
import { UpdateUserDto } from './dto/user-update.dto';
import { UserQueryDto } from './dto/user-query.dto';
import {
    assertPasswordNotContainingUsername,
    assertPasswordNotSameAsCurrent,
} from '../../../common/validators/password-policy';
const include = {
    userRoles_userId: { include: { roleRef: true } },
    userPosts_userId: { include: { postRef: true } },
    deptRef: true,
} as const;
type RecordView = Prisma.usersGetPayload<{ include: typeof include }>;
/**
 * 将账号关联记录转为管理端详情，排除密码哈希，并将入职日期转为 YYYY-MM-DD。
 */
export function toUserView(row: RecordView) {
    const {
        passwordHash: _passwordHash,
        userRoles_userId,
        userPosts_userId,
        deptRef,
        ...user
    } = row;
    return {
        ...user,
        entryDate: user.entryDate?.toISOString().slice(0, 10) ?? null,
        roles: userRoles_userId.map((x) => ({
            id: x.roleRef.id,
            name: x.roleRef.name,
            code: x.roleRef.code,
        })),
        dept: deptRef ? { id: deptRef.id, name: deptRef.name } : null,
        deptName: deptRef?.name ?? null,
        posts: userPosts_userId
            .filter((x) => !x.postRef.deletedAt)
            .map((x) => ({
                id: x.postRef.id,
                name: x.postRef.name,
                category: x.postRef.category,
                isMain: x.isMain,
            })),
    };
}
/**
 * 排除密码哈希并包含角色、组织和岗位摘要的内部账号输出。
 */
export type UserView = ReturnType<typeof toUserView>;
/**
 * 内部账号档案和角色、岗位关联维护，处理受保护账号及会话失效。
 */
@Injectable()
export class UsersService {
    /**
     * 分页查询未删除的内部账号，附带角色、组织和未删除岗位摘要。
     * 支持关键词、账号状态、组织和角色筛选，排序字段通过白名单限制。
     */
    async findAll(query: UserQueryDto) {
        const q = query as UserQueryDto & {
            keyword?: string;
            search?: string;
            roleId?: string;
        };
        const term = q.keyword ?? q.search;
        const where: Prisma.usersWhereInput = {
            deletedAt: null,
            ...(term
                ? {
                      OR: [
                          { username: contains(term) },
                          { displayName: contains(term) },
                          { email: contains(term) },
                      ],
                  }
                : {}),
        };
        for (const key of ['status', 'deptId', 'employmentStatus'] as const)
            if (key in q && (q as Record<string, unknown>)[key])
                Object.assign(where, {
                    [key]: (q as Record<string, unknown>)[key],
                });
        if (q.roleId) where.userRoles_userId = { some: { roleId: q.roleId } };
        const { skip, take } = paging(query);
        const [rows, total] = await Promise.all([
            db.users.findMany({
                where,
                include,
                skip,
                take,
                orderBy: sortBy(
                    query.sort,
                    query.order,
                    [
                        'username',
                        'displayName',
                        'email',
                        'status',
                        'createdAt',
                        'updatedAt',
                    ],
                    'createdAt',
                ),
            }),
            db.users.count({ where }),
        ]);
        return paged(rows.map(toUserView), total, query);
    }
    /**
     * 读取未删除的内部账号详情，输出中排除密码哈希。
     *
     * @throws {NotFoundException} 账号不存在或已软删除时抛出
     */
    async findOne(id: string): Promise<UserView> {
        const row = await db.users.findFirst({
            where: { id, deletedAt: null },
            include,
        });
        if (!row) throw new NotFoundException('用户不存在');
        return toUserView(row);
    }
    private async validateUnique(
        username?: string,
        email?: string,
        except?: string,
    ) {
        const OR: Prisma.usersWhereInput[] = [];
        if (username) OR.push({ username });
        if (email) OR.push({ email });
        if (
            OR.length &&
            (await db.users.findFirst({
                where: {
                    deletedAt: null,
                    id: except ? { not: except } : undefined,
                    OR,
                },
            }))
        )
            invalid('用户名或邮箱已存在');
    }
    /**
     * 检查组织与岗位存在且未删除；提供主岗时要求它属于同时提交的岗位列表。
     * 此检查不要求组织或岗位处于启用状态。
     */
    private async relations(
        deptId?: string | null,
        postIds?: string[],
        mainPostId?: string | null,
    ) {
        if (
            deptId &&
            !(await db.depts.findFirst({
                where: { id: deptId, deletedAt: null },
            }))
        )
            invalid('组织不存在');
        if (
            postIds &&
            (await db.posts.count({
                where: { id: { in: postIds }, deletedAt: null },
            })) !== new Set(postIds).size
        )
            invalid('岗位不存在');
        if (mainPostId && !postIds?.includes(mainPostId))
            invalid('主岗必须属于所选岗位');
    }
    /**
     * 创建内部账号及角色、岗位关联，并记录操作审计。
     * 分配非空角色列表需要超级管理员；密码只保存 bcrypt 哈希。
     */
    async create(
        dto: CreateUserDto,
        operatorId: string | null,
    ): Promise<UserView> {
        const {
            roleIds = [],
            postIds = [],
            mainPostId,
            entryDate,
            password,
            ...data
        } = dto;
        if (roleIds.length) await requireSuperAdmin(operatorId);
        assertPasswordNotContainingUsername(password, dto.username);
        await this.validateUnique(dto.username, dto.email);
        await this.relations(dto.deptId, postIds, mainPostId);
        const row = await db.users.create({
            data: {
                ...data,
                entryDate: entryDate ? new Date(entryDate) : null,
                passwordHash: await bcrypt.hash(password, 10),
                userRoles_userId: {
                    create: roleIds.map((roleId) => ({ roleId })),
                },
                userPosts_userId: {
                    create: postIds.map((postId) => ({
                        postId,
                        isMain: postId === mainPostId,
                    })),
                },
            },
        });
        await audit('user.create', operatorId, { id: row.id });
        return this.findOne(row.id);
    }
    /**
     * 更新内部账号资料；角色和岗位数组仅在提供时全量替换。
     * 资料与关联在同一事务更新，停用时递增会话版本并删除刷新会话。
     * 角色发生变化或编辑超级管理员账号时要求超级管理员身份。
     */
    async update(
        id: string,
        dto: UpdateUserDto,
        operatorId: string | null,
    ): Promise<UserView> {
        const current = await this.findOne(id);
        if (dto.roleIds !== undefined) {
            const existingRoles = new Set(current.roles.map((role) => role.id));
            const rolesChanged =
                dto.roleIds.length !== existingRoles.size ||
                dto.roleIds.some((roleId) => !existingRoles.has(roleId));
            if (rolesChanged) await requireSuperAdmin(operatorId);
            if (
                current.username === 'admin' &&
                !(await db.roles.findFirst({
                    where: { id: { in: dto.roleIds }, code: 'super_admin' },
                }))
            )
                throw new ForbiddenException(
                    '内置管理员必须保留超级管理员角色',
                );
        }
        if (dto.status === 'disabled') await this.operable(id, operatorId);
        if (current.roles.some((r) => r.code === 'super_admin'))
            await requireSuperAdmin(operatorId);
        await this.validateUnique(undefined, dto.email, id);
        await this.relations(dto.deptId, dto.postIds, dto.mainPostId);
        const { roleIds, postIds, mainPostId, entryDate, ...data } = dto;
        await db.$transaction(async (tx) => {
            await tx.users.update({
                where: { id },
                data: {
                    ...data,
                    entryDate:
                        entryDate === undefined
                            ? undefined
                            : entryDate
                              ? new Date(entryDate)
                              : null,
                    ...(dto.status === 'disabled'
                        ? { tokenVersion: { increment: 1 } }
                        : {}),
                },
            });
            if (roleIds !== undefined) {
                await tx.userRoles.deleteMany({ where: { userId: id } });
                await tx.userRoles.createMany({
                    data: roleIds.map((roleId) => ({ userId: id, roleId })),
                });
            }
            if (postIds !== undefined) {
                await tx.userPosts.deleteMany({ where: { userId: id } });
                await tx.userPosts.createMany({
                    data: postIds.map((postId) => ({
                        userId: id,
                        postId,
                        isMain: postId === mainPostId,
                    })),
                });
            }
            if (dto.status === 'disabled')
                await tx.refreshTokens.deleteMany({ where: { userId: id } });
        });
        await audit('user.update', operatorId, { id });
        return this.findOne(id);
    }
    /**
     * 阻止删除、停用或重置本人和内置管理员；目标为超级管理员时额外校验操作者身份。
     */
    private async operable(id: string, operatorId: string | null) {
        const target = await this.findOne(id);
        if (id === operatorId || target.username === 'admin')
            throw new ForbiddenException(
                '不能删除、停用或重置本人及内置管理员',
            );
        if (target.roles.some((r) => r.code === 'super_admin'))
            await requireSuperAdmin(operatorId);
    }
    /**
     * 按批量删除规则软删除一个内部账号，同时撤销其会话。
     */
    async remove(id: string, operatorId: string | null) {
        return this.batchRemove([id], operatorId);
    }
    /**
     * 逐个检查受保护账号后，事务内软删除账号、递增会话版本并删除刷新会话。
     * 本人、内置管理员和无权操作的超级管理员账号不能删除。
     */
    async batchRemove(ids: string[], operatorId: string | null) {
        for (const id of ids) await this.operable(id, operatorId);
        await db.$transaction([
            db.users.updateMany({
                where: { id: { in: ids } },
                data: { deletedAt: new Date(), tokenVersion: { increment: 1 } },
            }),
            db.userRoles.deleteMany({ where: { userId: { in: ids } } }),
            db.userPosts.deleteMany({ where: { userId: { in: ids } } }),
            db.refreshTokens.deleteMany({ where: { userId: { in: ids } } }),
        ]);
        await audit('user.delete', operatorId, { ids });
        return null;
    }
    /**
     * 校验操作对象与密码策略后重置密码，并在事务内撤销该账号全部已有会话。
     * 不允许重置本人或内置管理员密码。
     */
    async resetPassword(
        id: string,
        password: string,
        operatorId: string | null,
    ) {
        await this.operable(id, operatorId);
        const target = await db.users.findUniqueOrThrow({ where: { id } });
        assertPasswordNotContainingUsername(password, target.username);
        await assertPasswordNotSameAsCurrent(password, target.passwordHash);
        await db.$transaction([
            db.users.update({
                where: { id },
                data: {
                    passwordHash: await bcrypt.hash(password, 10),
                    tokenVersion: { increment: 1 },
                },
            }),
            db.refreshTokens.deleteMany({ where: { userId: id } }),
        ]);
        await audit('user.reset_password', operatorId, { id });
        return null;
    }
    /**
     * 切换内部账号启停状态；停用时按受保护账号规则校验并撤销会话。
     */
    async updateStatus(
        id: string,
        status: 'active' | 'disabled',
        operatorId: string | null,
    ) {
        return this.update(id, { status }, operatorId);
    }
}
