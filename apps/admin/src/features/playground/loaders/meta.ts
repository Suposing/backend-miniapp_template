import type { DemoMeta } from '../types';

export const loadersMeta: DemoMeta = {
    titleText: '加载动画',
    descriptionText:
        'beUI loader：单组件 17 种加载动效（spinner、点阵、条形、morph 变形、牛顿摆、ASCII 终端式等），一个 size 属性整体缩放，跟随 currentColor 着色，系统开启「减少动态效果」时全部变换降级为缓慢的透明度呼吸。',
    scenarioText:
        '表格 / 弹窗 / 按钮的等待态、命令面板与 AI 生成的进行中指示、终端风格界面的状态展示。',
    // beUI `loader` 的 17 个变体逐一对应移植；React 端的 motion 关键帧在本端
    // 以 CSS @keyframes 等效（端内约定不引入 motion-v），ASCII / scramble /
    // percent 三类走 setInterval，零 npm 依赖
    packages: [],
    source: 'apps/vue/src/features/playground/loaders',
};
