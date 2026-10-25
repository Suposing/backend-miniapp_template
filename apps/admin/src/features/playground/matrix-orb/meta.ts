import type { DemoMeta } from '../types';

export const matrixOrbMeta: DemoMeta = {
    titleText: 'Matrix Orb',
    descriptionText:
        'rare-ui matrix-orb：Canvas 2D 点阵光球，idle / listening / thinking 三种状态平滑混合，振幅可接真实音量。',
    scenarioText:
        '语音助手状态指示（待机 / 聆听 / 思考）、AI 对话加载态、通话中的音量可视化。',
    // 原生 Canvas 2D 实现，零 npm 依赖
    packages: [],
    source: 'apps/vue/src/features/playground/matrix-orb',
};
