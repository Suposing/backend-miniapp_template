import { Logger } from '@nestjs/common';
import { createApp } from './bootstrap';
import { loadConfig } from './config/env';
async function bootstrap() {
    const app = await createApp();
    const { port, host, publicApiUrl } = loadConfig();
    await app.listen(port, host);
    Logger.log(`基础模板后台 API: ${publicApiUrl}/api/admin`, 'Bootstrap');
    Logger.log(`后台接口文档: ${publicApiUrl}/docs/admin`, 'Bootstrap');
}
void bootstrap();
