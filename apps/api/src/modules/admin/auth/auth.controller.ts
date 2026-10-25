import { AdminController } from '../decorators/admin-controller.decorator';
import { Body, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { AuthService, AuthUser } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { LogoutDto } from './dto/logout.dto';
import { DemoLoginDto } from './dto/demo-login.dto';
import { DemoAllowed } from './decorators/demo-allowed.decorator';
import { AuthThrottlerGuard } from './guards/auth-throttler.guard';
import { Request } from 'express';

/**
 * 登录与保留的演示入口每个来源每分钟最多 20 次，避免高频尝试账号密码。
 */
const AUTH_THROTTLE = { default: { limit: 20, ttl: 60_000 } };
/**
 * 刷新接口每个来源每分钟最多 60 次，为共享出口下的集中续期保留余量。
 */
const REFRESH_THROTTLE = { default: { limit: 60, ttl: 60_000 } };

/**
 * 内部账号认证接口；登录与刷新限流，资料和退出要求 JWT 鉴权。
 */
@AdminController('auth')
@UseGuards(AuthThrottlerGuard)
@Throttle(AUTH_THROTTLE)
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    private clientMeta(req: Request) {
        const ip = req.ip || null;
        const userAgent = (req.headers['user-agent'] as string) ?? null;
        return { ip, userAgent };
    }

    /**
     * 校验内部账号密码并建立会话，返回 HTTP 200；与微信客户身份独立。
     */
    @Post('login')
    @HttpCode(200)
    @DemoAllowed()
    async login(@Body() dto: LoginDto, @Req() req: Request) {
        return this.authService.login(dto, this.clientMeta(req));
    }

    /**
     * 轮换有效刷新会话，返回新令牌；原刷新令牌只能成功消费一次。
     */
    @Post('refresh')
    @HttpCode(200)
    @DemoAllowed()
    @Throttle(REFRESH_THROTTLE)
    async refresh(@Body() dto: RefreshDto) {
        return this.authService.refresh(dto);
    }

    /**
     * 保留模板请求路径；基础模板未启用演示免密登录，始终返回 404。
     */
    @Post('demo-login')
    @HttpCode(200)
    @DemoAllowed()
    async demoLogin(@Body() dto: DemoLoginDto, @Req() req: Request) {
        return this.authService.demoLogin(dto.kind, this.clientMeta(req));
    }

    /**
     * 返回 JWT 策略实时读取的当前内部账号资料与授权快照。
     */
    @Get('me')
    @UseGuards(AuthGuard('admin-jwt'))
    async me(@Req() req: Request) {
        return (req.user as AuthUser) ?? null;
    }

    /**
     * 撤销已鉴权账号的刷新会话并返回 204。
     * 提供 refreshToken 时仅撤销匹配会话；省略或空字符串时撤销该账号全部刷新会话。当前实现不写登出日志。
     */
    @Post('logout')
    @HttpCode(204)
    @UseGuards(AuthGuard('admin-jwt'))
    @DemoAllowed()
    async logout(@Req() req: Request, @Body() dto?: LogoutDto) {
        await this.authService.logout(
            req.user as AuthUser,
            this.clientMeta(req),
            dto?.refreshToken ?? null,
        );
        return;
    }
}
