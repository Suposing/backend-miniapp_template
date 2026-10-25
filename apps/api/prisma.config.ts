/**
 * 配置 Prisma Schema、迁移和种子入口，数据库连接读取服务端环境变量。
 */
import 'dotenv/config';
import { defineConfig } from 'prisma/config';
import { getDatabaseUrl } from './src/config/env';
export default defineConfig({
    schema: 'prisma/schema.prisma',
    migrations: { path: 'prisma/migrations', seed: 'tsx prisma/seed.ts' },
    datasource: { url: getDatabaseUrl() },
});
