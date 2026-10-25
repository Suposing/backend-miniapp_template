<script setup lang="ts">
    import { computed } from 'vue';

    import { useColorMode } from '@vueuse/core';

    /**
     * 主题切换（明暗模式）：system/light/dark 三态（@vueuse/core，Nuxt UI Vue 集成同源）。
     */
    const colorMode = useColorMode();

    const options = computed<
        {
            /**
             * 图标名称，按当前组件的图标约定渲染。
             */
            icon: string;
            /**
             * 界面展示的中文名称或控件标签。
             */
            label: string;
            /**
             * 当前字段的业务键值或控件值。
             */
            value: 'auto' | 'light' | 'dark';
        }[]
    >(() => [
        {
            icon: 'i-lucide-monitor',
            label: '跟随系统',
            value: 'auto',
        },
        {
            icon: 'i-lucide-sun',
            label: '浅色',
            value: 'light',
        },
        {
            icon: 'i-lucide-moon',
            label: '深色',
            value: 'dark',
        },
    ]);

    const items = computed(() => [
        options.value.map((option) => ({
            label: option.label,
            icon: option.icon,
            onSelect: () => {
                colorMode.value = option.value;
            },
        })),
    ]);

    const currentIcon = computed(
        () =>
            options.value.find((option) => option.value === colorMode.value)
                ?.icon ?? 'i-lucide-monitor',
    );
</script>

<template>
    <UDropdownMenu :items="items">
        <UButton
            :icon="currentIcon"
            aria-label="Theme"
            color="neutral"
            variant="ghost"
        />
    </UDropdownMenu>
</template>
