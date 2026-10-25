import { createUniAppAxiosAdapter } from '@uni-helper/axios-adapter';
import axios from 'axios';
import { setupDuplicateRequest } from './duplicate';
import { setupFinalErrorHandler, setupRequestAuth } from './errorHandler';
import { setupErrorReporter } from './errorReporter';
import { setupRetry } from './retry';
import { AXIOS_DEFAULT_TIMEOUT } from './types';

axios.defaults.adapter = createUniAppAxiosAdapter();

/**
 * 项目共享请求实例，统一承载 Token、错误处理、重试与重复请求保护
 */
export const instance = axios.create({
    baseURL:
        import.meta.env.APP_BASE_URL?.trim() ||
        'http://localhost:3000/api/miniapp',
    timeout: AXIOS_DEFAULT_TIMEOUT,
    adapter: createUniAppAxiosAdapter(),
});

setupDuplicateRequest(instance);
setupRequestAuth(instance);
setupRetry(instance);
setupErrorReporter(instance);
setupFinalErrorHandler(instance);
