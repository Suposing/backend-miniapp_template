import type { DemoMeta } from '../types';

export const gridRevealMeta: DemoMeta = {
    titleText: 'Grid Reveal',
    descriptionText:
        'rare-ui grid-reveal：图片到达前用二分网格自走动画占位，到达后按各格均色着色并渐显真图。',
    scenarioText:
        'AI 出图 / 图片上传的等待与揭示、头像与封面的加载态、图库懒加载占位。',
    // Canvas 2D 网格拆分引擎逐字移植；说明条动画以 CSS 等效实现，零 npm 依赖
    packages: [],
    source: 'apps/vue/src/features/playground/grid-reveal',
};
