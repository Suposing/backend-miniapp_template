/**
 * 路由跳转工具：统一 query 拼接、失败 toast、tabBar 自动降级处理
 */

export type NavigateQueryPrimitive =
    string | number | boolean | null | undefined | Date;

/**
 * 页面查询参数值；数组以同名键重复编码到 URL。
 */
export type NavigateQueryValue =
    NavigateQueryPrimitive | Array<NavigateQueryPrimitive>;

/**
 * 按查询参数名组织的页面跳转参数。
 */
export type NavigateQuery = Record<string, NavigateQueryValue>;

/**
 * 页面跳转选项；query 统一编码，其余参数透传给 uni 路由 API。
 */
export type NavigateOptions = {
    /**
     * 跳转时追加的查询参数，统一 URL 编码。
     */
    query?: NavigateQuery;
} & Record<string, unknown>;

/**
 * uni 路由操作回调，成功、失败和完成结果透传给调用方。
 */
export interface NavigateCallbacks<TSuccess = any> {
    /**
     * 操作成功时收到的 uni 回调。
     */
    success?: (res: TSuccess) => void;
    /**
     * 操作失败时收到的 uni 回调。
     */
    fail?: (err: UniApp.GeneralCallbackResult) => void;
    /**
     * 操作结束时的 uni 回调，成功和失败都会触发。
     */
    complete?: (res: any) => void;
}

/**
 * 判断错误是否为“目标是 tabBar 页面但使用了非 switchTab API”导致的失败
 * @param err uni fail 回调错误对象
 * @returns 是否为 tabBar 相关错误
 */
function isTabBarNavigateError(err: UniApp.GeneralCallbackResult): boolean {
    const msg = (err.errMsg || '').toLowerCase();
    return msg.includes('tabbar') || msg.includes('tab bar');
}

/**
 * 将 uni 的 errMsg 转成 toast 更易读的文案
 * @param err uni fail 回调错误对象
 * @returns toast 文案
 */
function resolveToastMessage(err: UniApp.GeneralCallbackResult): string {
    const raw = (err.errMsg || '').trim();
    if (!raw) return '页面跳转失败';

    const lower = raw.toLowerCase();
    const failIndex = lower.indexOf('fail');
    if (failIndex < 0) return raw;

    const tail = raw.slice(failIndex + 4).trim();
    return tail || raw;
}

/**
 * 路由失败时统一 toast 提示
 * @param err uni fail 回调错误对象
 */
function toastNavigateError(err: UniApp.GeneralCallbackResult) {
    uni.showToast({
        title: resolveToastMessage(err),
        icon: 'none',
    });
}

/**
 * 规范化页面路径：确保以 `/` 开头，且保持原有 query 不变
 * @param url 页面路径
 * @returns 规范化后的 url
 */
function normalizeUrl(url: string): string {
    if (!url) return url;

    if (url.startsWith('/')) return url;

    return `/${url}`;
}

/**
 * 将 query 对象序列化为查询字符串（不带 `?`）
 * @param query query 对象
 * @returns 查询字符串（例如：`a=1&b=x%20y`）
 */
function stringifyQuery(query: NavigateQuery): string {
    const parts: string[] = [];

    Object.keys(query).forEach((key) => {
        const value = query[key];
        if (value === undefined || value === null) return;

        const encodedKey = encodeURIComponent(key);

        const pushPair = (item: NavigateQueryPrimitive) => {
            if (item === undefined || item === null) return;

            const normalized =
                item instanceof Date ? item.toISOString() : String(item);
            parts.push(`${encodedKey}=${encodeURIComponent(normalized)}`);
        };

        if (Array.isArray(value)) {
            value.forEach(pushPair);
            return;
        }

        pushPair(value);
    });

    return parts.join('&');
}

/**
 * 拼接 url 与 query 参数
 * @param url 页面路径（可带已有 query）
 * @param query 需要拼接的 query
 * @returns 最终 url
 */
function buildUrl(url: string, query?: NavigateQuery): string {
    const normalizedUrl = normalizeUrl(url);

    if (!query) return normalizedUrl;

    const queryString = stringifyQuery(query);
    if (!queryString) return normalizedUrl;

    return normalizedUrl.includes('?')
        ? `${normalizedUrl}&${queryString}`
        : `${normalizedUrl}?${queryString}`;
}

/**
 * tabBar 页面不支持 query：主动抛出可读错误，避免静默丢参
 * @param url 目标页面路径
 * @returns uni 失败结构
 */
function createTabBarQueryNotSupportedError(
    url: string,
): UniApp.GeneralCallbackResult {
    return {
        errMsg: `tabBar 页面不支持携带 query：${url}`,
    };
}

/**
 * 带 tabBar 自动降级的页面跳转（失败会 toast，并透传给调用方回调）
 * @param primaryInvoker 主要跳转 API（navigateTo/redirectTo/reLaunch）
 * @param url 目标页面路径
 * @param options 跳转参数与回调
 */
function jumpWithTabFallback(
    primaryInvoker: (options: any) => void,
    url: string,
    options: NavigateOptions & NavigateCallbacks = {},
) {
    const { query, success, fail, complete, ...rest } = options;

    const normalizedUrl = normalizeUrl(url);
    const finalUrl = buildUrl(normalizedUrl, query);
    const hasQueryString = !!(query && stringifyQuery(query));

    let fallbackTriggered = false;

    primaryInvoker({
        ...rest,
        url: finalUrl,
        success: (res: any) => {
            success?.(res);
        },
        fail: (err: UniApp.GeneralCallbackResult) => {
            if (isTabBarNavigateError(err)) {
                if (hasQueryString) {
                    const e = createTabBarQueryNotSupportedError(url);
                    toastNavigateError(e);
                    fail?.(e);
                    complete?.(e);
                    return;
                }

                fallbackTriggered = true;
                uni.switchTab({
                    url: normalizedUrl,
                    success: (res: any) => {
                        success?.(res);
                    },
                    fail: (e: UniApp.GeneralCallbackResult) => {
                        toastNavigateError(e);
                        fail?.(e);
                    },
                    complete: (r: any) => {
                        complete?.(r);
                    },
                });

                return;
            }

            toastNavigateError(err);
            fail?.(err);
        },
        complete: (res: any) => {
            if (fallbackTriggered) return;
            complete?.(res);
        },
    });
}

/**
 * 统一路由跳转方法集合
 */
export const nav = {
    /**
     * 跳转到非 tabBar 页面 -> uni.navigateTo
     * @param url 目标页面路径
     * @param options 跳转参数
     */
    push(
        url: string,
        options: NavigateOptions &
            NavigateCallbacks<UniApp.WriteSuccessCallbackResult> = {},
    ) {
        jumpWithTabFallback(uni.navigateTo, url, options);
    },

    /**
     * 重定向到页面 -> uni.redirectTo
     * @param url 目标页面路径
     * @param options 跳转参数
     */
    replace(url: string, options: NavigateOptions & NavigateCallbacks = {}) {
        jumpWithTabFallback(uni.redirectTo, url, options);
    },

    /**
     * 关闭所有页面，打开到某个页面 -> uni.reLaunch
     * @param url 目标页面路径
     * @param options 跳转参数
     */
    reset(url: string, options: NavigateOptions & NavigateCallbacks = {}) {
        jumpWithTabFallback(uni.reLaunch, url, options);
    },

    /**
     * 切换到 tabBar 页面 -> uni.switchTab
     * @param url 目标页面路径
     * @param options 跳转参数
     */
    tab(url: string, options: NavigateCallbacks = {}) {
        const { success, fail, complete, ...rest } =
            options as NavigateCallbacks & Record<string, unknown>;

        uni.switchTab({
            ...rest,
            url: normalizeUrl(url),
            success: (res: any) => {
                success?.(res);
            },
            fail: (err: UniApp.GeneralCallbackResult) => {
                toastNavigateError(err);
                fail?.(err);
            },
            complete: (res: any) => {
                complete?.(res);
            },
        });
    },

    /**
     * 返回上一页/多页 -> uni.navigateBack
     * @param delta 返回层级（默认 1）
     * @param callbacks 回调集合
     */
    back(delta = 1, callbacks: NavigateCallbacks = {}) {
        const { success, fail, complete, ...rest } =
            callbacks as NavigateCallbacks & Record<string, unknown>;

        uni.navigateBack({
            ...rest,
            delta,
            success: (res: any) => {
                success?.(res);
            },
            fail: (err: UniApp.GeneralCallbackResult) => {
                toastNavigateError(err);
                fail?.(err);
            },
            complete: (res: any) => {
                complete?.(res);
            },
        });
    },
};
