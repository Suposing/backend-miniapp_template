<script setup lang="ts">
    import type { CodeSampleLanguage } from './code-samples';

    import { computed, ref } from 'vue';

    import DemoColorSwatches from '../DemoColorSwatches.vue';
    import DemoControl from '../DemoControl.vue';
    import DemoSection from '../DemoSection.vue';
    import DemoSegmented from '../DemoSegmented.vue';
    import DemoSwitch from '../DemoSwitch.vue';
    import PlaygroundPage from '../PlaygroundPage.vue';
    import { DEMO_ACCENTS } from '../demo-palette';

    import CodeBlock from './CodeBlock.vue';
    import { CODE_SAMPLES, CODE_SAMPLE_LANGUAGES } from './code-samples';
    import { codeBlockMeta } from './meta';

    type ThemeMode = 'auto' | 'light' | 'dark';

    const THEME_MODES: ThemeMode[] = ['auto', 'light', 'dark'];

    /**
     * 主题色派生区固定展示的语言（短、彩色 token 多，最能体现派生效果）。
     */
    const ACCENT_SAMPLE = CODE_SAMPLES.css;

    /**
     * 无边框嵌入区的行内示例。
     */
    const INLINE_SAMPLE = `pnpm --filter better-admin-vue add -E prismjs @number-flow/vue`;

    /**
     * 演示场 › 代码块：prismjs 高亮 + CSS 复制反馈（按 rare-ui `code-block` 视觉重写）。
     * 三个区块：多语言高亮（语言 / 主题模式 / 行号 / 高亮行）、主题色派生（单一 hex 派生整套主题）、
     * 无边框嵌入（浮动复制按钮）。全部为前端本地状态，无写库副作用。
     */

    const language = ref<CodeSampleLanguage>('tsx');
    const mode = ref<ThemeMode>('auto');
    const showLineNumbers = ref(true);
    const highlight = ref(false);
    const accent = ref<string>(DEMO_ACCENTS[0]);

    const sample = computed(() => CODE_SAMPLES[language.value]);
    const languageOptions = CODE_SAMPLE_LANGUAGES.map((id) => ({
        id,
        label: id,
    }));
    const modeOptions = computed(() =>
        THEME_MODES.map((id) => ({
            id,
            label: (
                { auto: '跟随页面', dark: '深色', light: '浅色' } as Record<
                    string,
                    string
                >
            )[id],
        })),
    );
</script>

<template>
    <PlaygroundPage :meta="codeBlockMeta">
        <DemoSection
            description="切换语言、主题模式、行号与高亮行；点击右上角按钮复制全文。"
            title="多语言高亮"
        >
            <template #controls>
                <DemoControl label="语言">
                    <DemoSegmented
                        v-model="language"
                        label="语言"
                        :options="languageOptions"
                    />
                </DemoControl>
                <DemoControl label="主题模式">
                    <DemoSegmented
                        v-model="mode"
                        label="主题模式"
                        :options="modeOptions"
                    />
                </DemoControl>
                <DemoSwitch v-model="showLineNumbers" label="行号" />
                <DemoSwitch v-model="highlight" label="高亮 2-4 行" />
            </template>
            <CodeBlock
                :accent="accent"
                :code="sample.code"
                :filename="sample.filename"
                :highlight-lines="highlight ? [2, 3, 4] : undefined"
                :language="language"
                :mode="mode"
                :show-line-numbers="showLineNumbers"
            />
        </DemoSection>

        <DemoSection
            description="只传一个 hex 色值，组件即为浅色与深色各生成一套完整的高亮配色。"
            title="主题色派生"
        >
            <template #controls>
                <DemoControl label="主题色">
                    <DemoColorSwatches
                        v-model="accent"
                        :colors="DEMO_ACCENTS"
                        label="主题色"
                    />
                </DemoControl>
            </template>
            <div class="grid gap-4 lg:grid-cols-2">
                <CodeBlock
                    :accent="accent"
                    :code="ACCENT_SAMPLE.code"
                    :filename="`${ACCENT_SAMPLE.filename} · light`"
                    :show-copy-button="false"
                    language="css"
                    mode="light"
                />
                <CodeBlock
                    :accent="accent"
                    :code="ACCENT_SAMPLE.code"
                    :filename="`${ACCENT_SAMPLE.filename} · dark`"
                    :show-copy-button="false"
                    language="css"
                    mode="dark"
                />
            </div>
        </DemoSection>

        <DemoSection
            description="关闭外框后只渲染代码本体，复制按钮悬浮在右上角，适合嵌入说明文字或表单。"
            title="无边框嵌入"
        >
            <p class="text-sm text-default">安装本页依赖：</p>
            <!--
        单行命令 + 浮动复制按钮：容器给最小高度容纳按钮（overflow-hidden 会裁切）并预留右侧空间；
        viewport 是 flex-1 会撑满高度、代码贴顶，改成 flex + items-center 让代码与按钮同轴居中
      -->
            <div class="rounded-3xl border border-default bg-elevated/60 px-3">
                <CodeBlock
                    :accent="accent"
                    :code="INLINE_SAMPLE"
                    :show-frame="false"
                    :show-line-numbers="false"
                    class="min-h-12 pr-12 [&>div]:flex [&>div]:items-center"
                    language="bash"
                />
            </div>
        </DemoSection>
    </PlaygroundPage>
</template>
