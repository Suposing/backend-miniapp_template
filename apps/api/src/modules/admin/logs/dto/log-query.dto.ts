import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * GET /api/admin/logs 查询参数（与 admin.yaml 对齐）
 */
export class LogQueryDto {
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
     * 日志类别：operation 操作、login 登录、api 接口、error 错误。
     */
    @IsOptional()
    @IsIn(['operation', 'login', 'api', 'error'])
    type?: 'operation' | 'login' | 'api' | 'error';

    /**
     * 匹配日志动作 action 的关键词；省略不增加关键词条件。
     */
    @IsOptional()
    @IsString()
    search?: string;
}
