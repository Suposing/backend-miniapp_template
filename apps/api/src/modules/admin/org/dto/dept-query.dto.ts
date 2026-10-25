import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * GET /api/admin/org/depts 查询参数（与 admin.yaml 对齐）
 */
export class DeptQueryDto {
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
     * 父级 ID；组织中 null 表示顶层，省略字段按创建或更新规则处理。
     */
    @IsOptional()
    @IsString()
    parentId?: string;

    /**
     * 列表关键词；省略不增加关键词条件。
     */
    @IsOptional()
    @IsString()
    keyword?: string;

    /**
     * 组织或岗位状态：enabled 启用，disabled 停用。
     */
    @IsOptional()
    @IsIn(['enabled', 'disabled'])
    status?: 'enabled' | 'disabled';

    /**
     * 组织排序值，组织树默认按值降序。省略时按创建或更新规则保留默认行为。
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
