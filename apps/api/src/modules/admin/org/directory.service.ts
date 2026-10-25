import { Injectable } from '@nestjs/common';
import { db } from '../../../db/client';
import { contains, paged, paging } from '../../../db/helpers';
import type { Prisma } from '../../../generated/prisma/client';
import { DirectoryQueryDto } from './dto/directory-query.dto';
import { buildDeptPathMap, collectDeptSubtreeIds } from './org-views';
/**
 * 内部人员通讯录查询与组织、主岗摘要组装。
 */
@Injectable()
export class DirectoryService {
    /**
     * 分页查询内部人员通讯录，附带组织路径和主岗摘要。
     */
    async findAll(q: DirectoryQueryDto) {
        const where: Prisma.usersWhereInput = {
            deletedAt: null,
            deptId: q.deptId
                ? { in: await collectDeptSubtreeIds(q.deptId) }
                : undefined,
        };
        const clauses: Prisma.usersWhereInput[] = [];
        if (q.employmentStatus !== 'all')
            clauses.push(
                q.employmentStatus === 'resigned'
                    ? { employmentStatus: 'resigned' }
                    : {
                          OR: [
                              { employmentStatus: null },
                              { employmentStatus: 'employed' },
                          ],
                      },
            );
        if (q.keyword)
            clauses.push({
                OR: [
                    { displayName: contains(q.keyword) },
                    { username: contains(q.keyword) },
                    { employeeNo: contains(q.keyword) },
                ],
            });
        where.AND = clauses;
        const { skip, take } = paging(q);
        const [rows, total, paths] = await Promise.all([
            db.users.findMany({
                where,
                skip,
                take,
                include: { userPosts_userId: { include: { postRef: true } } },
                orderBy: { displayName: 'asc' },
            }),
            db.users.count({ where }),
            buildDeptPathMap(),
        ]);
        return paged(
            rows.map(
                ({ passwordHash: _passwordHash, userPosts_userId, ...r }) => ({
                    ...r,
                    entryDate: r.entryDate?.toISOString().slice(0, 10) ?? null,
                    deptPath: r.deptId ? (paths.get(r.deptId) ?? '') : '',
                    employmentStatus: r.employmentStatus ?? 'employed',
                    mainPostId:
                        userPosts_userId.find((p) => p.isMain)?.postId ?? null,
                    mainPostName:
                        userPosts_userId.find((p) => p.isMain)?.postRef.name ??
                        null,
                    posts: userPosts_userId.map((p) => ({
                        id: p.postId,
                        name: p.postRef.name,
                        isMain: p.isMain,
                    })),
                }),
            ),
            total,
            q,
        );
    }
}
