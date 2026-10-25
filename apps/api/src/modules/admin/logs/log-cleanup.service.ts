import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { db } from '../../../db/client';
/**
 * 定期清理历史接口访问日志，保留登录和业务操作审计。
 */
@Injectable()
export class LogCleanupService {
    /**
     * 每天任务执行时删除超过 90 天的 api 类型日志；不清理其他日志类型。
     */
    @Cron('0 0 3 * * *')
    async cleanup() {
        await db.logs.deleteMany({
            where: {
                type: 'api',
                createdAt: { lt: new Date(Date.now() - 90 * 86400000) },
            },
        });
    }
}
