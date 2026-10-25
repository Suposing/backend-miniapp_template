import type { ApiError } from '@app/shared/api';
import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    Logger,
} from '@nestjs/common';
import type { Response } from 'express';
/**
 * 将接口异常映射为统一 HTTP 状态、错误码和中文消息。
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);
    /**
     * 将 HTTP 异常和常见 Prisma 约束错误转换为统一 code、message 响应。
     * 未知异常使用通用 500 文案，不将内部错误信息返回客户端。
     */
    catch(error: unknown, host: ArgumentsHost) {
        const response = host.switchToHttp().getResponse<Response<ApiError>>();
        let status = 500,
            code = 'INTERNAL_ERROR',
            message = '服务器内部错误';
        if (error instanceof HttpException) {
            status = error.getStatus();
            const body = error.getResponse();
            const value =
                typeof body === 'object' && body
                    ? (body as Record<string, unknown>)
                    : { message: body };
            code =
                typeof value.code === 'string'
                    ? value.code
                    : ((
                          {
                              400: 'VALIDATION_ERROR',
                              401: 'UNAUTHORIZED',
                              403: 'FORBIDDEN',
                              404: 'NOT_FOUND',
                              409: 'CONFLICT',
                              429: 'TOO_MANY_REQUESTS',
                          } as Record<number, string>
                      )[status] ?? code);
            message = Array.isArray(value.message)
                ? value.message.join('; ')
                : String(value.message ?? message);
        } else if (error && typeof error === 'object' && 'code' in error) {
            const mapped: Record<string, [number, string, string]> = {
                P2002: [409, 'CONFLICT', '数据已存在'],
                P2003: [400, 'REFERENCE_CONFLICT', '该数据存在关联记录'],
                P2025: [404, 'NOT_FOUND', '数据不存在'],
            };
            const result = mapped[String(error.code)];
            if (result) [status, code, message] = result;
        }
        if (status >= 500)
            this.logger.error(
                error instanceof Error ? error.message : 'Unknown error',
            );
        response.status(status).json({ code, message });
    }
}
