import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsInt,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 拖拽排序单项：id + 移动后 parentId（null = 顶级）+ 移动后 sort
 */
export class DeptSortItemDto {
    /**
     * 本次调整的组织 ID。
     */
    @IsString()
    id!: string;

    /**
     * 父级 ID；组织中 null 表示顶层，省略字段按创建或更新规则处理。
     */
    @IsOptional()
    @IsString()
    parentId?: string | null;

    /**
     * 组织排序值，组织树默认按值降序。省略时按创建或更新规则保留默认行为。
     */
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    sort?: number;
}

/**
 * PATCH /api/admin/org/depts/sort 请求体（与 DeptSortRequest 对齐）
 */
export class DeptSortDto {
    /**
     * 整批组织父级和排序调整项，至少 1 项、最多 200 项；先检查最终树无循环再事务保存。
     */
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(200)
    @ValidateNested({ each: true })
    @Type(() => DeptSortItemDto)
    items!: DeptSortItemDto[];
}
