import { nav } from '@/utils/navigate';

/**
 * 返回上一页；若无上一页则跳转到兜底页面
 * @param options 返回与兜底跳转配置
 */
export function backOr(options: BackOrOptions = {}) {
    const {
        delta = 1,
        fallbackUrl = '/pages/index/index',
        fallbackMethod = 'reset',
    } = options;

    const pages = getCurrentPages();

    if (pages.length > delta) {
        nav.back(delta);
        return;
    }

    if (fallbackMethod === 'push') {
        nav.push(fallbackUrl);
        return;
    }

    if (fallbackMethod === 'replace') {
        nav.replace(fallbackUrl);
        return;
    }

    nav.reset(fallbackUrl);
}

/**
 * backOr 的入参类型
 */
export interface BackOrOptions {
    /**
     * 返回层级（默认 1）
     */
    delta?: number;
    /**
     * 无上一页时的兜底页面（默认 `/pages/index/index`）
     */
    fallbackUrl?: import('virtual:uni-pages').LocationUrl;
    /**
     * 兜底跳转方式（默认 reset）
     */
    fallbackMethod?: 'reset' | 'replace' | 'push';
}

/**
 * 跳转到首页（默认使用 reset）
 */
export function goHome() {
    nav.reset('/pages/index/index');
}

/**
 * 跳转到登录页
 */
export function goLogin() {
    nav.push('/pages/login/index');
}

/**
 * 跳转到个人中心
 */
export function goUserCenter() {
    nav.push('/pages/user/index');
}
