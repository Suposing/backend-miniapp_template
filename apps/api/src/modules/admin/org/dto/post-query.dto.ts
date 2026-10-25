import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * GET /api/admin/org/posts 查询参数（与 admin.yaml 对齐）
 */
export class PostQueryDto {
    /**
     * 页码，从 1 开始，默认第 1 页。
     */
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    /**
     * 每页条数，仅允许 10、20、30、40、50，默认 10。
     */
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @IsIn([10, 20, 30, 40, 50])
    pageSize?: number = 10;

    /**
     * 按所属组织筛选；组织模块查询会包含该组织的下级范围。
     */
    @IsOptional()
    @IsString()
    deptId?: string;

    /**
     * 列表关键词；省略不增加关键词条件。
     */
    @IsOptional()
    @IsString()
    keyword?: string;

    /**
     * 岗位类别：management 管理、professional 专业、production 生产。
     */
    @IsOptional()
    @IsIn(['management', 'professional', 'production'])
    category?: 'management' | 'professional' | 'production';

    /**
     * 组织或岗位状态：enabled 启用，disabled 停用。
     */
    @IsOptional()
    @IsIn(['enabled', 'disabled'])
    status?: 'enabled' | 'disabled';

    /**
     * 排序字段，由服务端白名单限制；不支持的字段回退默认排序。
     */
    @IsOptional()
    @IsString()
    sort?: string;

    /**
     * 排序方向，asc 升序，desc 降序。
     */
    @IsOptional()
    @IsIn(['asc', 'desc'])
    order?: 'asc' | 'desc';
}

/**
 * GET /api/admin/org/posts/:id/members 查询参数（在职人数穿透）
 */
export class PostMembersQueryDto {
    /**
     * 页码，从 1 开始，默认第 1 页。
     */
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    /**
     * 每页条数，仅允许 10、20、30、40、50，默认 10。
     */
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @IsIn([10, 20, 30, 40, 50])
    pageSize?: number = 10;
}
