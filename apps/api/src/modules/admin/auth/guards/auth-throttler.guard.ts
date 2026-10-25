import {
    CanActivate,
    ExecutionContext,
    HttpException,
    HttpStatus,
    Injectable,
} from '@nestjs/common';
import { ThrottlerException, ThrottlerGuard } from '@nestjs/throttler';
import { isThrottleEnabled } from '../../../../config/env';

/**
 * 登录与刷新接口按请求来源限流。反向代理信任跳数由 bootstrap.ts 的环境配置决定。
 */
@Injectable()
export class AuthThrottlerGuard extends ThrottlerGuard implements CanActivate {
    /**
     * 按开关执行来源限流，并把超限错误转换为统一的 429 中文响应。
     */
    async canActivate(context: ExecutionContext): Promise<boolean> {
        if (!isThrottleEnabled()) {
            return true;
        }
        try {
            return await super.canActivate(context);
        } catch (error) {
            if (error instanceof ThrottlerException) {
                throw new HttpException(
                    {
                        code: 'TOO_MANY_REQUESTS',
                        message: '请求过于频繁，请稍后再试',
                    },
                    HttpStatus.TOO_MANY_REQUESTS,
                );
            }
            throw error;
        }
    }
}
