import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vitest/config';

/**
 * 管理端测试配置；使用 jsdom 提供组件所需的 DOM，纯函数和组件测试共同运行。
 */
export default defineConfig({
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        include: ['src/**/__tests__/**/*.test.ts'],
    },
});
