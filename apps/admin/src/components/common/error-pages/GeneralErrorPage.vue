<script setup lang="ts">
    import { useRouter } from 'vue-router';

    import IllustrationServerError from './IllustrationServerError.vue';
    import ResultPage from './ResultPage.vue';

    /**
     * 500 服务器错误页：
     * /500 路由与 /exception/500 菜单页共用。
     * 「重试」语义：路由跳转携带 from（history state）时回原 URL 重新渲染；
     * 直接访问 /500（无 from）时整页刷新兜底。与 403/404 的默认双按钮区分。
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

    const router = useRouter();

    function handleRetry() {
        const from = (
            router.options.history.state as {
                /**
                 * 错误页关联的来源路径，用于展示或回退。
                 */
                from?: string;
            }
        ).from;

        if (from) {
            void router.push(from);
        } else {
            window.location.reload();
        }
    }
</script>

<template>
    <ResultPage
        sub-title="页面出错了，请刷新重试；若问题持续存在，请联系管理员。"
        title="出错了"
        :variant="variant"
    >
        <template #actions>
            <UButton label="重试" @click="handleRetry" />
            <UButton
                label="返回首页"
                color="neutral"
                to="/"
                variant="outline"
            />
        </template>
        <template #image>
            <IllustrationServerError />
        </template>
    </ResultPage>
</template>
