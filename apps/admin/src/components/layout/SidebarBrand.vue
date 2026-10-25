<script setup lang="ts">
    import { ENV } from '@/lib/env';
    defineProps<{
        /**
         * 侧边栏是否折叠；折叠时组件使用紧凑展示。
         */
        collapsed?: boolean;
    }>();
</script>
<template>
    <UButton
        to="/"
        color="neutral"
        variant="ghost"
        block
        :square="collapsed"
        aria-label="基础模板控制台"
    >
        <div class="flex items-center gap-2 font-bold text-base">
            <img
                :alt="ENV.appName"
                src="/logo.svg"
                class="size-8 shrink-0 rounded-lg"
            />
            <span v-if="!collapsed">{{ ENV.appName }}</span>
        </div>
    </UButton>
</template>
