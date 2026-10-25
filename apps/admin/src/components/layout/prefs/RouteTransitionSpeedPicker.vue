<script setup lang="ts">
    import { computed } from 'vue';

    import PickerLabel from './PickerLabel.vue';
    import PrefOptionGrid from './PrefOptionGrid.vue';

    import { useDesignThemeStore } from '@/stores/design-theme-store';
    import {
        ROUTE_TRANSITION_SPEEDS,
        type RouteTransitionSpeedId,
    } from '@/themes/route-transitions';

    const SPEED_ICONS: Record<RouteTransitionSpeedId, string> = {
        slow: 'i-lucide-snail',
        normal: 'i-lucide-gauge',
        fast: 'i-lucide-rabbit',
    };

    /**
     * 页面切换速度选择器：慢 / 标准 / 快（仅作用于页面切换动画的时长倍率）。
     */
    const store = useDesignThemeStore();

    const options = computed(() =>
        ROUTE_TRANSITION_SPEEDS.map(({ id, labelText }) => ({
            value: id,
            label: labelText,
            icon: SPEED_ICONS[id],
        })),
    );

    const model = computed<RouteTransitionSpeedId>({
        get: () => store.routeTransitionSpeed,
        set: (speed) => store.setRouteTransitionSpeed(speed),
    });
</script>

<template>
    <div class="flex flex-col gap-2">
        <PickerLabel
            label-text="页面切换速度"
            tooltip-text="仅作用于页面切换动画"
        />
        <PrefOptionGrid v-model="model" :options="options" :columns="3" />
    </div>
</template>
