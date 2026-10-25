import type { DemoMeta } from '../types';

export const animatedCounterMeta: DemoMeta = {
    titleText: 'Animated Counter',
    descriptionText:
        'rare-ui animated-counter：每一位数字都是一只里程表滚轮，按变化方向正反转动，支持小数、分组、补零与前后缀。',
    scenarioText:
        '计数器、里程 / 积分累计、余额涨跌等需要「转动」质感而非简单渐变的数字场景。',
    // 滚轮 / 位移动画以 CSS transition + Vue TransitionGroup（FLIP）等效实现，零 npm 依赖
    packages: [],
    source: 'apps/vue/src/features/playground/animated-counter',
};
