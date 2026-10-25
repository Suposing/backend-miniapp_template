/**
 * 客户端终端类型枚举
 */
export enum ClientEnum {
    /**
     * 兜底端
     */
    OTHER = 0,
    /**
     * 微信小程序
     */
    MP_WEIXIN = 1,
    /**
     * 微信公众号（H5 内）
     */
    OA_WEIXIN = 2,
    /**
     * 普通 H5 浏览器
     */
    H5 = 3,
    /**
     * PC 端
     */
    PC = 4,
    /**
     * iOS App
     */
    IOS = 5,
    /**
     * Android App
     */
    ANDROID = 6,
    /**
     * 抖音/头条系小程序
     */
    MP_TOUTIAO = 7,
}

/**
 * 客户端类型
 */
export type ClientType = ClientEnum;

/**
 * 微信浏览器 UA 匹配正则
 */
const WEIXIN_CLIENT_RE = /MicroMessenger/i;

/**
 * 各端处理函数集合
 */
export interface ClientEventHandlers<T> {
    /**
     * 微信小程序处理函数
     */
    MP_WEIXIN: () => T;
    /**
     * 微信公众号 H5 处理函数
     */
    OA_WEIXIN: () => T;
    /**
     * 普通 H5 处理函数
     */
    H5: () => T;
    /**
     * PC 端处理函数
     */
    PC: () => T;
    /**
     * iOS App 处理函数
     */
    IOS: () => T;
    /**
     * Android App 处理函数
     */
    ANDROID: () => T;
    /**
     * 抖音/头条小程序处理函数
     */
    MP_TOUTIAO: () => T;
    /**
     * 其他端处理函数
     */
    OTHER: () => T;
}

/**
 * 判断当前 H5 是否运行在微信内
 * @returns 是否为微信内 H5
 */
export function isWeixinClient() {
    // #ifdef H5
    return WEIXIN_CLIENT_RE.test(navigator.userAgent);
    // #endif

    return false;
}

/**
 * 获取当前客户端类型
 * @returns 当前客户端类型
 */
export function getClient(): ClientEnum {
    let currentClient = ClientEnum.OTHER;

    // #ifdef MP-WEIXIN
    currentClient = ClientEnum.MP_WEIXIN;
    // #endif

    // #ifdef MP-TOUTIAO
    currentClient = ClientEnum.MP_TOUTIAO;
    // #endif

    // #ifdef H5
    currentClient = isWeixinClient() ? ClientEnum.OA_WEIXIN : ClientEnum.H5;
    // #endif

    // #ifdef APP-PLUS
    const systemInfo = uni.getSystemInfoSync();
    currentClient =
        systemInfo.platform === 'ios' ? ClientEnum.IOS : ClientEnum.ANDROID;
    // #endif

    // #ifdef PC
    currentClient = ClientEnum.PC;
    // #endif

    return currentClient;
}

/**
 * 根据当前客户端选择并执行对应处理函数
 * @param handlers 各端处理函数集合
 * @returns 当前端处理函数的返回值
 */
export function handleClientEvent<T>(handlers: ClientEventHandlers<T>): T {
    const currentClient = getClient();

    switch (currentClient) {
        case ClientEnum.MP_WEIXIN:
            return handlers.MP_WEIXIN();
        case ClientEnum.OA_WEIXIN:
            return handlers.OA_WEIXIN();
        case ClientEnum.H5:
            return handlers.H5();
        case ClientEnum.PC:
            return handlers.PC();
        case ClientEnum.IOS:
            return handlers.IOS();
        case ClientEnum.ANDROID:
            return handlers.ANDROID();
        case ClientEnum.MP_TOUTIAO:
            return handlers.MP_TOUTIAO();
        default:
            return handlers.OTHER();
    }
}

/**
 * 当前客户端类型
 */
export const client = getClient();
