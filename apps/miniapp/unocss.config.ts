import type { Preset, SourceCodeTransformer } from 'unocss';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { dataToEsm } from '@rollup/pluginutils';
import fs from 'fs-extra';
import { isString } from 'mixte';
import {
    defineConfig,
    presetAttributify,
    presetIcons,
    presetWind3,
    transformerDirectives,
    transformerVariantGroup,
} from 'unocss';
import {
    presetApplet,
    presetRemRpx,
    transformerAttributify,
} from 'unocss-applet';
import { presetExtra } from 'unocss-preset-extra';
import { unoThemeColors } from './src/shared/theme.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));

const isApplet = process.env?.UNI_PLATFORM?.startsWith('mp') ?? false;
const COLOR_SPACE_FUNCTION_REGEX = /in (oklch|oklab)/g;

const presets: Preset[] = [];
const transformers: SourceCodeTransformer[] = [];

/**
 * 将 `unocss-applet` 返回的预设实例收口为当前项目使用的 UnoCSS 类型。
 * @param preset UnoCSS 预设实例
 * @returns 兼容当前项目类型系统的预设实例
 */
function toUnoPreset(preset: unknown): Preset {
    return preset as Preset;
}

/**
 * 将 `unocss-applet` 返回的转换器实例收口为当前项目使用的 UnoCSS 类型。
 * @param transformer UnoCSS 转换器实例
 * @returns 兼容当前项目类型系统的转换器实例
 */
function toUnoTransformer(transformer: unknown): SourceCodeTransformer {
    return transformer as SourceCodeTransformer;
}

if (isApplet) {
    // 默认预设, 和 Tailwind 类似
    presets.push(
        toUnoPreset(
            presetApplet({
                presetOptions: {
                    variablePrefix: 'un:',
                    preflight: false,
                },
            }),
        ),
    );
    // 将 rpx 单位转为 rem
    presets.push(toUnoPreset(presetRemRpx({ mode: 'rpx2rem' })));
    /**
     * 小程序端 attributify 处理策略
     *
     * - 原生标签允许无前缀写法
     * - wd- 组件跳过无前缀处理
     * - 任意标签支持 un: 前缀
     */
    transformers.push(
        toUnoTransformer(
            transformerAttributify({
                prefix: 'un:',
                ignoreAttributes: ['block'],
                ignoreTagPrefixes: ['wd'],
            }),
        ),
    );
} else {
    // 默认预设, 和 Tailwind 类似
    presets.push(presetWind3());
    // 属性模式
    presets.push(presetAttributify({ prefix: 'un:' }));
    // 将 rpx 单位转为 rem
    presets.push(toUnoPreset(presetRemRpx({ mode: 'rpx2rem' })));
}

export default defineConfig({
    theme: {
        // 过渡持续时间
        duration: {
            colors: '300ms',
        },
        colors: unoThemeColors,
    },
    presets: [
        // 图标预设
        presetIcons(),
        // 类名简写及额外一些样式预设
        presetExtra(),
        // 在 UniApp 中使用 Unocss, 兼容不支持的语法
        ...presets,
    ],
    transformers: [
        // 在 CSS 中使用 @apply 指令
        transformerDirectives(),
        // 变体组功能
        transformerVariantGroup(),
        // 在 UniApp 中使用 Unocss, 兼容不支持的语法
        ...transformers,
    ],
    extendTheme: (theme) => {
        // 始终生成一个 UnoCSS 主题样式配置文件, 方便在 JS 中引用
        fs.outputFileSync(
            resolve(__dirname, './src/shared/unocss.theme.ts'),
            `/* eslint-disable */\n\n${dataToEsm(theme, {
                preferConst: true,
                indent: '  ',
                objectShorthand: true,
            })}`,
        );
    },
    postprocess: (util) => {
        util.entries.forEach((i) => {
            if (isString(i[1])) {
                i[1] = i[1].replace(COLOR_SPACE_FUNCTION_REGEX, '');
            }
        });
    },
});
