import { AdminController } from '../decorators/admin-controller.decorator';
import { PermissionResource } from '../auth/guards/permissions.guard';
import {
    Body,
    Delete,
    Get,
    HttpCode,
    Param,
    Patch,
    Post,
    Put,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { DeptsService, DeptView } from './depts.service';
import { DeptCreateDto } from './dto/dept-create.dto';
import { DeptUpdateDto } from './dto/dept-update.dto';
import { DeptQueryDto } from './dto/dept-query.dto';
import { DeptSortDto } from './dto/dept-sort.dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { AuthUser } from '../auth/auth.service';

/**
 * 组织管理。
 * 注意：tree / sort 为静态路由，必须声明在 :id 参数路由之前，
 * 否则会被 :id 吞掉。
 */
@AdminController('org/depts')
@UseGuards(AuthGuard('admin-jwt'), PermissionsGuard)
@PermissionResource('/org/depts')
export class DeptsController {
    constructor(private readonly deptsService: DeptsService) {}

    private operatorId(req: Request): string | null {
        return (req.user as AuthUser)?.id ?? null;
    }

    /**
     * GET /api/admin/org/depts/tree
     */
    @Get('tree')
    @Permissions('SEARCH')
    tree() {
        return this.deptsService.findTree();
    }

    /**
     * PATCH /api/admin/org/depts/sort
     */
    @Patch('sort')
    @Permissions('EDIT')
    sort(@Body() dto: DeptSortDto, @Req() req: Request) {
        return this.deptsService.sort(dto, this.operatorId(req));
    }

    /**
     * GET /api/admin/org/depts
     */
    @Get()
    @Permissions('SEARCH')
    findAll(@Query() query: DeptQueryDto) {
        return this.deptsService.findAll(query);
    }

    /**
     * POST /api/admin/org/depts
     */
    @Post()
    @HttpCode(200)
    @Permissions('ADD')
    create(@Body() dto: DeptCreateDto, @Req() req: Request): Promise<DeptView> {
        return this.deptsService.create(dto, this.operatorId(req));
    }

    /**
     * GET /api/admin/org/depts/:id
     */
    @Get(':id')
    @Permissions('SEARCH')
    findOne(@Param('id') id: string): Promise<DeptView> {
        return this.deptsService.findOne(id);
    }

    /**
     * PUT /api/admin/org/depts/:id
     */
    @Put(':id')
    @Permissions('EDIT')
    update(
        @Param('id') id: string,
        @Body() dto: DeptUpdateDto,
        @Req() req: Request,
    ): Promise<DeptView> {
        return this.deptsService.update(id, dto, this.operatorId(req));
    }

    /**
     * DELETE /api/admin/org/depts/:id
     */
    @Delete(':id')
    @Permissions('DELETE')
    remove(@Param('id') id: string, @Req() req: Request) {
        return this.deptsService.remove(id, this.operatorId(req));
    }
}
