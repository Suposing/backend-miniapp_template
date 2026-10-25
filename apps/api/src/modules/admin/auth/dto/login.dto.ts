import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * 内部员工密码登录入参，不用于微信客户登录。
 */
export class LoginDto {
    /**
     * 内部员工登录用户名。
     */
    @IsNotEmpty()
    @IsString()
    username!: string;

    /**
     * 内部账号登录密码，禁止记录到日志。
     */
    @IsNotEmpty()
    @IsString()
    password!: string;

    /**
     * true 使用 30 天刷新会话，false 或省略使用 1 天；访问令牌当前为 15 分钟。
     */
    @IsOptional()
    @IsBoolean()
    rememberMe?: boolean;
}
