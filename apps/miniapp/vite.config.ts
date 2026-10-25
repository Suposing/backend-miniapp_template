import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Uni from '@dcloudio/vite-plugin-uni';
import { MixteUseAutoImport } from '@mixte/use/register';
import Inject from '@rollup/plugin-inject';
import Components from '@uni-helper/vite-plugin-uni-components';
import {
    UniUIResolver,
    WotResolver,
} from '@uni-helper/vite-plugin-uni-components/resolvers';
import UniManifest, {
    writeManifestJson,
} from '@uni-helper/vite-plugin-uni-manifest';
import UniPages from '@uni-helper/vite-plugin-uni-pages';
import { isESModule } from 'mixte';
import { NutResolver } from 'nutui-uniapp';
import Unocss from 'unocss/vite';
import AutoImport from 'unplugin-auto-import/vite';
import { defineConfig } from 'vite';
import Inspect from 'vite-plugin-inspect';
import manifestConfig from './manifest.config';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ command, mode }) => {
    // 是否生产构建
    const isProdBuild = command === 'build' && mode === 'production';

    // uni 插件初始化时就读取 manifest；先写入真实配置，支持空目录首次构建。
    writeManifestJson(manifestConfig, { outDir: resolve(__dirname, './src') });

    return {
        // 小程序 H5 固定 5173，避免漂移到管理端端口后被跨域策略拦截。
        server: { port: 5173, strictPort: true },
        // 环境变量前缀
        envPrefix: 'APP_',
        // 路径别名
        resolve: {
            alias: {
                // uni-app 保留符号链接；从真实包路径解析 Pinia，兼容 pnpm 的传递依赖。
                pinia: fileURLToPath(import.meta.resolve('pinia')),
                '~': resolve(__dirname, './src'),
                '@': resolve(__dirname, './src'),
                '@@': resolve(__dirname, './'),
            },
        },
        // 压缩配置
        esbuild: isProdBuild
            ? {
                  pure: ['console.log'],
              }
            : undefined,
        // 插件
        plugins: [
            Inject({
                requestAnimationFrame: resolve(
                    __dirname,
                    './src/modules/polyfills/requestAnimationFrame.ts',
                ),
                exclude: ['node_modules/wot-design-uni/**'],
            }),
            // 原子化 CSS 引擎
            Unocss(),
            // 自动导入使用到的组件
            Components({
                dts: resolve(__dirname, './types/components.d.ts'),
                dirs: [
                    resolve(__dirname, './src/layouts'),
                    resolve(__dirname, './src/components'),
                    resolve(__dirname, './src/components-private'),
                ],
                resolvers: [UniUIResolver(), WotResolver(), NutResolver()],
            }),
            // API 自动加载
            AutoImport({
                dts: resolve(__dirname, './types/auto-imports.d.ts'),
                vueTemplate: true,
                imports: [
                    'vue',
                    'uni-app',
                    '@vueuse/core',
                    '@vueuse/math',
                    MixteUseAutoImport({ useWithVueUseCore: true }),
                    {
                        // 封装导航函数
                        '@/utils/navigate': ['nav'],
                        // 跳转方法
                        '@/utils/navigateActions': [
                            'backOr',
                            'goHome',
                            'goLogin',
                            'goUserCenter',
                        ],
                    },
                ],
                dirs: [
                    resolve(__dirname, './src/composables'),
                    resolve(__dirname, './src/stores'),
                ],
                eslintrc: {
                    enabled: true,
                    filepath: resolve(
                        __dirname,
                        './.eslintrc-auto-import.json',
                    ),
                },
            }),
            // 基于文件路由自动生成 pages.json（由 unh 在启动前落盘）
            UniPages({
                // 兼容 pages 目录下既有顶层页面（src/pages/index.vue）也有子目录页面（src/pages/user/index.vue）
                dir: '{src/pages,src/pages/**}',
                // 支持将 src/bundle 作为模板默认分包目录
                subPackages: ['src/bundle'],
                // 页面目录中的局部组件不参与页面生成
                exclude: [
                    'node_modules',
                    '.git',
                    '**/__*__/**',
                    'src/pages/**/components',
                    'src/pages/**/components/**',
                    '**/components/**',
                ],
            }),
            // 自动生成 manifest.json（由 unh 在启动前落盘）
            UniManifest(),
            // uni-app
            isESModule(Uni) ? Uni.default() : Uni(),
            // 是否启用插件调试
            Inspect(),
        ].filter(Boolean),
    };
});
