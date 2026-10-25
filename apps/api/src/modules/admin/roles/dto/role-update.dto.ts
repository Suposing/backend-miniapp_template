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
 * PUT /api/admin/roles/:id 请求体。
 * code 不可修改（角色 code 为程序标识，创建后锁定）。
 */
export class UpdateRoleDto {
    /**
     * 角色中文显示名称。省略表示不修改。
     */
    @IsOptional()
    @IsString()
    @MaxLength(20)
    name?: string;

    /**
     * 用途说明，可为空文本。省略表示不修改。
     */
    @IsOptional()
    @IsString()
    @MaxLength(200)
    description?: string;

    /**
     * 是否启用；创建时默认 true。省略表示不修改。
     */
    @IsOptional()
    @IsBoolean()
    enabled?: boolean;

    /**
     * 角色排序值，管理列表默认降序；创建默认 0，更新时省略保留原值。
     */
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    sort?: number;
}
