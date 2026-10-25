import type { DemoMeta } from '../types';

import { packageVersion } from '../constants';

import { githubUrl } from '@/lib/env';

export const themeSwitchAnimationMeta: DemoMeta = {
    titleText: '主题切换动画',
    descriptionText:
        '基于 View Transitions API 的主题切换动画：切换深浅色时，新主题以指定形状（圆形扩散、多边形、百叶窗 / 扫描 / 方块格子、涟漪、扇形、双开门）「揭开」覆盖旧主题，而不是生硬跳变。',
    scenarioText:
        '系统深浅色切换（页头主题按钮、偏好设置）、需要「形状揭示」质感的品牌化主题过渡。',
    packages: [
        {
            name: 'theme-switch-animation',
            version: packageVersion('theme-switch-animation'),
            github: githubUrl('theme-switch-animation'),
            docs: 'https://theme-switch-animation.baiwumm.com',
        },
    ],
    source: 'apps/vue/src/features/playground/theme-switch-animation',
};
