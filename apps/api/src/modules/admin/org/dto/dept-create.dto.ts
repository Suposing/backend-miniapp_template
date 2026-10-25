import { IsIn, IsInt, IsOptional, IsString, Length } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * POST /api/admin/org/depts 请求体（与 DeptCreateRequest 对齐）
 */
export class DeptCreateDto {
    /**
     * 组织名称，未删除组织之间唯一。
     */
    @IsString()
    @Length(1, 100)
    name!: string;

    /**
     * 组织编码，未删除组织的非空编码之间唯一。
     */
    @IsOptional()
    @IsString()
    @Length(1, 50)
    code?: string | null;

    /**
     * 父级 ID；组织中 null 表示顶层，省略字段按创建或更新规则处理。
     */
    @IsOptional()
    @IsString()
    parentId?: string | null;

    /**
     * 组织负责人的内部用户 ID，须存在且未删除；null 表示清空。
     */
    @IsOptional()
    @IsString()
    leaderId?: string | null;

    /**
     * 组织排序值，组织树默认按值降序。省略时按创建或更新规则保留默认行为。
     */
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    sort?: number;

    /**
     * 组织或岗位状态：enabled 启用，disabled 停用。默认 'enabled'。
     */
    @IsOptional()
    @IsIn(['enabled', 'disabled'])
    status?: 'enabled' | 'disabled' = 'enabled';
}
