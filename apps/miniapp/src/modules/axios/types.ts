/**
 * 请求默认超时时间（毫秒）
 */
export const AXIOS_DEFAULT_TIMEOUT = 60000;

/**
 * 请求默认重试次数
 */
export const AXIOS_DEFAULT_RETRY = 0;

/**
 * 请求默认重试间隔（毫秒）
 */
export const AXIOS_DEFAULT_RETRY_DELAY = 600;

/**
 * 是否默认跳过重复请求保护
 */
export const AXIOS_DEFAULT_IGNORE_DUPLICATE = false;

/**
 * 是否默认静默错误提示
 */
export const AXIOS_DEFAULT_SILENT_ERROR = false;

/**
 * 是否默认上报错误日志
 */
export const AXIOS_DEFAULT_REPORT_ERROR = true;

/**
 * 默认允许重试的 HTTP 状态码
 */
export const AXIOS_DEFAULT_RETRY_STATUS_CODES = [500, 502, 503, 504];

/**
 * Axios 请求运行时元数据
 */
export interface AxiosRequestMetadata {
    /**
     * 请求开始时间戳
     */
    startTime?: number;
    /**
     * 请求唯一标识
     */
    requestKey?: string;
    /**
     * 重复请求取消函数
     */
    duplicateCancel?: () => void;
    /**
     * 当前已重试次数
     */
    retryCount?: number;
}
