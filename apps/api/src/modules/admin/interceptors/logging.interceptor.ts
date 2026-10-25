import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { ADMIN_API_KEY } from '../decorators/admin-controller.decorator';
import { db } from '../../../db/client';
import type { Request } from 'express';
/**
 * 仅为后台成功写请求记录员工审计，不将客户身份写入内部账号关联。
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    constructor(private readonly reflector: Reflector) {}

    /**
     * 成功的非只读、非认证请求结束后异步记录接口动作与来源，不保存请求体。
     * 日志写入失败被忽略，不改变原接口结果。
     */
    intercept(context: ExecutionContext, next: CallHandler) {
        if (!this.reflector.get<boolean>(ADMIN_API_KEY, context.getClass())) {
            return next.handle();
        }
        const req = context
            .switchToHttp()
            .getRequest<Request & { user?: { id: string } }>();
        return next.handle().pipe(
            tap(() => {
                if (
                    ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ||
                    req.path.includes('/auth/')
                )
                    return;
                void db.logs
                    .create({
                        data: {
                            type: 'api',
                            action: req.method + ' ' + req.path,
                            userId: req.user?.id ?? null,
                            ip: req.ip ?? null,
                            userAgent: req.get('user-agent') ?? null,
                        },
                    })
                    .catch(() => undefined);
            }),
        );
    }
}
