<script setup lang="ts">
    import { computed } from 'vue';

    import { ENV } from '@/lib/env';

    defineProps<{
        /**
         * 折叠态（侧边栏 icon 模式）只展示 Logo 图标
         */
        collapsed?: boolean;
    }>();

    const appName = computed(() => ENV.appName);
    const brandTitle = computed(() => '用心服务，安心交付');
</script>

<script lang="ts">
    export default { name: 'AppLogo' };
</script>

<template>
    <div class="flex items-center gap-2 overflow-hidden">
        <UIcon
            class="size-6 shrink-0 text-primary"
            name="i-lucide-layout-dashboard"
        />
        <span
            v-if="!collapsed"
            class="truncate text-base font-bold tracking-tight"
        >
            {{ appName }}
        </span>
        <span v-if="!collapsed" class="sr-only">{{ brandTitle }}</span>
    </div>
</template>
