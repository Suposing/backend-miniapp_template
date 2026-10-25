<script setup lang="ts">
    import { computed } from 'vue';

    import PickerLabel from './PickerLabel.vue';
    import PrefOptionGrid from './PrefOptionGrid.vue';

    import { useDesignThemeStore } from '@/stores/design-theme-store';
    import {
        TRANSITION_DIRECTIONS,
        type TransitionDirection,
    } from '@/themes/transition-direction';

    const DIRECTION_ICONS: Record<TransitionDirection, string> = {
        ltr: 'i-lucide-arrow-left-right',
        rtl: 'i-lucide-arrow-right-left',
        ttb: 'i-lucide-arrow-up-down',
        btt: 'i-lucide-arrow-down-up',
    };

    /**
     * 主题动画方向选择器：切换主题色 / 主题模式 / 色彩模式时 clip-path 揭示的方向。
     */
    const store = useDesignThemeStore();

    const options = computed(() =>
        TRANSITION_DIRECTIONS.map(({ id, labelText }) => ({
            value: id,
            label: labelText,
            icon: DIRECTION_ICONS[id],
        })),
    );

    const model = computed<TransitionDirection>({
        get: () => store.transitionDirection,
        set: (direction) => store.setTransitionDirection(direction),
    });
</script>

<template>
    <div class="flex flex-col gap-2">
        <PickerLabel
            label-text="主题动画方向"
            tooltip-text="切换主题色 / 模式时新画面的展开方向"
        />
        <PrefOptionGrid v-model="model" :options="options" :columns="2" />
    </div>
</template>
