<script setup lang="ts">
    import IllustrationNotFound from './IllustrationNotFound.vue';
    import ResultPage from './ResultPage.vue';

    /**
     * 404 页面不存在页：
     * /404 路由与 /exception/404 菜单页共用；亦作未匹配路径的 catch-all 兜底。
     */
    withDefaults(
        defineProps<{
            /**
             * 渲染形态，透传 ResultPage（菜单页用 embedded，错误跳转页默认全屏）
             */
            variant?: 'fullscreen' | 'embedded';
        }>(),
        { variant: 'fullscreen' },
    );
</script>

<template>
    <ResultPage
        sub-title="你访问的页面不存在或已被移除，请检查地址是否正确。"
        title="页面不存在"
        :variant="variant"
    >
        <template #image>
            <IllustrationNotFound />
        </template>
    </ResultPage>
</template>
