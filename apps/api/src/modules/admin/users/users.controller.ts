import { AdminController } from '../decorators/admin-controller.decorator';
import { PermissionResource } from '../auth/guards/permissions.guard';
import {
    Body,
    Delete,
    Get,
    HttpCode,
    Param,
    ParseArrayPipe,
    Post,
    Put,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { UsersService, UserView } from './users.service';
import { CreateUserDto } from './dto/user-create.dto';
import { UpdateUserDto } from './dto/user-update.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { StatusUpdateDto } from './dto/status-update.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { AuthUser } from '../auth/auth.service';

/**
 * 提供 users 模块接口，操作权限按 /settings/users 资源检查。
 */
@AdminController('users')
@UseGuards(AuthGuard('admin-jwt'), PermissionsGuard)
@PermissionResource('/settings/users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    private operatorId(req: Request): string | null {
        return (req.user as AuthUser)?.id ?? null;
    }

    /**
     * GET /api/admin/users
     */
    @Get()
    @Permissions('SEARCH')
    findAll(@Query() query: UserQueryDto) {
        return this.usersService.findAll(query);
    }

    /**
     * GET /api/admin/users/:id
     */
    @Get(':id')
    @Permissions('SEARCH')
    findOne(@Param('id') id: string): Promise<UserView> {
        return this.usersService.findOne(id);
    }

    /**
     * POST /api/admin/users
     */
    @Post()
    @HttpCode(200)
    @Permissions('ADD')
    create(@Body() dto: CreateUserDto, @Req() req: Request): Promise<UserView> {
        return this.usersService.create(dto, this.operatorId(req));
    }

    /**
     * PUT /api/admin/users/:id
     */
    @Put(':id')
    @Permissions('EDIT')
    update(
        @Param('id') id: string,
        @Body() dto: UpdateUserDto,
        @Req() req: Request,
    ): Promise<UserView> {
        return this.usersService.update(id, dto, this.operatorId(req));
    }

    /**
     * DELETE /api/admin/users/:id
     */
    @Delete(':id')
    @Permissions('DELETE')
    remove(@Param('id') id: string, @Req() req: Request) {
        return this.usersService.remove(id, this.operatorId(req));
    }

    /**
     * DELETE /api/admin/users?ids=id1,id2,id3
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
        return this.usersService.batchRemove(ids, this.operatorId(req));
    }

    /**
     * POST /api/admin/users/:id/reset-password
     */
    @Post(':id/reset-password')
    @HttpCode(200)
    @Permissions('RESET_PASSWORD')
    resetPassword(
        @Param('id') id: string,
        @Body() dto: ResetPasswordDto,
        @Req() req: Request,
    ) {
        return this.usersService.resetPassword(
            id,
            dto.newPassword,
            this.operatorId(req),
        );
    }

    /**
     * PUT /api/admin/users/:id/status
     */
    @Put(':id/status')
    @Permissions('EDIT')
    updateStatus(
        @Param('id') id: string,
        @Body() dto: StatusUpdateDto,
        @Req() req: Request,
    ): Promise<UserView> {
        return this.usersService.updateStatus(
            id,
            dto.status,
            this.operatorId(req),
        );
    }
}
