import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DEMO_ALLOWED_KEY } from '../decorators/demo-allowed.decorator';
import { ADMIN_API_KEY } from '../../decorators/admin-controller.decorator';
import { isDemoMode } from '../../../../config/env';

/**
 * 后台演示只读守卫；全局注册以先于鉴权执行，仅处理后台控制器。
 *
 * DEMO_MODE=true 时默认拦截后台非 GET 请求（POST / PUT / PATCH / DELETE），
 * 统一返回 403 { code: 'DEMO_READONLY' }；白名单由 @DemoAllowed() 标注在
 * handler 上放行。DEMO_MODE 关闭时整体放行，行为与现状完全一致。
 *
 * 全局守卫先于路由级 AuthGuard 执行：未登录的写请求同样被拦为 DEMO_READONLY
 * 而非 401，服务端权威、规则只在此一处维护。
 */
@Injectable()
export class DemoReadonlyGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    /**
     * 演示模式下限制后台非白名单写请求；其它端和非演示环境直接放行。
     */
    canActivate(context: ExecutionContext): boolean {
        if (
            !isDemoMode() ||
            !this.reflector.get<boolean>(ADMIN_API_KEY, context.getClass())
        ) {
            return true;
        }

        const request = context
            .switchToHttp()
            .getRequest<{ method?: string }>();
        const method = (request.method ?? 'GET').toUpperCase();
        // 只读与预检方法不在拦截语义内
        if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
            return true;
        }

        const allowed = this.reflector.getAllAndOverride<boolean>(
            DEMO_ALLOWED_KEY,
            [context.getHandler(), context.getClass()],
        );
        if (allowed) {
            return true;
        }

        throw new ForbiddenException({
            code: 'DEMO_READONLY',
            message: '演示环境，禁止修改数据',
        });
    }
}
