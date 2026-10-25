import type { DemoMeta } from '../types';

export const githubActivityMeta: DemoMeta = {
    titleText: 'GitHub Activity',
    descriptionText:
        'rare-ui github-activity：GitHub 风格贡献热力图 + 主要仓库折叠面板，列数自适应容器，悬浮显示单日详情。',
    scenarioText:
        '个人主页活跃度、团队周报中的提交热度、任意按日聚合指标的日历热力图。',
    // 热力图入场 / 面板展开动画以 CSS 等效实现，零 npm 依赖
    packages: [],
    source: 'apps/vue/src/features/playground/github-activity',
};
