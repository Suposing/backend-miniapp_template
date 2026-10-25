import { AdminController } from '../decorators/admin-controller.decorator';
import { PermissionResource } from '../auth/guards/permissions.guard';
import {
    Body,
    Delete,
    Get,
    HttpCode,
    Param,
    Post,
    Put,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { RolesService, RoleView } from './roles.service';
import { CreateRoleDto } from './dto/role-create.dto';
import { UpdateRoleDto } from './dto/role-update.dto';
import { RoleMenusUpdateDto } from './dto/role-menus.dto';
import { RoleQueryDto } from './dto/role-query.dto';
import { RoleUsersQueryDto } from './dto/role-users-query.dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { AuthUser } from '../auth/auth.service';

/**
 * 提供 roles 模块接口，操作权限按 /settings/roles 资源检查。
 */
@AdminController('roles')
@UseGuards(AuthGuard('admin-jwt'), PermissionsGuard)
@PermissionResource('/settings/roles')
export class RolesController {
    constructor(private readonly rolesService: RolesService) {}

    private operatorId(req: Request): string | null {
        return (req.user as AuthUser)?.id ?? null;
    }

    /**
     * GET /api/admin/roles
     */
    @Get()
    @Permissions('SEARCH')
    findAll(@Query() query: RoleQueryDto) {
        return this.rolesService.findAll(query);
    }

    /**
     * GET /api/admin/roles/:id
     */
    @Get(':id')
    @Permissions('SEARCH')
    findOne(@Param('id') id: string): Promise<RoleView> {
        return this.rolesService.findOne(id);
    }

    /**
     * GET /api/admin/roles/:id/users — 关联用户名单穿透
     */
    @Get(':id/users')
    @Permissions('SEARCH')
    findUsers(@Param('id') id: string, @Query() query: RoleUsersQueryDto) {
        return this.rolesService.findUsers(id, query);
    }

    /**
     * GET /api/admin/roles/:id/menus
     */
    @Get(':id/menus')
    @Permissions('SEARCH')
    getMenus(@Param('id') id: string) {
        return this.rolesService.getMenus(id);
    }

    /**
     * POST /api/admin/roles
     */
    @Post()
    @HttpCode(200)
    @Permissions('ADD')
    create(@Body() dto: CreateRoleDto, @Req() req: Request): Promise<RoleView> {
        return this.rolesService.create(dto, this.operatorId(req));
    }

    /**
     * PUT /api/admin/roles/:id
     */
    @Put(':id')
    @Permissions('EDIT')
    update(
        @Param('id') id: string,
        @Body() dto: UpdateRoleDto,
        @Req() req: Request,
    ): Promise<RoleView> {
        return this.rolesService.update(id, dto, this.operatorId(req));
    }

    /**
     * PUT /api/admin/roles/:id/menus — 菜单授权独立位，不复用 EDIT
     */
    @Put(':id/menus')
    @Permissions('GRANT')
    updateMenus(
        @Param('id') id: string,
        @Body() dto: RoleMenusUpdateDto,
        @Req() req: Request,
    ) {
        return this.rolesService.updateMenus(id, dto, this.operatorId(req));
    }

    /**
     * DELETE /api/admin/roles/:id
     */
    @Delete(':id')
    @Permissions('DELETE')
    remove(@Param('id') id: string, @Req() req: Request) {
        return this.rolesService.remove(id, this.operatorId(req));
    }
}
