import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * GET /api/admin/org/directory 查询参数（与 admin.yaml 对齐）
 */
export class DirectoryQueryDto {
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
     * 在职状态筛选；通讯录可用 all 查询全部，默认 employed。
     */
    @IsOptional()
    @IsIn(['employed', 'resigned', 'all'])
    employmentStatus?: 'employed' | 'resigned' | 'all' = 'employed';

    /**
     * 保留的排序字段入参；当前通讯录查询固定按 displayName 升序。
     */
    @IsOptional()
    @IsString()
    sort?: string;

    /**
     * 保留的排序方向入参；当前通讯录查询固定使用升序。
     */
    @IsOptional()
    @IsIn(['asc', 'desc'])
    order?: 'asc' | 'desc';
}
