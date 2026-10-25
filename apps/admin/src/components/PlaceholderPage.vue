<script setup lang="ts">
    import { computed } from 'vue';

    /**
     * 占位页（M0：未迁移模块的统一占位；图标 + 页面标题 + 可选描述）。
     * 页面标题和描述由调用方直接传入中文文案。
     */
    const props = withDefaults(
        defineProps<{
            /**
             * lucide 图标名（i-lucide-*）
             */
            icon?: string;
            /**
             * 页面标题
             */
            titleText: string;
            /**
             * 可选描述
             */
            description?: string;
        }>(),
        {
            icon: 'i-lucide-package-open',
            description: undefined,
        },
    );

    const title = computed(() => props.titleText);
</script>

<template>
    <div
        class="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center"
    >
        <UIcon :name="icon" class="size-12 text-dimmed" />
        <h1 class="text-2xl font-bold tracking-tight">{{ title }}</h1>
        <p v-if="description" class="max-w-md text-sm text-muted">
            {{ description }}
        </p>
    </div>
</template>
