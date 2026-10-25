/**
 * 路由页面转场预设，使用 main-content 视图过渡名称和对应 CSS 关键帧。
 * 独立于外观主题切换的方向揭示动画。
 */

export type RouteTransitionId =
    | 'none'
    | 'fade'
    | 'glide'
    | 'rise'
    | 'zoom'
    | 'reveal'
    | 'cover'
    | 'circle'
    | 'blur';

export const ROUTE_TRANSITIONS: {
    id: RouteTransitionId;
    /**
     * 显示名称。
     */
    labelText: string;
}[] = [
    { id: 'none', labelText: '无动画' },
    { id: 'fade', labelText: '柔和淡化' },
    { id: 'glide', labelText: '视差推滑' },
    { id: 'rise', labelText: '浮现上升' },
    { id: 'zoom', labelText: '纵深缩放' },
    { id: 'reveal', labelText: '揭示展开' },
    { id: 'cover', labelText: '覆盖推入' },
    { id: 'circle', labelText: '圆形揭示' },
    { id: 'blur', labelText: '景深聚焦' },
];

export const ROUTE_TRANSITION_IDS: RouteTransitionId[] = ROUTE_TRANSITIONS.map(
    (t) => t.id,
);

/**
 * 是否为合法的路由过渡动画 id（兜底校验，失效值回退「无动画」）。
 */
export function isRouteTransition(value: unknown): value is RouteTransitionId {
    return (
        typeof value === 'string' &&
        (ROUTE_TRANSITION_IDS as string[]).includes(value)
    );
}

/**
 * 过渡动画时长（毫秒）。标准速度下的基准值，实际时长 × 速度倍率。
 */
export const ROUTE_TRANSITION_DURATION_MS = 420;

/**
 * 把路由过渡动画 id 应用到 <html> 的 data-route-transition 属性（none 移除）。
 */
export function applyRouteTransitionToDOM(id: RouteTransitionId): void {
    const root = document.documentElement;

    if (id === 'none') {
        root.removeAttribute('data-route-transition');
    } else {
        root.setAttribute('data-route-transition', id);
    }
}

// ── 播放速度档位 ──

/**
 * 路由转场速度预设的标识。
 */
export type RouteTransitionSpeedId = 'slow' | 'normal' | 'fast';

export const ROUTE_TRANSITION_SPEEDS: {
    id: RouteTransitionSpeedId;
    /**
     * 显示名称。
     */
    labelText: string;
}[] = [
    { id: 'slow', labelText: '慢速' },
    { id: 'normal', labelText: '标准' },
    { id: 'fast', labelText: '快速' },
];

export const ROUTE_TRANSITION_SPEED_IDS: RouteTransitionSpeedId[] =
    ROUTE_TRANSITION_SPEEDS.map((s) => s.id);

/**
 * 是否为合法的速度档位 id（兜底校验，失效值回退「标准」）。
 */
export function isRouteTransitionSpeed(
    value: unknown,
): value is RouteTransitionSpeedId {
    return (
        typeof value === 'string' &&
        (ROUTE_TRANSITION_SPEED_IDS as string[]).includes(value)
    );
}

/**
 * 把路由过渡速度档位应用到 <html> 的 data-rt-speed 属性（normal 移除，供 CSS 倍率生效）。
 */
export function applyRouteTransitionSpeedToDOM(
    speed: RouteTransitionSpeedId,
): void {
    const root = document.documentElement;

    if (speed === 'normal') {
        root.removeAttribute('data-rt-speed');
    } else {
        root.setAttribute('data-rt-speed', speed);
    }
}
