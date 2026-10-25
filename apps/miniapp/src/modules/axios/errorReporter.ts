import type { AxiosError, AxiosInstance } from 'axios';
import type { ApiError } from '@/types';
import axios from 'axios';
import { AXIOS_DEFAULT_REPORT_ERROR } from './types';

/**
 * 仅上报请求诊断元数据，不包含请求载荷、响应内容或认证头。
 */
export function reportAxiosError(error: AxiosError<ApiError>) {
    const reportError = error.config?.reportError ?? AXIOS_DEFAULT_REPORT_ERROR;

    if (axios.isCancel(error) || !reportError) return;

    uni.$emit('axios:error', {
        method: error.config?.method?.toUpperCase(),
        url: error.config?.url?.split(/[?#]/)[0],
        status: error.response?.status,
        code: error.response?.data?.code || error.code,
    });
}

/**
 * 安装统一请求错误事件。
 */
export function setupErrorReporter(instance: AxiosInstance) {
    instance.interceptors.response.use(undefined, (error: unknown) => {
        if (axios.isAxiosError<ApiError>(error)) reportAxiosError(error);

        return Promise.reject(error);
    });
}
