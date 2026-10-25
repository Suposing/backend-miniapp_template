import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { db } from '../../../db/client';
/**
 * 定期清理已到期的刷新会话摘要。
 */
@Injectable()
export class RefreshTokenCleanupService {
    /**
     * 按定时任务删除已到期的刷新会话摘要。
     */
    @Cron('0 0 * * * *')
    async cleanup() {
        await db.refreshTokens.deleteMany({
            where: { expiresAt: { lt: new Date() } },
        });
    }
}
