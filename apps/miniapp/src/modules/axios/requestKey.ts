import type { AxiosRequestConfig } from 'axios';

/**
 * 生成请求唯一标识，用于重复请求判断。
 * @param config Axios 请求配置
 * @returns 请求唯一标识
 */
export function buildRequestKey(config: AxiosRequestConfig) {
    return [
        config.method?.toUpperCase() ?? 'GET',
        config.baseURL ?? '',
        config.url ?? '',
        JSON.stringify(config.params ?? {}),
        JSON.stringify(config.data ?? {}),
    ].join('&');
}
