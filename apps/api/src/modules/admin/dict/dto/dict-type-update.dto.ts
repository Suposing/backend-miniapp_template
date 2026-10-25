import { IsOptional, IsString, Length } from 'class-validator';

/**
 * PUT /api/admin/dict/types/:code 请求体
 */
export class DictTypeUpdateDto {
    /**
     * 字典类型中文名称。省略表示不修改。
     */
    @IsOptional()
    @IsString()
    @Length(1, 20)
    name?: string;

    /**
     * 用途说明，可为空文本。省略表示不修改。
     */
    @IsOptional()
    @IsString()
    @Length(0, 200)
    description?: string;
}
