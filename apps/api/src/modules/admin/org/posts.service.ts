import { sortBy } from '../../../db/helpers';
import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../../../db/client';
import { audit, contains, invalid, paged, paging } from '../../../db/helpers';
import type { Prisma, posts } from '../../../generated/prisma/client';
import { PostCreateDto } from './dto/post-create.dto';
import { PostUpdateDto } from './dto/post-update.dto';
import { PostQueryDto, PostMembersQueryDto } from './dto/post-query.dto';
import {
    assertValidDeptId,
    buildDeptPathMap,
    collectDeptSubtreeIds,
} from './org-views';
/**
 * 组织下的岗位档案及关联人员查询维护。
 */
@Injectable()
export class PostsService {
    private async view(row: posts) {
        const paths = await buildDeptPathMap();
        return {
            ...row,
            deptPath: paths.get(row.deptId) ?? '',
            userCount: await db.userPosts.count({
                where: {
                    postId: row.id,
                    userRef: {
                        deletedAt: null,
                        OR: [
                            { employmentStatus: null },
                            { employmentStatus: 'employed' },
                        ],
                    },
                },
            }),
        };
    }
    /**
     * 分页查询未删除岗位，组织筛选包含下级组织，返回组织路径和人员数量。
     */
    async findAll(q: PostQueryDto) {
        const where: Prisma.postsWhereInput = {
            deletedAt: null,
            name: contains(q.keyword),
            category: q.category,
            status: q.status,
            deptId: q.deptId
                ? { in: await collectDeptSubtreeIds(q.deptId) }
                : undefined,
        };
        const { skip, take } = paging(q);
        const [rows, total] = await Promise.all([
            db.posts.findMany({
                where,
                skip,
                take,
                orderBy: sortBy(
                    q.sort,
                    q.order,
                    [
                        'name',
                        'category',
                        'rank',
                        'status',
                        'createdAt',
                        'updatedAt',
                    ],
                    'createdAt',
                ),
            }),
            db.posts.count({ where }),
        ]);
        return paged(
            await Promise.all(rows.map((r) => this.view(r))),
            total,
            q,
        );
    }
    /**
     * 读取未删除岗位详情及组织路径。
     *
     * @throws {NotFoundException} 岗位不存在或已软删除时抛出
     */
    async findOne(id: string) {
        const row = await db.posts.findFirst({
            where: { id, deletedAt: null },
        });
        if (!row) throw new NotFoundException('岗位不存在');
        return this.view(row);
    }
    /**
     * 分页读取指定岗位关联的未删除在职人员；未设置在职状态的存量账号也纳入。
     */
    async findMembers(id: string, q: PostMembersQueryDto) {
        await this.findOne(id);
        const { skip, take } = paging(q);
        const where: Prisma.usersWhereInput = {
            deletedAt: null,
            userPosts_userId: { some: { postId: id } },
            OR: [{ employmentStatus: null }, { employmentStatus: 'employed' }],
        };
        const [rows, total] = await Promise.all([
            db.users.findMany({
                where,
                skip,
                take,
                select: {
                    id: true,
                    displayName: true,
                    username: true,
                    employeeNo: true,
                    avatar: true,
                    deptId: true,
                },
            }),
            db.users.count({ where }),
        ]);
        return paged(rows, total, q);
    }
    /**
     * 校验组织存在及组织内岗位名称唯一后创建岗位，并记录审计。
     */
    async create(dto: PostCreateDto, operatorId: string | null) {
        await assertValidDeptId(dto.deptId);
        if (
            await db.posts.findFirst({
                where: { deptId: dto.deptId, name: dto.name, deletedAt: null },
            })
        )
            invalid('岗位名称已存在');
        const row = await db.posts.create({ data: dto });
        await audit('post.create', operatorId, { id: row.id });
        return this.findOne(row.id);
    }
    /**
     * 校验目标组织和组织内名称唯一后更新岗位；省略字段保留原值。
     */
    async update(id: string, dto: PostUpdateDto, operatorId: string | null) {
        const old = await this.findOne(id);
        if (dto.deptId) await assertValidDeptId(dto.deptId);
        if (
            await db.posts.findFirst({
                where: {
                    id: { not: id },
                    deptId: dto.deptId ?? old.deptId,
                    name: dto.name ?? old.name,
                    deletedAt: null,
                },
            })
        )
            invalid('岗位名称已存在');
        await db.posts.update({ where: { id }, data: dto });
        await audit('post.update', operatorId, { id });
        return this.findOne(id);
    }
    /**
     * 软删除未关联人员的岗位；存在 user_posts 关联时拒绝删除。
     */
    async remove(id: string, operatorId: string | null) {
        await this.findOne(id);
        if (await db.userPosts.count({ where: { postId: id } }))
            invalid('请先解除岗位人员关联');
        await db.posts.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        await audit('post.delete', operatorId, { id });
        return null;
    }
}

/**
 * 岗位详情、组织路径和人员数量的输出类型。
 */
export type PostView = Awaited<ReturnType<PostsService['findOne']>>;
