import {
    Global,
    Injectable,
    Module,
    OnModuleDestroy,
    OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { getDatabaseUrl } from '../config/env';
/**
 * 共享 Prisma 数据库客户端，连接配置来自服务端环境。
 */
@Injectable()
export class PrismaService
    extends PrismaClient
    implements OnModuleInit, OnModuleDestroy
{
    constructor() {
        const connectionString = getDatabaseUrl();
        super({ adapter: new PrismaPg({ connectionString }) });
    }
    /**
     * 应用模块初始化时建立共享数据库连接。
     */
    async onModuleInit() {
        await this.$connect();
    }
    /**
     * 应用模块销毁时断开共享数据库连接。
     */
    async onModuleDestroy() {
        await this.$disconnect();
    }
}
/**
 * 业务服务共用的 Prisma 客户端，由 DatabaseModule 管理连接生命周期。
 */
export const db = new PrismaService();
@Global()
@Module({
    providers: [{ provide: PrismaService, useValue: db }],
    exports: [PrismaService],
})
export class DatabaseModule {}
