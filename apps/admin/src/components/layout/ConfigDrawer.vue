<script setup lang="ts">
    import { ref } from 'vue';

    import { useToast } from '@nuxt/ui/composables';

    import ColorVisionPicker from './prefs/ColorVisionPicker.vue';
    import RadiusPicker from './prefs/RadiusPicker.vue';
    import RouteTransitionPicker from './prefs/RouteTransitionPicker.vue';
    import RouteTransitionSpeedPicker from './prefs/RouteTransitionSpeedPicker.vue';
    import ShowTabsPicker from './prefs/ShowTabsPicker.vue';
    import ThemeColorPicker from './prefs/ThemeColorPicker.vue';
    import ThemeModePicker from './prefs/ThemeModePicker.vue';
    import TransitionDirectionPicker from './prefs/TransitionDirectionPicker.vue';

    import { useDesignThemeStore } from '@/stores/design-theme-store';

    /**
     * 界面外观偏好抽屉，集中展示主题色、明暗、视觉辅助、圆角和转场配置。
     */
    const open = ref(false);
    const resetting = ref(false);

    const toast = useToast();
    const store = useDesignThemeStore();

    async function handleReset() {
        resetting.value = true;

        try {
            await store.resetPreferences();
            toast.add({
                color: 'success',
                title: '已恢复默认设置',
            });
        } finally {
            resetting.value = false;
        }
    }
</script>

<template>
    <USlideover v-model:open="open" title="偏好设置">
        <UButton
            aria-label="偏好设置"
            color="neutral"
            icon="i-lucide-paint-bucket"
            variant="ghost"
            size="sm"
        />

        <template #body>
            <div class="flex flex-col gap-6">
                <ThemeColorPicker />
                <ThemeModePicker />
                <ColorVisionPicker />
                <TransitionDirectionPicker />
                <RouteTransitionPicker />
                <RouteTransitionSpeedPicker />
                <RadiusPicker />
                <ShowTabsPicker />
            </div>
        </template>

        <template #footer>
            <UButton
                block
                color="error"
                icon="i-lucide-rotate-ccw"
                label="重置设置"
                :loading="resetting"
                @click="handleReset"
            />
        </template>
    </USlideover>
</template>
