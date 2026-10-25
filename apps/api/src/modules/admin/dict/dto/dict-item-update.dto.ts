import {
    IsBoolean,
    IsInt,
    IsOptional,
    IsString,
    Length,
    Min,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * PUT /api/admin/dict/items/:id 请求体
 */
export class DictItemUpdateDto {
    /**
     * 字典项业务键值，同一字典类型内唯一。省略表示不修改。
     */
    @IsOptional()
    @IsString()
    @Length(1, 50)
    value?: string;

    /**
     * 字典项中文显示名，同一字典类型内唯一。省略表示不修改。
     */
    @IsOptional()
    @IsString()
    @Length(1, 20)
    label?: string;

    /**
     * 字典项显示顺序，非负整数，数值越小越靠前。省略表示不修改。
     */
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    sort?: number;

    /**
     * 是否启用；创建时默认 true。省略表示不修改。
     */
    @IsOptional()
    @IsBoolean()
    enabled?: boolean;
}
