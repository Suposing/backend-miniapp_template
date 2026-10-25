<script setup lang="ts">
    import { computed } from 'vue';

    import PickerLabel from './PickerLabel.vue';
    import PrefOptionGrid from './PrefOptionGrid.vue';

    import { useDesignThemeStore } from '@/stores/design-theme-store';
    import {
        COLOR_VISION_MODES,
        type ColorVisionMode,
    } from '@/themes/color-vision';

    const COLOR_VISION_ICONS: Record<ColorVisionMode, string> = {
        normal: 'i-lucide-eye',
        grayscale: 'i-lucide-contrast',
        'color-weak': 'i-lucide-glasses',
    };

    /**
     * 色彩模式选择器：正常 / 灰色 / 色弱（全局滤镜），切换经 store 触发方向揭示动画。
     */
    const store = useDesignThemeStore();

    const options = computed(() =>
        COLOR_VISION_MODES.map(({ id, labelText }) => ({
            value: id,
            label: labelText,
            icon: COLOR_VISION_ICONS[id],
        })),
    );

    const model = computed<ColorVisionMode>({
        get: () => store.colorVision,
        set: (mode) => store.setColorVision(mode),
    });
</script>

<template>
    <div class="flex flex-col gap-2">
        <PickerLabel label-text="色彩模式" tooltip-text="仅调整全局色彩呈现" />
        <PrefOptionGrid v-model="model" :options="options" :columns="3" />
    </div>
</template>
