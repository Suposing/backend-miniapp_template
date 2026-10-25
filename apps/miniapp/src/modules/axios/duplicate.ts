import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import axios from 'axios';
import { buildRequestKey } from './requestKey';
import { AXIOS_DEFAULT_IGNORE_DUPLICATE } from './types';

const pendingRequests = new Map<string, () => void>();

/**
 * 清理已完成请求的重复请求记录。
 * @param config Axios 请求配置
 */
function clearPendingRequest(config?: InternalAxiosRequestConfig) {
    const requestKey = config?.metadata?.requestKey;
    const duplicateCancel = config?.metadata?.duplicateCancel;

    if (!requestKey || !duplicateCancel) return;

    if (pendingRequests.get(requestKey) === duplicateCancel)
        pendingRequests.delete(requestKey);
}

/**
 * 为 Axios 实例安装重复请求保护。
 * @param instance Axios 实例
 */
export function setupDuplicateRequest(instance: AxiosInstance) {
    instance.interceptors.request.use((config) => {
        const ignoreDuplicate =
            config.ignoreDuplicate ?? AXIOS_DEFAULT_IGNORE_DUPLICATE;

        if (ignoreDuplicate || config.cancelToken) return config;

        const requestKey = config.duplicateKey || buildRequestKey(config);
        const previousCancel = pendingRequests.get(requestKey);

        previousCancel?.();

        const cancelSource = axios.CancelToken.source();
        const duplicateCancel = () => cancelSource.cancel('重复请求已取消');

        pendingRequests.set(requestKey, duplicateCancel);

        config.cancelToken = cancelSource.token;
        config.metadata = {
            ...config.metadata,
            requestKey,
            duplicateCancel,
        };

        return config;
    });

    instance.interceptors.response.use(
        (response) => {
            clearPendingRequest(response.config);
            return response;
        },
        (error) => {
            if (axios.isAxiosError(error)) clearPendingRequest(error.config);

            return Promise.reject(error);
        },
    );
}
