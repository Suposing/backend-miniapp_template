import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * GET /api/admin/notices 查询参数（管理列表，与 admin.yaml 对齐）
 */
export class NoticeQueryDto {
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
     * 列表关键词；省略不增加关键词条件。
     */
    @IsOptional()
    @IsString()
    keyword?: string;

    /**
     * 公告发布状态：draft 待发布，published 已发布，withdrawn 已撤回。
     */
    @IsOptional()
    @IsIn(['draft', 'published', 'withdrawn'])
    status?: 'draft' | 'published' | 'withdrawn';

    /**
     * 保留的排序字段入参；当前公告列表固定按置顶和发布时间降序。
     */
    @IsOptional()
    @IsString()
    sort?: string;

    /**
     * 保留的排序方向入参；当前公告列表固定使用降序。
     */
    @IsOptional()
    @IsIn(['asc', 'desc'])
    order?: 'asc' | 'desc';
}

/**
 * GET /api/admin/notices/mine 查询参数（我的公告）
 */
export class NoticeMineQueryDto {
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
     * 列表关键词；省略不增加关键词条件。
     */
    @IsOptional()
    @IsString()
    keyword?: string;

    /**
     * 阅读筛选：all 全部、read 已读、unread 未读；默认 all。
     */
    @IsOptional()
    @IsIn(['all', 'read', 'unread'])
    readStatus?: 'all' | 'read' | 'unread' = 'all';
}

/**
 * GET /api/admin/notices/:id/read-stats 查询参数
 */
export class NoticeReadStatsQueryDto {
    /**
     * 阅读名单类别：read 已读，unread 未读。
     */
    @IsIn(['read', 'unread'])
    status!: 'read' | 'unread';

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
