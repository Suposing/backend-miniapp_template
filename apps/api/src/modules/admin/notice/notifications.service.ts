import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../../../db/client';
import { paged, paging } from '../../../db/helpers';
/**
 * 当前内部用户的站内通知查询和已读状态维护。
 */
@Injectable()
export class NotificationsService {
    /**
     * 分页读取当前用户的站内通知，支持已读状态筛选。
     */
    async findAll(
        userId: string,
        q: { page: number; pageSize: number; unreadOnly: boolean },
    ) {
        const where = {
            recipientId: userId,
            ...(q.unreadOnly ? { readAt: null } : {}),
        };
        const { skip, take } = paging(q);
        const [data, total] = await Promise.all([
            db.notifications.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
            }),
            db.notifications.count({ where }),
        ]);
        return paged(data, total, q);
    }
    /**
     * 统计当前用户 readAt 为空的站内通知数量。
     */
    async unreadCount(userId: string) {
        return {
            count: await db.notifications.count({
                where: { recipientId: userId, readAt: null },
            }),
        };
    }
    /**
     * 将当前用户全部未读通知标记为已读，不修改其他用户通知。
     */
    async readAll(userId: string) {
        await db.notifications.updateMany({
            where: { recipientId: userId, readAt: null },
            data: { readAt: new Date() },
        });
        return null;
    }
    /**
     * 仅将属于当前用户的指定通知标记为已读。
     */
    async readOne(userId: string, id: string) {
        const row = await db.notifications.findFirst({
            where: { id, recipientId: userId },
        });
        if (!row) throw new NotFoundException('通知不存在');
        if (!row.readAt)
            await db.notifications.update({
                where: { id },
                data: { readAt: new Date() },
            });
        return null;
    }
}
