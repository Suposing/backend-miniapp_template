/**
 * Uni 窗口信息中的顶部安全区扩展字段
 */
type SafeAreaTopWindowInfo = ReturnType<typeof uni.getWindowInfo> & {
    /**
     * 窗口顶部安全区坐标，单位为 px。
     */
    safeArea?: {
        /**
         * 窗口顶部安全区高度，单位为 px。
         */
        top?: number;
    };
    /**
     * 窗口安全区内边距，单位为 px。
     */
    safeAreaInsets?: {
        /**
         * 窗口顶部安全区高度，单位为 px。
         */
        top?: number;
    };
};

/**
 * 安全获取窗口信息，避免低版本运行环境影响布局兜底。
 * @returns 当前窗口信息
 */
function getWindowInfoSafe() {
    try {
        return uni.getWindowInfo() as SafeAreaTopWindowInfo;
    } catch {
        return undefined;
    }
}

/**
 * 将 rpx/upx 数值转换为当前设备下的 px。
 * @param value rpx/upx 数值
 * @returns 转换后的 px 数值
 */
export function upxToPx(value: number) {
    return uni.upx2px(value);
}

/**
 * 将 px 数值转换为当前设备下的 rpx/upx。
 * @param value px 数值
 * @returns 转换后的 rpx/upx 数值
 */
export function pxToRpx(value: number) {
    const screenWidthPx = uni.upx2px(750) || 375;

    return Math.round((value * 750) / screenWidthPx);
}

/**
 * 获取当前设备顶部安全区高度。
 * @returns 顶部安全区高度（px）
 */
export function getSafeAreaTopPx() {
    const windowInfo = getWindowInfoSafe();

    return Math.max(
        windowInfo?.safeArea?.top ?? 0,
        windowInfo?.safeAreaInsets?.top ?? 0,
        windowInfo?.statusBarHeight ?? 0,
    );
}
