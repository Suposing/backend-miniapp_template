import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * GET /api/admin/users 查询参数（与 admin.yaml 对齐）
 */
export class UserQueryDto {
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
     * 同时匹配用户名、显示姓名或邮箱的关键词；省略不增加关键词条件。
     */
    @IsOptional()
    @IsString()
    search?: string;

    /**
     * 账号状态：active 正常，disabled 停用；停用会撤销已有会话。
     */
    @IsOptional()
    @IsIn(['active', 'disabled'])
    status?: 'active' | 'disabled';

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
