import { IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * GET /api/admin/roles/:id/users 查询参数（关联用户穿透，）
 */
export class RoleUsersQueryDto {
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
