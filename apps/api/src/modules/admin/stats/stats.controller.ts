import { AdminController } from '../decorators/admin-controller.decorator';
import { Req, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { StatsService } from './stats.service';

/**
 * Dashboard 概览统计。
 *
 * - 只读聚合，鉴权为任意已登录用户（无 @Permissions，PermissionsGuard
 *   对无元数据路由放行，与 notice 消费接口口径一致）；
 * - GET 请求不受 DemoReadonlyGuard 只读拦截影响；
 * - 无查询参数：本接口是页面级聚合，7 / 30 日趋势区间由前端本地截取，
 *   不作为服务端取数维度（的 `days` 参数已在 移除）。
 */
@AdminController('stats')
@UseGuards(AuthGuard('admin-jwt'), PermissionsGuard)
export class StatsController {
    constructor(private readonly statsService: StatsService) {}

    /**
     * GET /api/admin/stats/overview —— 概览统计（KPI + 趋势 + 角色 + 公告 + 动态）
     */
    @Get('overview')
    overview(@Req() request: { user: { id: string } }) {
        return this.statsService.overview(request.user.id);
    }
}
