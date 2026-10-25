import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsBoolean,
    IsIn,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
    Matches,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 发布范围单项（与 NoticeScope 对齐）
 */
/**
 * 发布范围类型（与 admin.yaml NoticeScopeType 对齐）
 */
type NoticeScopeType = 'dept' | 'post' | 'user';

/**
 * 公告接收范围单项，由范围类型决定目标 ID 所属实体。
 */
export class NoticeScopeInputDto {
    /**
     * 接收范围类别：dept 组织含下级、post 岗位、user 指定人员。
     */
    @IsIn(['dept', 'post', 'user'])
    scopeType!: NoticeScopeType;

    /**
     * 接收目标的内部 ID，按 scopeType 对应组织、岗位或人员。
     */
    @IsString()
    targetId!: string;
}

/**
 * POST /api/admin/notices 请求体（与 NoticeCreateRequest 对齐）
 */
export class NoticeCreateDto {
    /**
     * 公告标题，最多 50 字符。
     */
    @IsString()
    @MaxLength(50)
    title!: string;

    /**
     * 非空公告富文本 HTML；展示前由前端过滤不安全内容。
     */
    @IsString()
    @IsNotEmpty({ message: 'content 不能为空' })
    content!: string;

    /**
     * 公告接收范围，至少 1 项、最多 100 项；更新时提供列表表示全量替换。
     */
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(100)
    @Type(() => NoticeScopeInputDto)
    @ValidateNested({ each: true })
    scopeTargets!: NoticeScopeInputDto[];

    /**
     * 是否置顶公告。
     */
    @IsOptional()
    @IsBoolean()
    isTop?: boolean;

    /**
     * 计划发布时间，格式必须带时区；null 表示当前时间，更新时省略保留原时间。提供此字段会重新进入发布流程。
     */
    @IsOptional()
    @Matches(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/,
        {
            message:
                'publishTime 必须是带时区的 ISO 日期时间（RFC3339，如 2026-01-01T09:00:00+08:00 或 Z）',
        },
    )
    publishTime?: string | null;
}

/**
 * PUT /api/admin/notices/:id 请求体（与 NoticeUpdateRequest 对齐；缺省表示不修改）
 */
export class NoticeUpdateDto {
    /**
     * 公告标题，最多 50 字符。省略表示不修改。
     */
    @IsOptional()
    @IsString()
    @MaxLength(50)
    title?: string;

    /**
     * 非空公告富文本 HTML；展示前由前端过滤不安全内容。省略表示不修改。
     */
    @IsOptional()
    @IsString()
    @IsNotEmpty({ message: 'content 不能为空' })
    content?: string;

    /**
     * 公告接收范围，至少 1 项、最多 100 项；更新时提供列表表示全量替换。省略表示不修改。
     */
    @IsOptional()
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(100)
    @Type(() => NoticeScopeInputDto)
    @ValidateNested({ each: true })
    scopeTargets?: NoticeScopeInputDto[];

    /**
     * 是否置顶公告。省略表示不修改。
     */
    @IsOptional()
    @IsBoolean()
    isTop?: boolean;

    /**
     * 计划发布时间，格式必须带时区；null 表示当前时间，更新时省略保留原时间。提供此字段会重新进入发布流程。
     */
    @IsOptional()
    @Matches(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/,
        {
            message:
                'publishTime 必须是带时区的 ISO 日期时间（RFC3339，如 2026-01-01T09:00:00+08:00 或 Z）',
        },
    )
    publishTime?: string | null;
}
