import type {
    AxiosError,
    AxiosInstance,
    InternalAxiosRequestConfig,
} from 'axios';
import axios from 'axios';
import {
    AXIOS_DEFAULT_RETRY,
    AXIOS_DEFAULT_RETRY_DELAY,
    AXIOS_DEFAULT_RETRY_STATUS_CODES,
} from './types';

/**
 * 等待指定时间后继续执行。
 * @param delay 等待时间（毫秒）
 * @returns 等待完成后的 Promise
 */
function sleep(delay: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, delay));
}

/**
 * 判断错误是否允许重试。
 * @param error Axios 错误对象
 * @param config Axios 请求配置
 * @returns 是否允许重试
 */
function shouldRetry(error: AxiosError, config?: InternalAxiosRequestConfig) {
    if (!config || axios.isCancel(error)) return false;

    const retry = config.retry ?? AXIOS_DEFAULT_RETRY;
    const retryCount = config.metadata?.retryCount ?? 0;

    if (retry <= 0 || retryCount >= retry) return false;

    if (!error.response) return true;

    const retryStatusCodes =
        config.retryStatusCodes ?? AXIOS_DEFAULT_RETRY_STATUS_CODES;

    return retryStatusCodes.includes(error.response.status);
}

/**
 * 重置重试请求的取消信号，使重试请求重新进入重复请求保护流程。
 * @param config Axios 请求配置
 */
function resetDuplicateSignal(config: InternalAxiosRequestConfig) {
    delete config.signal;
    delete config.cancelToken;

    config.metadata = {
        ...config.metadata,
        requestKey: undefined,
        duplicateCancel: undefined,
    };
}

/**
 * 为 Axios 实例安装请求重试逻辑。
 * @param instance Axios 实例
 */
export function setupRetry(instance: AxiosInstance) {
    instance.interceptors.response.use(undefined, async (error) => {
        if (!axios.isAxiosError(error) || !shouldRetry(error, error.config))
            return Promise.reject(error);

        const config = error.config as InternalAxiosRequestConfig;
        const retryCount = config.metadata?.retryCount ?? 0;
        const retryDelay = config.retryDelay ?? AXIOS_DEFAULT_RETRY_DELAY;

        config.metadata = {
            ...config.metadata,
            retryCount: retryCount + 1,
        };

        resetDuplicateSignal(config);
        await sleep(retryDelay);

        return instance.request(config);
    });
}
