<script setup lang="ts">
    import { cn } from '@/lib/cn';

    /**
     * 控件栏内的单个带标签控件。
     */
    defineProps<{
        /**
         * 界面展示的中文名称或控件标签。
         */
        label: string;
        /**
         * 调用方追加的样式类。
         */
        class?: string;
    }>();
</script>

<template>
    <div :class="cn('flex flex-col gap-1.5', $props.class)">
        <span class="text-xs text-muted">{{ label }}</span>
        <slot />
    </div>
</template>
