<script setup lang="ts">
    /**
     * 偏好设置配置项标题：Label + 可选 Tooltip 说明。
     * 统一替代「Label + Description 常驻描述」的形态，减少抽屉内的视觉噪音。
     */
    defineProps<{
        /**
         * 标题的 中文文案 key
         */
        labelText: string;
        /**
         * 说明文案的 中文文案 key：提供时在标题旁显示 Info 图标，hover 以 Tooltip 展示
         */
        tooltipText?: string;
    }>();
</script>

<template>
    <div class="flex items-center gap-1">
        <span class="text-sm font-medium text-default">{{ labelText }}</span>
        <UTooltip v-if="tooltipText" :text="tooltipText">
            <UIcon
                name="i-lucide-info"
                class="size-3.5 text-muted transition-colors hover:text-default"
                :aria-label="`${labelText}${'说明'}`"
            />
        </UTooltip>
    </div>
</template>
