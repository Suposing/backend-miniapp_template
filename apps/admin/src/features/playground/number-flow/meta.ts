import type { DemoMeta } from '../types';

import { packageVersion } from '../constants';

export const numberFlowMeta: DemoMeta = {
    titleText: 'Number Flow',
    descriptionText:
        '官方 Number Flow：数字变化时逐位滚动过渡，支持 Intl 格式化、前后缀、趋势方向与多数字同步。',
    scenarioText:
        'Dashboard KPI 统计卡、实时在线人数、倒计时、购物车金额、进度百分比等一切会变化的数字。',
    // Phase C Dashboard KPI 数字滚动落地后回填 usedIn（plan §5.2 关联区）
    packages: [
        {
            name: '@number-flow/vue',
            version: packageVersion('@number-flow/vue'),
            github: 'https://github.com/barvian/number-flow',
            docs: 'https://number-flow.barvian.me/vue',
        },
    ],
    source: 'apps/vue/src/features/playground/number-flow',
};
