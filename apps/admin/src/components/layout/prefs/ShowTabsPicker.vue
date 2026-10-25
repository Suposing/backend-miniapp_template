<script setup lang="ts">
    import { computed } from 'vue';

    import PickerLabel from './PickerLabel.vue';

    import { useDesignThemeStore } from '@/stores/design-theme-store';

    /**
     * 「显示多标签页」配置项：控制顶栏下方多标签页栏的显隐。
     * 关闭仅隐藏 UI，不清空已打开的标签数据（重新开启后原标签仍在）。
     */
    const store = useDesignThemeStore();

    const model = computed<boolean>({
        get: () => store.showTabs,
        set: (show) => store.setShowTabs(show),
    });
</script>

<template>
    <div class="flex items-center justify-between gap-4">
        <PickerLabel
            label-text="显示多标签页"
            tooltip-text="在顶部下方展示已打开的页面标签，支持快速切换与批量关闭"
        />
        <USwitch
            v-model="model"
            aria-label="显示多标签页"
            checked-icon="i-lucide-check"
            unchecked-icon="i-lucide-x"
        />
    </div>
</template>
