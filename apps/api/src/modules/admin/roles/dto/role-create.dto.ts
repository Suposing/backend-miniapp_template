import {
    IsBoolean,
    IsInt,
    IsOptional,
    IsString,
    MaxLength,
    Min,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * POST /api/admin/roles 请求体
 */
export class CreateRoleDto {
    /**
     * 角色中文显示名称。
     */
    @IsString()
    @MaxLength(20)
    name!: string;

    /**
     * 角色唯一编码，创建后不可修改；super_admin 为保留值。
     */
    @IsString()
    @MaxLength(50)
    code!: string;

    /**
     * 用途说明，可为空文本。
     */
    @IsOptional()
    @IsString()
    @MaxLength(200)
    description?: string;

    /**
     * 是否启用；创建时默认 true。
     */
    @IsOptional()
    @IsBoolean()
    enabled?: boolean = true;

    /**
     * 角色排序值，管理列表默认降序；创建默认 0，更新时省略保留原值。
     */
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    sort?: number = 0;
}
