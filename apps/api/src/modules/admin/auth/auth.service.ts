import {
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomUUID } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { db } from '../../../db/client';
import type { users } from '../../../generated/prisma/client';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import {
    getJwtExpiresIn,
    getRefreshExpiresIn,
    getRefreshSecret,
} from '../../../config/env';
/**
 * 当前内部账号的安全资料与实时授权快照，排除密码哈希。
 */
export type AuthUser = Omit<users, 'passwordHash'> & {
    /**
     * 当前账号有效角色的编码列表。
     */
    roles: string[];
    /**
     * 操作权限聚合位，只作展示与兼容；业务授权应使用菜单实际授权。
     */
    permissions: string;
    /**
     * 以业务资源路由为键的实际授权位字符串；后端授权使用此映射。
     */
    resourcePermissions: Record<string, string>;
};
/**
 * 刷新令牌校验使用的用户、类型、会话版本和到期声明。
 */
type Claims = {
    /**
     * JWT 主体，对应内部用户 ID。
     */
    sub: string;
    /**
     * 内部账号的登录用户名。
     */
    username: string;
    /**
     * 签发时的账号会话版本。
     */
    ver: number;
    /**
     * 当前实体或展示项的类别。
     */
    type: string;
    /**
     * JWT 到期时间，单位为 Unix 秒。
     */
    exp: number;
};
/**
 * 登录审计所需的请求来源摘要，不包含认证凭据。
 */
type ClientMeta = {
    /**
     * 请求来源 IP；null 表示未采集。
     */
    ip?: string | null;
    /**
     * 客户端 User-Agent；null 表示未采集。
     */
    userAgent?: string | null;
};
const hash = (value: string) =>
    createHash('sha256').update(value).digest('hex');
/**
 * 内部员工账号的密码登录、刷新轮换和会话撤销服务。
 */
@Injectable()
export class AuthService {
    constructor(private readonly jwt: JwtService) {}
    /**
     * 读取启用且未删除的内部账号，按启用角色和菜单重新计算资源授权。
     * 聚合权限仅用于展示；接口授权使用 resourcePermissions。
     *
     * @param id 内部用户 ID
     * @param expectedVer 令牌中的会话版本；省略时不比较版本
     * @returns 账号与当前权限；账号不可用或版本不符时返回 null
     */
    async loadUserWithPermissions(
        id: string,
        expectedVer?: number,
    ): Promise<AuthUser | null> {
        const user = await db.users.findFirst({
            where: { id, deletedAt: null, status: 'active' },
        });
        if (
            !user ||
            (expectedVer !== undefined && user.tokenVersion !== expectedVer)
        )
            return null;
        const memberships = await db.userRoles.findMany({
            where: { userId: id, roleRef: { enabled: true } },
            include: {
                roleRef: {
                    include: {
                        roleMenus_roleId: { include: { menuRef: true } },
                    },
                },
            },
        });
        const resources: Record<string, bigint> = {};
        for (const member of memberships)
            for (const grant of member.roleRef.roleMenus_roleId) {
                if (grant.menuRef.enabled && grant.menuRef.to)
                    resources[grant.menuRef.to] =
                        (resources[grant.menuRef.to] ?? 0n) | grant.permissions;
            }
        const roles = memberships.map((m) => m.roleRef.code);
        const aggregate = roles.includes('super_admin')
            ? 9223372036854775807n
            : Object.values(resources).reduce((a, b) => a | b, 0n);
        const { passwordHash: _passwordHash, ...safe } = user;
        return {
            ...safe,
            roles,
            permissions: aggregate.toString(),
            resourcePermissions: Object.fromEntries(
                Object.entries(resources).map(([key, value]) => [
                    key,
                    value.toString(),
                ]),
            ),
        };
    }
    /**
     * 按配置签发访问令牌和指定秒数的刷新令牌，令牌绑定当前账号会话版本。
     * 刷新令牌使用独立密钥并带随机 jti，避免重复签发相同摘要。
     */
    private tokens(
        user: { id: string; username: string; tokenVersion: number },
        seconds: number,
    ) {
        const claims = {
            sub: user.id,
            username: user.username,
            ver: user.tokenVersion,
        };
        return {
            accessToken: this.jwt.sign(
                { ...claims, type: 'access' },
                { expiresIn: getJwtExpiresIn() },
            ),
            refreshToken: this.jwt.sign(
                { ...claims, type: 'refresh', jti: randomUUID() },
                { secret: getRefreshSecret(), expiresIn: seconds },
            ),
        };
    }
    /**
     * 校验内部账号密码并签发访问令牌与刷新令牌。
     * 刷新会话摘要、最近登录时间和登录日志在同一事务中写入。
     *
     * @param dto 登录凭据和记住我选项
     * @param meta 请求来源信息，仅用于登录日志
     * @throws {UnauthorizedException} 账号不可用或密码错误时抛出
     */
    async login(dto: LoginDto, meta: ClientMeta = {}) {
        const user = await db.users.findFirst({
            where: {
                username: dto.username,
                deletedAt: null,
                status: 'active',
            },
        });
        if (!user || !(await bcrypt.compare(dto.password, user.passwordHash)))
            throw new UnauthorizedException({
                code: 'INVALID_CREDENTIALS',
                message: '账号或密码错误',
            });
        const seconds = getRefreshExpiresIn(dto.rememberMe ?? false);
        const tokens = this.tokens(user, seconds);
        await db.$transaction([
            db.refreshTokens.create({
                data: {
                    userId: user.id,
                    tokenHash: hash(tokens.refreshToken),
                    expiresAt: new Date(Date.now() + seconds * 1000),
                },
            }),
            db.users.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() },
            }),
            db.logs.create({
                data: {
                    type: 'login',
                    action: 'login.success',
                    userId: user.id,
                    ip: meta.ip,
                    userAgent: meta.userAgent,
                },
            }),
        ]);
        return { ...tokens, user: await this.loadUserWithPermissions(user.id) };
    }
    /**
     * 消费旧刷新会话并签发新令牌，保留原会话的到期时间。
     * 事务内删除旧摘要并创建新摘要，并发重放只允许一次消费成功。
     *
     * @param dto 需要轮换的刷新令牌
     * @throws {UnauthorizedException} 令牌过期、账号失效、摘要已消费或轮换失败时抛出
     */
    async refresh(dto: RefreshDto) {
        try {
            const claims = this.jwt.verify<Claims>(dto.refreshToken, {
                secret: getRefreshSecret(),
            });
            if (claims.type !== 'refresh') throw new Error('Wrong token type');
            const user = await this.loadUserWithPermissions(
                claims.sub,
                claims.ver,
            );
            if (!user) throw new Error('Revoked user');
            const seconds = Math.floor(claims.exp - Date.now() / 1000);
            if (seconds <= 0) throw new Error('Expired token');
            const tokens = this.tokens(user, seconds);
            await db.$transaction(async (tx) => {
                const consumed = await tx.refreshTokens.deleteMany({
                    where: {
                        tokenHash: hash(dto.refreshToken),
                        userId: user.id,
                        expiresAt: { gt: new Date() },
                    },
                });
                if (consumed.count !== 1)
                    throw new Error('Token already consumed');
                await tx.refreshTokens.create({
                    data: {
                        userId: user.id,
                        tokenHash: hash(tokens.refreshToken),
                        expiresAt: new Date(claims.exp * 1000),
                    },
                });
            });
            return { ...tokens, user };
        } catch {
            throw new UnauthorizedException({
                code: 'UNAUTHORIZED',
                message: '会话已过期，请重新登录',
            });
        }
    }
    /**
     * 撤销当前用户的刷新会话；已签发的访问令牌仍按自身有效期失效。
     *
     * @param user 已通过鉴权的内部用户
     * @param _meta 保留的请求来源参数，当前实现未写入登出日志
     * @param refreshToken 指定时仅删除匹配摘要；省略、null 或空字符串时删除该用户全部刷新会话
     */
    async logout(
        user: AuthUser,
        _meta?: ClientMeta,
        refreshToken?: string | null,
    ) {
        await db.refreshTokens.deleteMany({
            where: {
                userId: user.id,
                ...(refreshToken ? { tokenHash: hash(refreshToken) } : {}),
            },
        });
    }
    /**
     * 拒绝模板保留的演示免密登录入口。
     *
     * @throws {NotFoundException} 基础模板始终未启用该入口
     */
    demoLogin(_kind: string, _meta?: ClientMeta): never {
        throw new NotFoundException('基础模板未启用演示免密登录');
    }
}
