import type { AxiosRequestMetadata } from './types';

import 'axios';

declare module 'axios' {
    /**
     * 项目扩展的 Axios 请求配置
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- 声明合并必须保留 Axios 原有泛型参数 D。
    interface AxiosRequestConfig<D = any> {
        /**
         * 请求失败后的最大重试次数，默认不重试
         */
        retry?: number;
        /**
         * 每次重试前的等待时间（毫秒）
         */
        retryDelay?: number;
        /**
         * 允许触发重试的 HTTP 状态码
         */
        retryStatusCodes?: number[];
        /**
         * 是否跳过重复请求保护
         */
        ignoreDuplicate?: boolean;
        /**
         * 自定义重复请求唯一标识
         */
        duplicateKey?: string;
        /**
         * 是否静默错误提示
         */
        silentError?: boolean;
        /**
         * 是否上报错误日志
         */
        reportError?: boolean;
        /**
         * 请求运行时元数据
         */
        metadata?: AxiosRequestMetadata;
    }

    /**
     * 项目扩展的 Axios 内部请求配置
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- 声明合并必须保留 Axios 原有泛型参数 D。
    interface InternalAxiosRequestConfig<D = any> {
        /**
         * 请求失败后的最大重试次数，默认不重试
         */
        retry?: number;
        /**
         * 每次重试前的等待时间（毫秒）
         */
        retryDelay?: number;
        /**
         * 允许触发重试的 HTTP 状态码
         */
        retryStatusCodes?: number[];
        /**
         * 是否跳过重复请求保护
         */
        ignoreDuplicate?: boolean;
        /**
         * 自定义重复请求唯一标识
         */
        duplicateKey?: string;
        /**
         * 是否静默错误提示
         */
        silentError?: boolean;
        /**
         * 是否上报错误日志
         */
        reportError?: boolean;
        /**
         * 请求运行时元数据
         */
        metadata?: AxiosRequestMetadata;
    }
}
