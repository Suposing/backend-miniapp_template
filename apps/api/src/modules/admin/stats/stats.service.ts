import { Injectable } from '@nestjs/common';
import { db } from '../../../db/client';
import { NoticesService } from '../notice/notice.service';
const day = (date: Date) =>
    new Date(date.getTime() + 8 * 3600000).toISOString().slice(0, 10);
/**
 * 管理后台概览数据的只读统计聚合。
 */
@Injectable()
export class StatsService {
    /**
     * 聚合管理后台概览的账号、日志、角色和公告统计；日期边界采用北京时间。
     */
    async overview(userId?: string) {
        const dates = Array.from({ length: 30 }, (_, i) =>
                day(new Date(Date.now() - (29 - i) * 86400000)),
            ),
            since = new Date(dates[0] + 'T00:00:00+08:00');
        const [
            users,
            logs,
            totalUsers,
            totalOperations,
            deptsCount,
            postsCount,
            roles,
            recent,
            notices,
        ] = await Promise.all([
            db.users.findMany({
                where: { deletedAt: null, createdAt: { gte: since } },
                select: { createdAt: true },
            }),
            db.logs.findMany({
                where: {
                    createdAt: { gte: since },
                    type: { in: ['login', 'operation'] },
                },
                select: { type: true, createdAt: true },
            }),
            db.users.count({ where: { deletedAt: null } }),
            db.logs.count({ where: { type: 'operation' } }),
            db.depts.count({ where: { deletedAt: null } }),
            db.posts.count({ where: { deletedAt: null } }),
            db.roles.findMany({
                include: { _count: { select: { userRoles_roleId: true } } },
            }),
            db.logs.findMany({
                where: { type: 'operation', ...(userId ? { userId } : {}) },
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: {
                    userRef: {
                        select: {
                            username: true,
                            displayName: true,
                            avatar: true,
                        },
                    },
                },
            }),
            userId
                ? new NoticesService().findMine(userId, {
                      page: 1,
                      pageSize: 5,
                  })
                : { data: [] },
        ]);
        const series = (records: { createdAt: Date }[]) => {
            const counts = new Map<string, number>();
            records.forEach((r) =>
                counts.set(
                    day(r.createdAt),
                    (counts.get(day(r.createdAt)) ?? 0) + 1,
                ),
            );
            return dates.map((date) => ({
                date,
                count: counts.get(date) ?? 0,
            }));
        };
        const userSeries = series(users),
            loginSeries = series(logs.filter((l) => l.type === 'login')),
            operationSeries = series(
                logs.filter((l) => l.type === 'operation'),
            );
        return {
            kpis: {
                usersTotal: totalUsers,
                usersTodayNew: userSeries[29].count,
                usersDailyNew: userSeries.slice(-7),
                loginsToday: loginSeries[29].count,
                loginsYesterday: loginSeries[28].count,
                loginsDailyNew: loginSeries.slice(-7),
                logsTotal: totalOperations,
                logsToday: operationSeries[29].count,
                logsDailyNew: operationSeries.slice(-7),
                deptsCount,
                postsCount,
            },
            loginTrend: loginSeries,
            roleDistribution: roles.map((r) => ({
                roleCode: r.code,
                roleName: r.name,
                count: r._count.userRoles_roleId,
            })),
            latestNotices: notices.data.map((n) => ({
                id: n.id,
                title: n.title,
                publishTime: n.publishTime,
                publisherName: n.publisherName,
                publisherAvatar: n.publisherAvatar,
            })),
            recentLogs: recent.map(({ userRef, ...r }) => ({
                id: r.id,
                action: r.action,
                createdAt: r.createdAt,
                username: userRef?.username ?? null,
                displayName: userRef?.displayName ?? null,
                avatar: userRef?.avatar ?? null,
            })),
        };
    }
}
