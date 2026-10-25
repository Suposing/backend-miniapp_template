import {
    ArrayMaxSize,
    IsArray,
    IsEmail,
    IsOptional,
    IsString,
    Length,
    Matches,
    MaxLength,
    MinLength,
} from 'class-validator';
import { type TransformFnParams, Transform } from 'class-transformer';
import { IsPolicyPassword } from '../../../../common/validators/password-policy';

/**
 * 剥离可选协议与平台主页前缀，trim 后返回剩余裸值；空串归一为 null（语义 = 清空）
 */
function stripPrefix(pattern: RegExp) {
    return ({ value }: TransformFnParams): string | null | undefined => {
        if (typeof value !== 'string') return value;
        const stripped = value.trim().replace(pattern, '');
        return stripped === '' ? null : stripped;
    };
}

/**
 * PUT /api/admin/account/profile 请求体（自助修改基本信息，字段缺省表示不修改）
 */
export class UpdateAccountProfileDto {
    /**
     * 界面展示的员工姓名或昵称。省略表示不修改。
     */
    @IsOptional()
    @IsString()
    @Length(1, 50)
    displayName?: string;

    /**
     * 11 位大陆手机号；null 表示清空。省略表示不修改。
     */
    @IsOptional()
    @Matches(/^1[3-9]\d{9}$/, {
        message: '请输入 11 位有效手机号',
    })
    phone?: string | null;

    /**
     * 个人标签全量替换，最多 10 项；空数组清空，省略保留。服务端去空、去重并限制每项 20 字。
     */
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(10)
    @IsString({ each: true })
    tags?: string[];

    /**
     * 个人网站裸域名或路径，服务端移除 http(s):// 前缀；null 或空字符串清空，省略保留。
     */
    @IsOptional()
    @Transform(stripPrefix(/^https?:\/\//i))
    @MaxLength(255)
    @Matches(/^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,63}(?::\d{1,5})?(?:\/\S*)?$/, {
        message: '网站格式不正确，示例：baidu.com',
    })
    website?: string | null;

    /**
     * GitHub 用户名，服务端移除主页前缀；null 或空字符串清空，省略保留。
     */
    @IsOptional()
    @Transform(stripPrefix(/^(?:https?:\/\/)?(?:www\.)?github\.com\//i))
    @Matches(/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/, {
        message: 'GitHub 用户名格式不正确',
    })
    githubUsername?: string | null;

    /**
     * X 用户名，服务端移除 X/Twitter 主页前缀；null 或空字符串清空，省略保留。
     */
    @IsOptional()
    @Transform(stripPrefix(/^(?:https?:\/\/)?(?:www\.)?(?:x|twitter)\.com\//i))
    @Matches(/^[a-zA-Z0-9_]{4,15}$/, {
        message: 'X 用户名格式不正确',
    })
    xUsername?: string | null;
}

/**
 * PUT /api/admin/account/email 请求体（需当前密码确认）
 */
export class UpdateAccountEmailDto {
    /**
     * 用户邮箱，未删除账号之间唯一。
     */
    @IsEmail({}, { message: '邮箱格式不正确' })
    email!: string;

    /**
     * 当前账号密码，用于确认改邮箱或改密操作。
     */
    @IsString()
    @MinLength(1)
    currentPassword!: string;
}

/**
 * PUT /api/admin/account/password 请求体（成功后 tokenVersion+1 全端强制下线）
 */
export class UpdateAccountPasswordDto {
    /**
     * 当前账号密码，用于确认改邮箱或改密操作。
     */
    @IsString()
    @MinLength(1)
    currentPassword!: string;

    /**
     * 新密码，须满足格式策略，且不能包含用户名或与当前密码相同。
     */
    @IsString()
    @IsPolicyPassword()
    newPassword!: string;
}
