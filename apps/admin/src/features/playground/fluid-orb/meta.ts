import type { DemoMeta } from '../types';

export const fluidOrbMeta: DemoMeta = {
    titleText: 'Fluid Orb',
    descriptionText:
        'rare-ui fluid-orb：一段 WebGL 片元着色器，用分形布朗噪声推动色彩流动，形成柔和的球形光晕。',
    scenarioText:
        'AI 助手待机 / 说话态视觉、语音输入指示、登录页或空状态的氛围装饰。',
    // 原生 WebGL 着色器实现，零 npm 依赖
    packages: [],
    source: 'apps/vue/src/features/playground/fluid-orb',
};
