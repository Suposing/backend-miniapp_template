import { IsString } from 'class-validator';
import { IsPolicyPassword } from '../../../../common/validators/password-policy';

/**
 * POST /api/admin/users/:id/reset-password 请求体
 */
export class ResetPasswordDto {
    /**
     * 新密码，须满足格式策略，且不能包含用户名或与当前密码相同。
     */
    @IsString()
    @IsPolicyPassword()
    newPassword!: string;
}
