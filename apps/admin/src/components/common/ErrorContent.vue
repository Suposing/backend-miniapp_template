<script setup lang="ts">
    /**
     * 区块级错误提示（列表加载失败等）：Alert 样式 + 可选重试按钮，不跳全屏。
     */
    withDefaults(
        defineProps<{
            /**
             * 界面展示的标题。
             */
            title: string;
            /**
             * 重试按钮文案；缺省不渲染按钮
             */
            retryLabel?: string;
        }>(),
        { retryLabel: undefined },
    );

    const emit = defineEmits<{
        /**
         * 用户要求重新加载失败的数据时触发。
         */
        retry: [];
    }>();
</script>

<template>
    <UAlert
        class="my-4"
        color="error"
        icon="i-lucide-circle-alert"
        :title="title"
    >
        <template v-if="retryLabel" #actions>
            <UButton
                :label="retryLabel ?? '重试'"
                color="error"
                size="sm"
                variant="soft"
                @click="emit('retry')"
            />
        </template>
    </UAlert>
</template>
