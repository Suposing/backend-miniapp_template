import type { DemoMeta } from '../types';

import { packageVersion } from '../constants';

export const codeBlockMeta: DemoMeta = {
    titleText: '代码块',
    descriptionText:
        '多语言语法高亮代码块：从单一 accent 色派生整套配色，跟随深浅色模式，内置行号、高亮行与一键复制。',
    scenarioText:
        '接口文档与 SDK 示例展示、配置片段预览、操作日志中的请求 / 响应体回显、系统设置里的脚本预览。',
    // Vue 端高亮走 prismjs 直渲染（prism-react-renderer 为 React 专属）；复制反馈动画以 CSS 等效，不引入 motion-v
    packages: [
        {
            name: 'prismjs',
            version: packageVersion('prismjs'),
            github: 'https://github.com/PrismJS/prism',
            docs: 'https://prismjs.com/',
        },
    ],
    source: 'apps/vue/src/features/playground/code-block',
};
