import { AdminController } from '../decorators/admin-controller.decorator';
import { PermissionResource } from '../auth/guards/permissions.guard';
import { Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DirectoryService } from './directory.service';
import { DirectoryQueryDto } from './dto/directory-query.dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

/**
 * 人员通讯录：全员视图，供查询与引用
 */
@AdminController('org/directory')
@UseGuards(AuthGuard('admin-jwt'), PermissionsGuard)
@PermissionResource('/org/directory')
export class DirectoryController {
    constructor(private readonly directoryService: DirectoryService) {}

    /**
     * GET /api/admin/org/directory
     */
    @Get()
    @Permissions('SEARCH')
    findAll(@Query() query: DirectoryQueryDto) {
        return this.directoryService.findAll(query);
    }
}
