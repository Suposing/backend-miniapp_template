<script setup lang="ts">
    import { computed, ref, watch } from 'vue';

    /**
     * 受控确认弹窗，可要求输入关键词并展示提交状态。
     * 确认只发出 confirm 事件，保存成功或失败后的关闭时机由父组件决定。
     */
    const props = withDefaults(
        defineProps<{
            /**
             * 由父组件控制的弹窗或抽屉开关。
             */
            open: boolean;
            /**
             * 界面展示的标题。
             */
            title: string;
            /**
             * 支持插值后的完整文案
             */
            description: string | null;
            /**
             * 确认按钮文案。
             */
            confirmText: string;
            /**
             * 是否使用危险操作的确认样式。
             */
            destructive?: boolean;
            /**
             * 需要输入该关键词才能确认；缺省无关键词门槛
             */
            confirmKeyword?: string;
            /**
             * 关键词确认输入框的标签。
             */
            keywordLabel?: string;
            /**
             * 外部 pending 状态
             */
            loading?: boolean;
        }>(),
        {
            destructive: false,
            confirmKeyword: undefined,
            keywordLabel: undefined,
            loading: false,
        },
    );

    const emit = defineEmits<{
        /**
         * 弹窗或抽屉开关变化时回传新值，供父组件同步状态。
         */
        'update:open': [value: boolean];
        /**
         * 满足确认条件后触发；是否关闭弹窗由调用方处理结果。
         */
        confirm: [];
    }>();

    const keywordInput = ref('');
    const isPending = ref(false);

    watch(
        () => props.open,
        (open) => {
            if (open) keywordInput.value = '';
        },
    );

    const keywordOk = computed(
        () =>
            !props.confirmKeyword ||
            keywordInput.value === props.confirmKeyword,
    );

    const busy = computed(() => isPending.value || props.loading);

    function close() {
        emit('update:open', false);
    }

    async function handleConfirm() {
        if (!keywordOk.value || busy.value) return;
        isPending.value = true;
        try {
            emit('confirm');
        } finally {
            isPending.value = false;
        }
    }
</script>

<template>
    <UModal
        :open="open"
        :dismissible="false"
        :title="title"
        :ui="{ content: 'max-w-md', footer: 'justify-end' }"
        @update:open="(value: boolean) => !value && close()"
    >
        <template #body>
            <p class="text-muted text-sm whitespace-pre-line">
                {{ description }}
            </p>

            <UFormField
                v-if="confirmKeyword"
                :label="keywordLabel"
                class="mt-3"
            >
                <UInput
                    v-model="keywordInput"
                    :placeholder="confirmKeyword"
                    class="w-full"
                    autocomplete="off"
                />
            </UFormField>
        </template>

        <template #footer="{ close: onClose }">
            <UButton
                :disabled="busy"
                label="取消"
                color="neutral"
                variant="outline"
                @click="onClose"
            />
            <UButton
                :color="destructive ? 'error' : 'primary'"
                :disabled="!keywordOk || busy"
                :loading="busy || undefined"
                :label="confirmText"
                @click="handleConfirm"
            />
        </template>
    </UModal>
</template>
