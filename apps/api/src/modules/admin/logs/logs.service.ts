import { Injectable } from '@nestjs/common';
import { db } from '../../../db/client';
import {
    audit,
    contains,
    paged,
    paging,
    requireSuperAdmin,
} from '../../../db/helpers';
import { LogQueryDto } from './dto/log-query.dto';
/**
 * 后台日志查询和受超级管理员限制的清理服务。
 */
@Injectable()
export class LogsService {
    /**
     * 按类型和动作关键词分页查询日志，附带操作人摘要，按创建时间降序返回。
     */
    async list(q: LogQueryDto) {
        const where = { type: q.type, action: contains(q.search) };
        const { skip, take } = paging(q);
        const [rows, total] = await Promise.all([
            db.logs.findMany({
                where,
                skip,
                take,
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
            db.logs.count({ where }),
        ]);
        return paged(
            rows.map(({ userRef, ...r }) => ({
                ...r,
                username: userRef?.username ?? null,
                displayName: userRef?.displayName ?? null,
            })),
            total,
            q,
        );
    }
    /**
     * 读取日志详情和操作人摘要；关联操作人不存在时摘要为 null。
     */
    async findOne(id: string) {
        const { userRef, ...row } = await db.logs.findUniqueOrThrow({
            where: { id },
            include: {
                userRef: { select: { username: true, displayName: true } },
            },
        });
        return {
            ...row,
            username: userRef?.username ?? null,
            displayName: userRef?.displayName ?? null,
        };
    }
    /**
     * 由超级管理员删除一条日志，沿用批量删除及审计规则。
     */
    async remove(id: string, op: string | null) {
        return this.batchRemove([id], op);
    }
    /**
     * 由超级管理员删除指定日志，并另写删除操作的审计记录。
     */
    async batchRemove(ids: string[], op: string | null) {
        await requireSuperAdmin(op);
        await db.logs.deleteMany({ where: { id: { in: ids } } });
        await audit('logs.delete', op, { ids });
        return null;
    }
}
