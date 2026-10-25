<script setup lang="ts" generic="T extends string">
    import type { TabsItem } from '@nuxt/ui';

    import { computed } from 'vue';

    /**
     * 分段单选：
     * 用 Nuxt UI `UTabs` 的 pill 形态、关闭 content 面板，泛型收敛选项 id。
     */
    const props = defineProps<{
        /**
         * 界面展示的中文名称或控件标签。
         */
        label: string;
        /**
         * 控件供用户选择的候选项列表。
         */
        options: {
            /**
             * 当前实体或选项的内部标识。
             */
            id: T;
            /**
             * 界面展示的中文名称或控件标签。
             */
            label: string;
        }[];
    }>();

    const model = defineModel<T>({ required: true });

    const items = computed<TabsItem[]>(() =>
        props.options.map((option) => ({
            label: option.label,
            value: option.id,
        })),
    );

    function onUpdate(value: string | number) {
        model.value = String(value) as T;
    }
</script>

<template>
    <UTabs
        :aria-label="label"
        :content="false"
        :items="items"
        :model-value="model"
        size="sm"
        @update:model-value="onUpdate"
    />
</template>
