import { existsSync, readFileSync } from 'node:fs';
import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier/flat';
import vue from 'eslint-plugin-vue';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import vueParser from 'vue-eslint-parser';

const scripts = ['**/*.{js,cjs,mjs,ts,cts,mts,tsx,vue}'];
const typed = ['**/*.{ts,cts,mts,tsx,vue}'];
const autoImportsFile = new URL(
    './apps/miniapp/.eslintrc-auto-import.json',
    import.meta.url,
);
const autoImports = existsSync(autoImportsFile)
    ? Object.fromEntries(
          Object.keys(
              JSON.parse(readFileSync(autoImportsFile, 'utf8')).globals,
          ).map((name) => [name, 'readonly']),
      )
    : {};
const unusedVariables = [
    'error',
    {
        args: 'after-used',
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        ignoreRestSiblings: true,
    },
];

export default defineConfig(
    globalIgnores([
        '**/node_modules/**',
        '**/dist/**',
        '**/coverage/**',
        '**/*.timestamp-*.mjs',
        '.agents/**',
        '.local/**',
        'third-party/**',
        'patches/**',
        'apps/api/src/generated/**',
        'apps/api/uploads/**',
        '**/auto-imports.d.ts',
        '**/components.d.ts',
        '**/typed-router.d.ts',
        'apps/miniapp/uni-pages.d.ts',
        'apps/miniapp/src/shared/unocss.theme.ts',
    ]),
    {
        name: 'app_template/base',
        files: scripts,
        extends: [js.configs.recommended],
        languageOptions: { globals: globals.es2023 },
        rules: {
            'no-console': ['warn', { allow: ['warn', 'error'] }],
            'no-unused-vars': unusedVariables,
        },
    },
    {
        name: 'app_template/typescript',
        files: typed,
        extends: [tseslint.configs.recommended],
        rules: {
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': unusedVariables,
            // 保留现有接口适配和通用组件的显式 any；类型安全继续由 strict 类型检查验证。
            '@typescript-eslint/no-explicit-any': 'off',
        },
    },
    {
        name: 'app_template/vue',
        files: ['**/*.vue'],
        extends: [vue.configs['flat/recommended']],
        languageOptions: {
            parser: vueParser,
            parserOptions: {
                parser: tseslint.parser,
                extraFileExtensions: ['.vue'],
            },
        },
        rules: {
            'vue/multi-word-component-names': 'off',
        },
    },
    {
        name: 'app_template/browser',
        files: [
            'apps/admin/src/**/*.{ts,tsx,vue}',
            'apps/miniapp/src/**/*.{ts,vue}',
        ],
        languageOptions: { globals: globals.browser },
    },
    {
        name: 'app_template/frontend-logging',
        files: ['apps/{admin,miniapp}/**/*.{js,cjs,mjs,ts,cts,mts,tsx,vue}'],
        rules: { 'no-console': 'off' },
    },
    {
        name: 'app_template/api-logging',
        files: ['apps/api/src/**/*.{js,cjs,mjs,ts,cts,mts}'],
        rules: { 'no-console': ['error', {}] },
    },
    {
        name: 'app_template/node',
        files: [
            '*.mjs',
            'scripts/**',
            'packages/*/{scripts,tests}/**/*.mjs',
            'apps/api/**/*.{ts,mts,js,mjs,cjs}',
            'apps/*/*.{ts,mts,js,mjs,cjs}',
        ],
        languageOptions: { globals: globals.node },
    },
    {
        name: 'app_template/cli-output',
        files: ['scripts/**', 'apps/api/prisma/seed.ts'],
        rules: { 'no-console': 'off' },
    },
    {
        name: 'app_template/miniapp',
        files: ['apps/miniapp/src/**/*.{ts,vue}'],
        rules: {
            // 各平台分支在编译后互斥，ESLint 无法识别 uni-app 的 #ifdef 条件。
            'no-useless-assignment': 'off',
        },
        languageOptions: {
            globals: {
                ...autoImports,
                uni: 'readonly',
                wx: 'readonly',
                plus: 'readonly',
                getCurrentPages: 'readonly',
                definePage: 'readonly',
            },
        },
    },
    // 关闭与 Prettier 重叠的格式规则，避免两个工具反复改写同一段代码。
    prettier,
);
