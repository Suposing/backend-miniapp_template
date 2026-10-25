import { IsNotEmpty, IsString } from 'class-validator';

/**
 * 刷新当前内部账号会话的入参。
 */
export class RefreshDto {
    /**
     * 当前有效刷新令牌；成功轮换后旧令牌不可再使用。
     */
    @IsNotEmpty()
    @IsString()
    refreshToken!: string;
}
