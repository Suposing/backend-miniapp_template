import { IsIn, IsInt, IsOptional, IsString, Length } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * PUT /api/admin/org/depts/:id 请求体（与 DeptUpdateRequest 对齐）。
 * parentId 语义：undefined = 不修改父级；null = 移动为顶级组织；
 * 非 null = 移动到该组织下（服务端防环校验）。
 */
export class DeptUpdateDto {
    /**
     * 组织名称，未删除组织之间唯一。省略表示不修改。
     */
    @IsOptional()
    @IsString()
    @Length(1, 100)
    name?: string;

    /**
     * 组织编码，未删除组织的非空编码之间唯一。省略表示不修改。
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
     * 组织负责人的内部用户 ID，须存在且未删除；null 表示清空。省略表示不修改。
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
     * 组织或岗位状态：enabled 启用，disabled 停用。省略表示不修改。
     */
    @IsOptional()
    @IsIn(['enabled', 'disabled'])
    status?: 'enabled' | 'disabled';
}
