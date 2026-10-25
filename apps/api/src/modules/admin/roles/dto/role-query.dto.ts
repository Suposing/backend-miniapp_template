import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * GET /api/admin/roles 查询参数
 */
export class RoleQueryDto {
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
     * 匹配角色名称或编码的关键词；省略不增加关键词条件。
     */
    @IsOptional()
    @IsString()
    search?: string;

    /**
     * 启停筛选，传字符串 true 或 false；省略查询全部。
     */
    @IsOptional()
    @IsIn(['true', 'false'])
    enabled?: 'true' | 'false';
}
