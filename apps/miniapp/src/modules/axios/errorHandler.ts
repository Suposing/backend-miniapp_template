import type { AxiosInstance } from 'axios';
import type { ApiError } from '@/types';
import axios, { AxiosError } from 'axios';
import pinia from '@/modules/pinia/index';
import { useAuthStore } from '@/stores/auth';
import { AXIOS_DEFAULT_SILENT_ERROR } from './types';

/**
 * 安装 Bearer 鉴权；Token 不写入请求参数或请求体。
 */
export function setupRequestAuth(instance: AxiosInstance) {
    instance.interceptors.request.use((config) => {
        const authStore = useAuthStore(pinia);

        if (authStore.accessToken && !config.headers.Authorization)
            config.headers.Authorization = `Bearer ${authStore.accessToken}`;

        return config;
    });
}

/**
 * 根据 HTTP 状态处理错误，成功响应保留后端的 { data, pagination? }。
 */
export function setupFinalErrorHandler(instance: AxiosInstance) {
    instance.interceptors.response.use(undefined, (error: unknown) => {
        if (
            axios.isCancel(error) ||
            (axios.isAxiosError(error) &&
                error.code === AxiosError.ERR_CANCELED)
        )
            return Promise.reject(error);

        uni.hideLoading();

        if (!axios.isAxiosError<ApiError>(error)) {
            uni.showToast({ title: '请求失败，请稍后重试', icon: 'none' });
            return Promise.reject(error);
        }

        if (error.response?.status === 401) {
            const authStore = useAuthStore(pinia);
            // 旧请求的 401 不应清除用户刚建立的新会话。
            if (
                error.config?.headers.Authorization ===
                `Bearer ${authStore.accessToken}`
            )
                authStore.logout();
        }

        const message =
            error.response?.data?.message ||
            error.message ||
            '请求失败，请稍后重试';
        const silentError =
            error.config?.silentError ?? AXIOS_DEFAULT_SILENT_ERROR;

        if (!silentError) uni.showToast({ title: message, icon: 'none' });

        return Promise.reject(error);
    });
}
