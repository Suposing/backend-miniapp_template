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
    Req,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { DictService } from './dict.service';
import { DictTypeCreateDto } from './dto/dict-type-create.dto';
import { DictTypeUpdateDto } from './dto/dict-type-update.dto';
import { DictItemCreateDto } from './dto/dict-item-create.dto';
import { DictItemUpdateDto } from './dto/dict-item-update.dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { AuthUser } from '../auth/auth.service';

/**
 * 提供 dict 模块接口，操作权限按 /settings/dicts 资源检查。
 */
@AdminController('dict')
@UseGuards(AuthGuard('admin-jwt'), PermissionsGuard)
@PermissionResource('/settings/dicts')
export class DictController {
    constructor(private readonly dictService: DictService) {}

    private operatorId(req: Request): string | null {
        return (req.user as AuthUser)?.id ?? null;
    }

    // ---------------- Dict Types ----------------
    /**
     * 查询全部字典类型，由业务服务执行记录读取或维护。
     */
    @Get('types')
    @Permissions('SEARCH')
    listTypes() {
        return this.dictService.listTypes();
    }

    /**
     * 按编码读取字典类型，由业务服务执行记录读取或维护。
     */
    @Get('types/:code')
    @Permissions('SEARCH')
    getType(@Param('code') code: string) {
        return this.dictService.getType(code);
    }

    /**
     * 创建字典类型，由业务服务执行记录读取或维护。
     */
    @Post('types')
    @HttpCode(200)
    @Permissions('ADD')
    createType(@Body() dto: DictTypeCreateDto, @Req() req: Request) {
        return this.dictService.createType(dto, this.operatorId(req));
    }

    /**
     * 更新字典类型名称和说明，由业务服务执行记录读取或维护。
     */
    @Put('types/:code')
    @Permissions('EDIT')
    updateType(
        @Param('code') code: string,
        @Body() dto: DictTypeUpdateDto,
        @Req() req: Request,
    ) {
        return this.dictService.updateType(code, dto, this.operatorId(req));
    }

    /**
     * 删除字典类型及所属项，由业务服务执行记录读取或维护。
     */
    @Delete('types/:code')
    @Permissions('DELETE')
    deleteType(@Param('code') code: string, @Req() req: Request) {
        return this.dictService.deleteType(code, this.operatorId(req));
    }

    // ---------------- Dict Items ----------------
    /**
     * 读取指定类型的全部字典项，由业务服务执行记录读取或维护。
     */
    @Get('types/:code/items')
    @Permissions('SEARCH')
    listItems(@Param('code') code: string) {
        return this.dictService.listItems(code);
    }

    /**
     * 在指定类型中创建字典项，由业务服务执行记录读取或维护。
     */
    @Post('types/:code/items')
    @HttpCode(200)
    @Permissions('ADD')
    createItem(
        @Param('code') code: string,
        @Body() dto: DictItemCreateDto,
        @Req() req: Request,
    ) {
        return this.dictService.createItem(code, dto, this.operatorId(req));
    }

    /**
     * 更新字典项，由业务服务执行记录读取或维护。
     */
    @Put('items/:id')
    @Permissions('EDIT')
    updateItem(
        @Param('id') id: string,
        @Body() dto: DictItemUpdateDto,
        @Req() req: Request,
    ) {
        return this.dictService.updateItem(id, dto, this.operatorId(req));
    }

    /**
     * 删除字典项，由业务服务执行记录读取或维护。
     */
    @Delete('items/:id')
    @Permissions('DELETE')
    deleteItem(@Param('id') id: string, @Req() req: Request) {
        return this.dictService.deleteItem(id, this.operatorId(req));
    }
}
