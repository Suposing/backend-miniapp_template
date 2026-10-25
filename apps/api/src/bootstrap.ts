import 'dotenv/config';
import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { loadConfig } from './config/env';
/**
 * 加载并校验环境配置，装配 API 的验证、鉴权、响应、日志及静态上传目录。
 *
 * @returns 已配置但尚未监听端口的 NestJS 应用
 */
export async function createApp() {
    const config = loadConfig();
    // 先验证环境，再装载依赖数据库和认证配置的业务模块。
    const { AppModule } = await import('./app.module');
    const { ADMIN_FEATURE_MODULES } =
        await import('./modules/admin/admin.module');
    const { UPLOAD_ROOT } =
        await import('./modules/admin/account/avatar-storage.service');
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
        logger: config.nodeEnv === 'test' ? false : ['error', 'warn', 'log'],
    });
    const hops = config.trustProxyHops;
    app.set('trust proxy', hops > 0 ? hops : false);
    app.setGlobalPrefix('api');
    app.enableCors({
        origin: config.corsOrigins,
        credentials: true,
    });
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
        }),
    );
    app.useStaticAssets(UPLOAD_ROOT, {
        prefix: '/uploads/',
        index: false,
        dotfiles: 'deny',
    });
    app.enableShutdownHooks();
    const adminDocument = SwaggerModule.createDocument(
        app,
        new DocumentBuilder()
            .setTitle('基础模板后台 API')
            .setDescription('内部员工管理接口，统一使用 /api/admin 前缀')
            .setVersion('0.1.0')
            .addBearerAuth()
            .build(),
        { include: ADMIN_FEATURE_MODULES },
    );
    SwaggerModule.setup('docs/admin', app, adminDocument);
    const systemDocument = SwaggerModule.createDocument(
        app,
        new DocumentBuilder()
            .setTitle('基础模板系统 API')
            .setDescription('不属于任何业务端的公共健康检查')
            .setVersion('0.1.0')
            .build(),
        { include: [AppModule] },
    );
    SwaggerModule.setup('docs/system', app, systemDocument);
    return app;
}
