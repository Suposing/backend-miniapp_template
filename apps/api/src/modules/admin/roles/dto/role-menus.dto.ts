import { IsArray, IsString, Matches, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 普通角色在单个菜单资源上的授权入参。
 * 权限用十进制字符串传输；服务层拒绝负值和未由菜单声明的操作位，超级管理员授权不能通过此接口修改。
 */
export class RoleMenuPermissionDto {
    /**
     * 授权对应的菜单资源 ID。
     */
    @IsString()
    menuId!: string;

    /**
     * 角色在指定菜单上的非负权限位十进制字符串；不得超出菜单声明位，负值会被服务层拒绝。
     */
    @IsString()
    @Matches(/^-?\d+$/, { message: 'permissions 必须为整数位掩码' })
    permissions!: string;
}

/**
 * PUT /api/admin/roles/:id/menus 请求体（全量替换）
 */
export class RoleMenusUpdateDto {
    /**
     * 角色菜单授权全量替换列表；空数组清除全部普通角色授权。
     */
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RoleMenuPermissionDto)
    menus!: RoleMenuPermissionDto[];
}
