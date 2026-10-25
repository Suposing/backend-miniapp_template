import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { db } from '../../../db/client';
import { audit, contains, invalid, paged, paging } from '../../../db/helpers';
import type { AuthUser } from '../auth/auth.service';
import type { notices } from '../../../generated/prisma/client';
import {
    assertScopeTargets,
    buildDeptPathMap,
    resolveScopeUserIds,
} from '../org/org-views';
import { NoticeCreateDto, NoticeUpdateDto } from './dto/notice.dto';
import {
    NoticeMineQueryDto,
    NoticeQueryDto,
    NoticeReadStatsQueryDto,
} from './dto/notice-query.dto';
/**
 * 内部公告范围、首次阅读、发布和催读流程。
 */
@Injectable()
export class NoticesService {
    private async row(id: string) {
        const row = await db.notices.findFirst({
            where: { id, deletedAt: null },
        });
        if (!row) throw new NotFoundException('公告不存在');
        return row;
    }
    private async scopes(id: string) {
        return db.noticeScopes.findMany({ where: { noticeId: id } });
    }
    /**
     * 根据当前范围和当前人员状态解析收件人；结果不是发布时的人员快照。
     */
    private async recipients(id: string) {
        return resolveScopeUserIds(await this.scopes(id));
    }
    /**
     * 公告写操作只允许发布人或超级管理员；菜单编辑权限不能替代所有者校验。
     */
    private async owner(row: notices, user: AuthUser) {
        if (row.publisherId !== user.id && !user.roles.includes('super_admin'))
            throw new ForbiddenException('仅发布人或超级管理员可以修改此公告');
    }
    private async view(row: notices, userId?: string) {
        const [scopes, ids, reads, publisher] = await Promise.all([
            this.scopes(row.id),
            this.recipients(row.id),
            db.noticeReadRecords.findMany({
                where: { noticeId: row.id },
                include: {
                    userRef: { select: { displayName: true, avatar: true } },
                },
                orderBy: { readAt: 'desc' },
            }),
            row.publisherId
                ? db.users.findUnique({
                      where: { id: row.publisherId },
                      select: { displayName: true, email: true, avatar: true },
                  })
                : null,
        ]);
        const enriched = await Promise.all(
            scopes.map(async (scope) => {
                const target =
                    scope.scopeType === 'dept'
                        ? await db.depts.findUnique({
                              where: { id: scope.targetId },
                              select: { name: true },
                          })
                        : scope.scopeType === 'post'
                          ? await db.posts.findUnique({
                                where: { id: scope.targetId },
                                select: { name: true },
                            })
                          : await db.users.findUnique({
                                where: { id: scope.targetId },
                                select: { displayName: true },
                            });
                return {
                    ...scope,
                    targetName: target
                        ? 'name' in target
                            ? target.name
                            : target.displayName
                        : null,
                };
            }),
        );
        const readCount = reads.filter((r) => ids.includes(r.userId)).length;
        return {
            ...row,
            publisherName: publisher?.displayName ?? null,
            publisherEmail: publisher?.email ?? null,
            publisherAvatar: publisher?.avatar ?? null,
            scopeCount: scopes.length,
            scopes: enriched,
            readCount,
            totalCount: ids.length,
            readRate: ids.length
                ? Math.round((readCount / ids.length) * 100)
                : null,
            readers: reads.slice(0, 3).map((r) => ({
                id: r.userId,
                name: r.userRef.displayName,
                avatar: r.userRef.avatar,
            })),
            myReadAt: reads.find((r) => r.userId === userId)?.readAt ?? null,
        };
    }
    /**
     * 分页查询未删除的管理公告，按置顶、计划发布时间降序返回，并汇总阅读情况。
     */
    async findAll(q: NoticeQueryDto) {
        const where = {
            deletedAt: null,
            status: q.status,
            title: contains(q.keyword),
        };
        const { skip, take } = paging(q);
        const [rows, total] = await Promise.all([
            db.notices.findMany({
                where,
                skip,
                take,
                orderBy: [{ isTop: 'desc' }, { publishTime: 'desc' }],
            }),
            db.notices.count({ where }),
        ]);
        return paged(
            await Promise.all(rows.map((r) => this.view(r))),
            total,
            q,
        );
    }
    /**
     * 按当前接收范围筛选已发布且到期的公告，再按阅读状态分页。
     * 仅返回当前内部用户可接收的公告。
     */
    async findMine(userId: string, q: NoticeMineQueryDto) {
        const rows = await db.notices.findMany({
            where: {
                deletedAt: null,
                status: 'published',
                publishTime: { lte: new Date() },
                title: contains(q.keyword),
            },
            orderBy: [{ isTop: 'desc' }, { publishTime: 'desc' }],
        });
        const visible = [];
        for (const row of rows)
            if ((await this.recipients(row.id)).includes(userId)) {
                const view = await this.view(row, userId);
                if (
                    (q.readStatus === 'read' && !view.myReadAt) ||
                    (q.readStatus === 'unread' && view.myReadAt)
                )
                    continue;
                visible.push(view);
            }
        const { skip, take } = paging(q);
        return paged(visible.slice(skip, skip + take), visible.length, q);
    }
    /**
     * 校验公告可见范围并读取详情；范围内已发布公告通过 upsert 记录首次阅读。
     * 管理查看权限、发布人或超级管理员允许查看范围外公告，范围外查看不会计为阅读。
     *
     * @param ip 阅读请求来源 IP；省略时保存空字符串
     * @throws {ForbiddenException} 当前用户既不可接收也无管理查看资格时抛出
     */
    async findVisibleDetail(id: string, user: AuthUser, ip = '') {
        const row = await this.row(id);
        const visible =
            row.status === 'published' &&
            row.publishTime <= new Date() &&
            (await this.recipients(id)).includes(user.id);
        const manager =
            user.roles.includes('super_admin') ||
            (BigInt(user.resourcePermissions['/org/notices'] ?? '0') & 1n) !==
                0n;
        if (!visible && !manager && row.publisherId !== user.id)
            throw new ForbiddenException('无权查看该公告');
        if (visible)
            await db.noticeReadRecords.upsert({
                where: { noticeId_userId: { noticeId: id, userId: user.id } },
                create: { noticeId: id, userId: user.id, ipAddress: ip },
                update: {},
            });
        return this.view(row, user.id);
    }
    /**
     * 校验接收目标并创建待发布公告及范围关联，然后执行到期发布扫描。
     * 省略或清空计划发布时间时使用当前时间；发布扫描与创建记录分别执行。
     */
    async create(dto: NoticeCreateDto, user: AuthUser) {
        await assertScopeTargets(dto.scopeTargets);
        const { scopeTargets, publishTime, ...data } = dto;
        const row = await db.notices.create({
            data: {
                ...data,
                publisherId: user.id,
                status: 'draft',
                publishTime: publishTime ? new Date(publishTime) : new Date(),
                noticeScopes_noticeId: { create: scopeTargets },
            },
        });
        await this.publishDueNotices();
        await audit('notice.create', user.id, { id: row.id });
        return this.findVisibleDetail(row.id, user);
    }
    /**
     * 由发布人或超级管理员修改公告；提供范围数组时在事务内全量替换。
     * 提供计划发布时间会重置为待发布，随后执行到期发布扫描。
     */
    async update(id: string, dto: NoticeUpdateDto, user: AuthUser) {
        const row = await this.row(id);
        await this.owner(row, user);
        const { scopeTargets, publishTime, ...data } = dto;
        if (scopeTargets) await assertScopeTargets(scopeTargets);
        await db.$transaction(async (tx) => {
            await tx.notices.update({
                where: { id },
                data: {
                    ...data,
                    ...(publishTime !== undefined
                        ? {
                              publishTime: publishTime
                                  ? new Date(publishTime)
                                  : new Date(),
                              status: 'draft',
                          }
                        : {}),
                },
            });
            if (scopeTargets) {
                await tx.noticeScopes.deleteMany({ where: { noticeId: id } });
                await tx.noticeScopes.createMany({
                    data: scopeTargets.map((s) => ({ ...s, noticeId: id })),
                });
            }
        });
        await this.publishDueNotices();
        await audit('notice.update', user.id, { id });
        return this.findVisibleDetail(id, user);
    }
    /**
     * 由发布人或超级管理员软删除公告，使其不再出现在业务查询中。
     */
    async remove(id: string, user: AuthUser) {
        const row = await this.row(id);
        await this.owner(row, user);
        await db.notices.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        await audit('notice.delete', user.id, { id });
        return null;
    }
    /**
     * 由发布人或超级管理员将公告状态改为已撤回，保留内容和阅读记录。
     */
    async withdraw(id: string, user: AuthUser) {
        const row = await this.row(id);
        await this.owner(row, user);
        await db.notices.update({
            where: { id },
            data: { status: 'withdrawn' },
        });
        await audit('notice.withdraw', user.id, { id });
        return this.view(await this.row(id));
    }
    /**
     * 按公告当前接收人员集合分页读取已读或未读名单，附带组织路径和主岗信息。
     */
    async findReadStats(id: string, q: NoticeReadStatsQueryDto) {
        await this.row(id);
        const ids = await this.recipients(id),
            reads = await db.noticeReadRecords.findMany({
                where: { noticeId: id },
            });
        const readMap = new Map(reads.map((r) => [r.userId, r.readAt]));
        const selected = ids.filter((userId) =>
            q.status === 'read' ? readMap.has(userId) : !readMap.has(userId),
        );
        const { skip, take } = paging(q);
        const [users, paths] = await Promise.all([
            db.users.findMany({
                where: { id: { in: selected } },
                skip,
                take,
                include: {
                    userPosts_userId: {
                        where: { isMain: true },
                        include: { postRef: true },
                    },
                },
            }),
            buildDeptPathMap(),
        ]);
        return paged(
            users.map((u) => ({
                userId: u.id,
                displayName: u.displayName,
                username: u.username,
                avatar: u.avatar,
                deptPath: u.deptId ? (paths.get(u.deptId) ?? null) : null,
                mainPostName: u.userPosts_userId[0]?.postRef.name ?? null,
                employmentStatus: u.employmentStatus ?? 'employed',
                readAt: readMap.get(u.id) ?? null,
            })),
            selected.length,
            q,
        );
    }
    /**
     * 由发布人或超级管理员对已发布公告的未读接收者发送站内催读通知。
     * 事务内锁定公告行，检查 24 小时频率限制，再写入通知与催读日志。
     */
    async remind(id: string, user: AuthUser) {
        const row = await this.row(id);
        await this.owner(row, user);
        if (row.status !== 'published') invalid('仅已发布公告可催办');
        const ids = await this.recipients(id),
            reads = await db.noticeReadRecords.findMany({
                where: { noticeId: id },
            });
        const unread = ids.filter(
            (uid) => !reads.some((r) => r.userId === uid),
        );
        await db.$transaction(async (tx) => {
            // 锁定公告行，防止并发请求绕过 24 小时催办限制。
            await tx.$queryRawUnsafe(
                'SELECT id FROM notices WHERE id = $1 FOR UPDATE',
                id,
            );
            if (
                await tx.noticeRemindLogs.findFirst({
                    where: {
                        noticeId: id,
                        remindedAt: { gt: new Date(Date.now() - 86400000) },
                    },
                })
            )
                invalid('24小时内不能重复催办');
            await tx.notifications.createMany({
                data: unread.map((recipientId) => ({
                    recipientId,
                    type: 'notice_remind',
                    title: '公告提醒：' + row.title,
                    content: '请及时阅读公告',
                    link: '/my-notices/' + id,
                })),
            });
            await tx.noticeRemindLogs.create({
                data: { noticeId: id, remindedBy: user.id },
            });
        });
        await audit('notice.remind', user.id, { id, count: unread.length });
        return { remindedCount: unread.length };
    }
    /**
     * 扫描到期且未删除的待发布公告，逐条在事务内切换状态并写入发布通知。
     * 条件更新只允许仍处于待发布状态的记录成功，避免并发扫描重复通知。
     *
     * @returns 本次成功发布的公告数量
     */
    async publishDueNotices() {
        const rows = await db.notices.findMany({
            where: {
                status: 'draft',
                deletedAt: null,
                publishTime: { lte: new Date() },
            },
        });
        let count = 0;
        for (const row of rows) {
            const recipients = await this.recipients(row.id);
            count += await db.$transaction(async (tx) => {
                const changed = await tx.notices.updateMany({
                    where: { id: row.id, status: 'draft', deletedAt: null },
                    data: { status: 'published' },
                });
                if (!changed.count) return 0;
                await tx.notifications.createMany({
                    data: recipients.map((recipientId) => ({
                        recipientId,
                        type: 'notice_publish',
                        title: row.title,
                        content: '有新公告发布',
                        link: '/my-notices/' + row.id,
                    })),
                });
                return 1;
            });
        }
        return count;
    }
}
