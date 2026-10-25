import { Controller, Get } from '@nestjs/common';

/**
 * 无鉴权的进程存活探针，不访问数据库；不能作为数据库就绪检查。
 */
@Controller('health')
export class HealthController {
    /**
     * 返回进程运行秒数和当前 UTC 时间，供服务存活检查使用。
     */
    @Get()
    health() {
        return {
            status: 'ok',
            uptimeSeconds: Math.round(process.uptime()),
            timestamp: new Date().toISOString(),
        };
    }
}
