<script setup lang="ts">
    /**
     * 带文字标签的开关，Nuxt UI `USwitch` 自带 label 槽位。
     */
    defineProps<{
        /**
         * 界面展示的中文名称或控件标签。
         */
        label: string;
    }>();

    const model = defineModel<boolean>({ required: true });
</script>

<template>
    <USwitch v-model="model" :label="label" size="sm" />
</template>
