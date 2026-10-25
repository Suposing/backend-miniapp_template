import TlbsMap from 'tlbs-map-vue';
import { createSSRApp } from 'vue';
import pinia from '@/modules/pinia/index';
import App from './App.vue';

import '@/styles/styles.scss';

import 'virtual:uno.css';

/**
 * 创建并返回 UniApp 应用实例（SSR 模式）
 * @returns {{ app: ReturnType<typeof createSSRApp> }} 应用实例对象
 */
export function createApp() {
    const app = createSSRApp(App);

    app.use(pinia);
    app.use(TlbsMap);

    return {
        app,
    };
}
