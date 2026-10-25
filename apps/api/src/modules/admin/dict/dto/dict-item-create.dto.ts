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
 * POST /api/admin/dict/types/:code/items 请求体
 */
export class DictItemCreateDto {
    /**
     * 字典项业务键值，同一字典类型内唯一。
     */
    @IsString()
    @Length(1, 50)
    value!: string;

    /**
     * 字典项中文显示名，同一字典类型内唯一。
     */
    @IsString()
    @Length(1, 20)
    label!: string;

    /**
     * 字典项显示顺序，非负整数，数值越小越靠前。默认 0。
     */
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    sort?: number = 0;

    /**
     * 是否启用；创建时默认 true。
     */
    @IsOptional()
    @IsBoolean()
    enabled?: boolean = true;
}
