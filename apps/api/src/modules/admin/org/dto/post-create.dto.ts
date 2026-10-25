import { IsIn, IsOptional, IsString, Length } from 'class-validator';

/**
 * POST /api/admin/org/posts 请求体（与 PostCreateRequest 对齐）
 */
export class PostCreateDto {
    /**
     * 岗位名称，同一组织的未删除岗位之间唯一。
     */
    @IsString()
    @Length(1, 100)
    name!: string;

    /**
     * 所属组织 ID，须存在且未删除。
     */
    @IsString()
    deptId!: string;

    /**
     * 岗位类别：management 管理、professional 专业、production 生产。
     */
    @IsIn(['management', 'professional', 'production'])
    category!: 'management' | 'professional' | 'production';

    /**
     * 岗位职级说明，例如 P1-P10 或 M1-M5；空字符串表示未设置。
     */
    @IsOptional()
    @IsString()
    @Length(0, 20)
    rank?: string;

    /**
     * 组织或岗位状态：enabled 启用，disabled 停用。默认 'enabled'。
     */
    @IsOptional()
    @IsIn(['enabled', 'disabled'])
    status?: 'enabled' | 'disabled' = 'enabled';
}
