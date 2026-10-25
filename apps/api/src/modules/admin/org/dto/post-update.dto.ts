import { IsIn, IsOptional, IsString, Length } from 'class-validator';

/**
 * PUT /api/admin/org/posts/:id 请求体（与 PostUpdateRequest 对齐；字段缺省表示不修改）
 */
export class PostUpdateDto {
    /**
     * 岗位名称，同一组织的未删除岗位之间唯一。省略表示不修改。
     */
    @IsOptional()
    @IsString()
    @Length(1, 100)
    name?: string;

    /**
     * 所属组织 ID，须存在且未删除。省略表示不修改。
     */
    @IsOptional()
    @IsString()
    deptId?: string;

    /**
     * 岗位类别：management 管理、professional 专业、production 生产。省略表示不修改。
     */
    @IsOptional()
    @IsIn(['management', 'professional', 'production'])
    category?: 'management' | 'professional' | 'production';

    /**
     * 岗位职级说明，例如 P1-P10 或 M1-M5；空字符串表示未设置。省略表示不修改。
     */
    @IsOptional()
    @IsString()
    @Length(0, 20)
    rank?: string;

    /**
     * 组织或岗位状态：enabled 启用，disabled 停用。省略表示不修改。
     */
    @IsOptional()
    @IsIn(['enabled', 'disabled'])
    status?: 'enabled' | 'disabled';
}
