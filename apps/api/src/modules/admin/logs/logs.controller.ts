import { AdminController } from '../decorators/admin-controller.decorator';
import { PermissionResource } from '../auth/guards/permissions.guard';
import {
    Delete,
    Get,
    Param,
    ParseArrayPipe,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { LogsService } from './logs.service';
import { LogQueryDto } from './dto/log-query.dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { AuthUser } from '../auth/auth.service';

/**
 * 提供 logs 模块接口，操作权限按 /settings/logs 资源检查。
 */
@AdminController('logs')
@UseGuards(AuthGuard('admin-jwt'), PermissionsGuard)
@PermissionResource('/settings/logs')
export class LogsController {
    constructor(private readonly logsService: LogsService) {}

    private operatorId(req: Request): string | null {
        return (req.user as AuthUser)?.id ?? null;
    }

    /**
     * GET /api/admin/logs — 分页列表（支持 type 过滤，created_at 倒序）
     */
    @Get()
    @Permissions('SEARCH')
    list(@Query() query: LogQueryDto) {
        return this.logsService.list(query);
    }

    /**
     * GET /api/admin/logs/:id — 单条详情
     */
    @Get(':id')
    @Permissions('SEARCH')
    findOne(@Param('id') id: string) {
        return this.logsService.findOne(id);
    }

    /**
     * DELETE /api/admin/logs?ids=id1,id2,id3 — 批量删除（任一 ID 无效整体 400）
     */
    @Delete()
    @Permissions('BATCH_DELETE')
    batchRemove(
        @Query(
            'ids',
            new ParseArrayPipe({
                items: String,
                separator: ',',
                optional: false,
            }),
        )
        ids: string[],
        @Req() req: Request,
    ) {
        return this.logsService.batchRemove(ids, this.operatorId(req));
    }

    /**
     * DELETE /api/admin/logs/:id — 删除单条（人工干预清理）
     */
    @Delete(':id')
    @Permissions('DELETE')
    remove(@Param('id') id: string, @Req() req: Request) {
        return this.logsService.remove(id, this.operatorId(req));
    }
}
