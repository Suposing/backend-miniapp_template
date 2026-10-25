import { sortBy } from '../../../db/helpers';
import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../../../db/client';
import { audit, contains, invalid, paged, paging } from '../../../db/helpers';
import type { Prisma, depts } from '../../../generated/prisma/client';
import { DeptCreateDto } from './dto/dept-create.dto';
import { DeptUpdateDto } from './dto/dept-update.dto';
import { DeptSortDto } from './dto/dept-sort.dto';
import { DeptQueryDto } from './dto/dept-query.dto';
import { buildDeptPathMap } from './org-views';
/**
 * 组织层级、负责人和软删除规则维护。
 */
@Injectable()
export class DeptsService {
    private async views(rows: depts[]) {
        const paths = await buildDeptPathMap();
        return Promise.all(
            rows.map(async (row) => {
                const [leader, userCount, postCount] = await Promise.all([
                    row.leaderId
                        ? db.users.findUnique({
                              where: { id: row.leaderId },
                              select: {
                                  id: true,
                                  displayName: true,
                                  avatar: true,
                              },
                          })
                        : null,
                    db.users.count({
                        where: { deptId: row.id, deletedAt: null },
                    }),
                    db.posts.count({
                        where: { deptId: row.id, deletedAt: null },
                    }),
                ]);
                return {
                    ...row,
                    leader,
                    leaderName: leader?.displayName ?? null,
                    leaderAvatar: leader?.avatar ?? null,
                    deptPath: paths.get(row.id) ?? row.name,
                    userCount,
                    postCount,
                };
            }),
        );
    }
    /**
     * 读取未删除组织并组装层级树，保留停用节点以支持管理操作。
     */
    async findTree() {
        const rows = await this.views(
            await db.depts.findMany({
                where: { deletedAt: null },
                orderBy: { sort: 'desc' },
            }),
        );
        type Node = (typeof rows)[number] & { children: Node[] };
        const map = new Map(
            rows.map((r) => [r.id, { ...r, children: [] } as Node]),
        );
        const roots: Node[] = [];
        for (const node of map.values()) {
            const parent = node.parentId ? map.get(node.parentId) : null;
            if (parent) parent.children.push(node);
            else roots.push(node);
        }
        return roots;
    }
    /**
     * 分页查询未删除组织，附带负责人资料和组织摘要。
     */
    async findAll(q: DeptQueryDto) {
        const where: Prisma.deptsWhereInput = {
            deletedAt: null,
            status: q.status,
            parentId: q.parentId,
            ...(q.keyword
                ? {
                      OR: [
                          { name: contains(q.keyword) },
                          { code: contains(q.keyword) },
                      ],
                  }
                : {}),
        };
        const { skip, take } = paging(q);
        const [rows, total] = await Promise.all([
            db.depts.findMany({
                where,
                skip,
                take,
                orderBy: sortBy(
                    q.sort,
                    q.order,
                    [
                        'name',
                        'code',
                        'sort',
                        'status',
                        'createdAt',
                        'updatedAt',
                    ],
                    'sort',
                ),
            }),
            db.depts.count({ where }),
        ]);
        return paged(await this.views(rows), total, q);
    }
    /**
     * 读取未删除组织详情及负责人资料。
     *
     * @throws {NotFoundException} 组织不存在或已软删除时抛出
     */
    async findOne(id: string) {
        const row = await db.depts.findFirst({
            where: { id, deletedAt: null },
        });
        if (!row) throw new NotFoundException('组织不存在');
        return (await this.views([row]))[0];
    }
    private async validate(id: string | undefined, dto: DeptUpdateDto) {
        const rows = await db.depts.findMany({ where: { deletedAt: null } });
        const map = new Map(rows.map((r) => [r.id, r]));
        if (dto.parentId && !map.has(dto.parentId)) invalid('父组织不存在');
        let cur = dto.parentId ? map.get(dto.parentId) : undefined;
        const seen = new Set<string>();
        while (cur) {
            if (cur.id === id || seen.has(cur.id))
                invalid('组织层级不能形成循环');
            seen.add(cur.id);
            cur = cur.parentId ? map.get(cur.parentId) : undefined;
        }
        if (
            rows.some(
                (r) =>
                    r.id !== id &&
                    ((dto.name && r.name === dto.name) ||
                        (dto.code && r.code === dto.code)),
            )
        )
            invalid('组织名称或编码已存在');
        if (
            dto.leaderId &&
            !(await db.users.findFirst({
                where: { id: dto.leaderId, deletedAt: null },
            }))
        )
            invalid('负责人不存在');
    }
    /**
     * 校验名称、编码、负责人和父级关系后创建组织并记录审计。
     */
    async create(dto: DeptCreateDto, operatorId: string | null) {
        await this.validate(undefined, dto);
        const row = await db.depts.create({ data: dto });
        await audit('dept.create', operatorId, { id: row.id });
        return this.findOne(row.id);
    }
    /**
     * 校验组织唯一字段及层级不会形成循环后更新资料；省略字段保留原值。
     */
    async update(id: string, dto: DeptUpdateDto, operatorId: string | null) {
        await this.findOne(id);
        await this.validate(id, dto);
        await db.depts.update({ where: { id }, data: dto });
        await audit('dept.update', operatorId, { id });
        return this.findOne(id);
    }
    /**
     * 先在内存中应用整批父级变更并检查最终树无循环，再事务内保存父级和排序。
     * 整批校验允许同时移动多个节点，避免只校验单项造成错误层级。
     */
    async sort(dto: DeptSortDto, operatorId: string | null) {
        const rows = await db.depts.findMany({ where: { deletedAt: null } }),
            map = new Map(rows.map((r) => [r.id, { ...r }]));
        for (const item of dto.items) {
            const row = map.get(item.id);
            if (!row) invalid('组织不存在');
            if (item.parentId !== undefined) row.parentId = item.parentId;
        }
        for (const row of map.values()) {
            let cur: typeof row | undefined = row;
            const seen = new Set<string>();
            while (cur) {
                if (seen.has(cur.id)) invalid('组织层级不能形成循环');
                seen.add(cur.id);
                if (cur.parentId && !map.has(cur.parentId))
                    invalid('父组织不存在');
                cur = cur.parentId ? map.get(cur.parentId) : undefined;
            }
        }
        await db.$transaction(
            dto.items.map(({ id, ...data }) =>
                db.depts.update({ where: { id }, data }),
            ),
        );
        await audit('dept.sort', operatorId);
        return this.findTree();
    }
    /**
     * 软删除没有下级组织、岗位和关联人员的组织，并记录审计。
     */
    async remove(id: string, operatorId: string | null) {
        await this.findOne(id);
        if (
            (await db.depts.count({
                where: { parentId: id, deletedAt: null },
            })) ||
            (await db.posts.count({
                where: { deptId: id, deletedAt: null },
            })) ||
            (await db.users.count({ where: { deptId: id, deletedAt: null } }))
        )
            invalid('请先移除下级组织、岗位及关联人员');
        await db.depts.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        await audit('dept.delete', operatorId, { id });
        return null;
    }
}

/**
 * 组织详情及负责人资料的输出类型。
 */
export type DeptView = Awaited<ReturnType<DeptsService['findOne']>>;
