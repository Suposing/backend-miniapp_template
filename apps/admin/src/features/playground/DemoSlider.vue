<script setup lang="ts">
    import { computed } from 'vue';

    import { cn } from '@/lib/cn';

    /**
     * 带输出值的紧凑滑块（单值，遵循当前组件的 `DemoSlider`）。
     * Nuxt UI `USlider` 无 output 槽位，输出值以 `Intl.NumberFormat` 按当前语言格式化后并排展示。
     */
    const props = withDefaults(
        defineProps<{
            /**
             * 界面展示的中文名称或控件标签。
             */
            label: string;
            /**
             * 滑块允许的最小值。
             */
            min: number;
            /**
             * 滑块允许的最大值。
             */
            max: number;
            /**
             * 步长或相邻数据间的间距。
             */
            step?: number;
            /**
             * 数值展示使用的格式化选项。
             */
            formatOptions?: Intl.NumberFormatOptions;
            /**
             * 调用方追加的样式类。
             */
            class?: string;
        }>(),
        { step: 1, formatOptions: undefined, class: undefined },
    );

    const model = defineModel<number>({ required: true });

    const output = computed(() =>
        new Intl.NumberFormat('zh-CN', props.formatOptions).format(model.value),
    );

    function onUpdate(value: number | number[] | undefined) {
        if (value === undefined) return;
        model.value = Array.isArray(value) ? (value[0] ?? model.value) : value;
    }
</script>

<template>
    <div :class="cn('flex w-48 items-center gap-3', props.class)">
        <USlider
            :aria-label="label"
            :max="max"
            :min="min"
            :model-value="model"
            :step="step"
            class="flex-1"
            size="sm"
            @update:model-value="onUpdate"
        />
        <span class="shrink-0 text-xs text-muted tabular-nums">{{
            output
        }}</span>
    </div>
</template>
