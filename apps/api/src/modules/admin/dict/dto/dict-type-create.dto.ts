import { IsOptional, IsString, Length, Matches } from 'class-validator';
import { DICT_TYPE_CODE_PATTERN } from '../../../../lib/constants';

/**
 * POST /api/admin/dict/types 请求体
 */
export class DictTypeCreateDto {
    /**
     * 字典类型唯一编码，创建后不可修改。
     */
    @IsString()
    @Length(1, 50)
    @Matches(DICT_TYPE_CODE_PATTERN, {
        message: 'code 必须以字母开头，仅含字母、数字、下划线、中划线',
    })
    code!: string;

    /**
     * 字典类型中文名称。
     */
    @IsString()
    @Length(1, 20)
    name!: string;

    /**
     * 用途说明，可为空文本。
     */
    @IsOptional()
    @IsString()
    @Length(0, 200)
    description?: string;
}
