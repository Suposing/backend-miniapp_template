<script setup lang="ts">
    import { computed } from 'vue';

    import PickerLabel from './PickerLabel.vue';
    import PrefOptionGrid from './PrefOptionGrid.vue';

    import {
        type ThemeMode,
        useDesignThemeStore,
    } from '@/stores/design-theme-store';

    /**
     * 主题模式选择器：跟随系统 / 浅色 / 深色，切换经 store 触发方向揭示动画。
     */
    const store = useDesignThemeStore();

    const options = computed(() => [
        {
            value: 'system' as ThemeMode,
            label: '跟随系统',
            icon: 'i-lucide-monitor',
        },
        {
            value: 'light' as ThemeMode,
            label: '浅色',
            icon: 'i-lucide-sun',
        },
        {
            value: 'dark' as ThemeMode,
            label: '深色',
            icon: 'i-lucide-moon',
        },
    ]);

    const model = computed<ThemeMode>({
        get: () => store.themeMode,
        set: (mode) => store.setThemeMode(mode),
    });
</script>

<template>
    <div class="flex flex-col gap-2">
        <PickerLabel
            label-text="主题模式"
            tooltip-text="界面的明暗外观，跟随系统时自动切换"
        />
        <PrefOptionGrid v-model="model" :options="options" :columns="3" />
    </div>
</template>
