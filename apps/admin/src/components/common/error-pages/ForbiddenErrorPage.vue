<script setup lang="ts">
    import IllustrationForbidden from './IllustrationForbidden.vue';
    import ResultPage from './ResultPage.vue';

    /**
     * 403 无权限页：
     * /403 路由与 /exception/403 菜单页共用。
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
        sub-title="你没有执行该操作的权限，如有疑问请联系管理员。"
        title="禁止访问"
        :variant="variant"
    >
        <template #image>
            <IllustrationForbidden />
        </template>
    </ResultPage>
</template>
