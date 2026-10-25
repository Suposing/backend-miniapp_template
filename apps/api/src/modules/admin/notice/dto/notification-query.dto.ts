import { IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * GET /api/admin/notifications 查询参数（与 admin.yaml 对齐；补 DTO 校验）
 */
export class NotificationQueryDto {
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
     * 字符串 true 表示只查当前用户未读通知；省略或 false 查询全部。
     */
    @IsOptional()
    @IsIn(['true', 'false'])
    unreadOnly?: 'true' | 'false';
}
