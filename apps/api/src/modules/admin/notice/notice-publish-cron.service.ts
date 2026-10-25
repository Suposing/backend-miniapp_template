import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { NoticesService } from './notice.service';

/**
 * 公告定时发布：每分钟扫描 publish_time 已到期的
 * draft 公告自动置为 published，并给范围内全员写 notice_publish 通知。
 * 模式对齐 log-cleanup.service（@Cron + 服务层委托）。
 */
@Injectable()
export class NoticePublishCronService {
    private readonly logger = new Logger(NoticePublishCronService.name);

    constructor(private readonly noticesService: NoticesService) {}

    /**
     * 触发到期公告发布扫描，记录发布数量或失败原因。
     */
    @Cron('* * * * *')
    async handlePublishDueNotices() {
        try {
            const published = await this.noticesService.publishDueNotices();
            if (published > 0) {
                this.logger.log(`定时发布完成：${published} 条公告已发布`);
            }
        } catch (err) {
            this.logger.error('定时发布失败', err);
        }
    }
}
