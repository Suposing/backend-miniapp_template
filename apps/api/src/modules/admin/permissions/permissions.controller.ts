import { AdminController } from '../decorators/admin-controller.decorator';
import { Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsService } from './permissions.service';

/**
 * 提供 permissions 模块接口。
 */
@AdminController('permissions')
@UseGuards(AuthGuard('admin-jwt'))
export class PermissionsController {
    constructor(private readonly permissionsService: PermissionsService) {}

    /**
     * GET /api/admin/permissions — 权限点全量字典（需登录）
     */
    @Get()
    list() {
        return this.permissionsService.list();
    }
}
