<script setup lang="ts">
    import { computed } from 'vue';

    import { useFullscreen } from '@vueuse/core';

    /**
     * 全屏切换按钮：
     * useFullscreen 不传 target 默认作用于 document.documentElement，
     * 挂载时状态同步、fullscreenchange 监听与卸载清理均由 VueUse 托管。
     */

    const { isFullscreen, toggle } = useFullscreen();

    const icon = computed(() =>
        isFullscreen.value ? 'i-lucide-minimize' : 'i-lucide-maximize',
    );
    const label = computed(() =>
        isFullscreen.value ? '退出全屏' : '进入全屏',
    );
</script>

<template>
    <UButton
        :aria-label="label"
        :icon="icon"
        color="neutral"
        variant="ghost"
        size="sm"
        @click="toggle"
    />
</template>
