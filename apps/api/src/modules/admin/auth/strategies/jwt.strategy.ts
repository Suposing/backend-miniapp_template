import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService, AuthUser } from '../auth.service';
import { getJwtSecret } from '../../../../config/env';

/**
 * 访问令牌中的账号身份与可选会话版本声明。
 */
interface AuthJwtPayload {
    /**
     * JWT 主体，对应内部用户 ID。
     */
    sub: string;
    /**
     * 内部账号的登录用户名。
     */
    username: string;
    /**
     * 当前实体或展示项的类别。
     */
    type?: 'access' | 'refresh';
    /**
     * 签发时的用户 tokenVersion
     */
    ver?: number;
}

/**
 * JWT 策略：从 Authorization: Bearer 提取 access token，
 * 校验后从 users 表加载用户（含 roles 与 permissions 聚合位），挂载到 req.user。
 * 同时校验 ver claim 与 users.token_version 一致（改密码/封禁后全端强制下线）。
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
    constructor(private readonly authService: AuthService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: getJwtSecret(),
        });
    }

    /**
     * 在 JWT 签名与过期检查之后，重新读取当前账号与授权，并比较提供的会话版本。
     *
     * @throws {UnauthorizedException} 令牌类型错误、账号不可用或会话版本不符时抛出
     */
    async validate(payload: AuthJwtPayload): Promise<AuthUser> {
        if (payload.type && payload.type !== 'access') {
            throw new UnauthorizedException({
                code: 'UNAUTHORIZED',
                message: '无效的访问令牌',
            });
        }
        const user = await this.authService.loadUserWithPermissions(
            payload.sub,
            payload.ver,
        );
        if (!user) {
            throw new UnauthorizedException({
                code: 'UNAUTHORIZED',
                message: '用户不存在或令牌无效',
            });
        }
        return user;
    }
}
