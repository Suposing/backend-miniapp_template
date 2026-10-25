import { DatabaseModule } from './db/client';
import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, RouterModule } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import {
    AdminModule,
    ADMIN_FEATURE_MODULES,
} from './modules/admin/admin.module';
import { MiniappModule } from './modules/miniapp/miniapp.module';
import { HealthController } from './modules/health/health.controller';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

/**
 * 装配共享基础设施与分端入口；健康检查独立于后台和小程序业务路由。
 */
@Module({
    imports: [
        DatabaseModule,
        ConfigModule.forRoot({ isGlobal: true }),
        // 定时任务基础设施（消费者：日志清理 LogCleanupService、refresh_tokens 清理 RefreshTokenCleanupService）
        ScheduleModule.forRoot(),
        AdminModule,
        MiniappModule,
        RouterModule.register([
            {
                path: 'admin',
                module: AdminModule,
                // 子模块保留各控制器的资源路径，共用后台前缀。
                children: ADMIN_FEATURE_MODULES.map((module) => ({
                    path: '',
                    module,
                })),
            },
            { path: 'miniapp', module: MiniappModule },
        ]),
    ],
    controllers: [HealthController],
    providers: [
        { provide: APP_FILTER, useClass: HttpExceptionFilter },
        { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    ],
})
export class AppModule {}
