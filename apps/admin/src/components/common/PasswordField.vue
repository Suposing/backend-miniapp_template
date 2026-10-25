<script setup lang="ts">
    import { computed, ref } from 'vue';

    /**
     * 表单内密码输入框（可见性切换）：带 label / 描述完整字段结构，
     * 供新建/编辑与重置密码弹窗复用。
     * name 传入后错误由 UForm 按字段自动注入；description 走 help 槽
     * （与 error 互斥渲染：报错时自动隐藏辅助说明）。
     */
    withDefaults(
        defineProps<{
            /**
             * 界面展示的中文名称或控件标签。
             */
            label: string;
            /**
             * 由父组件控制的当前值，变化通过 update:modelValue 回传。
             */
            modelValue: string;
            /**
             * UForm 校验字段名（schema 字段路径）
             */
            name?: string;
            /**
             * 空值状态显示的输入或选择提示。
             */
            placeholder?: string;
            /**
             * 无错误时的辅助说明
             */
            description?: string;
            /**
             * 浏览器自动填充提示，透传给密码输入框。
             */
            autoComplete?: string;
        }>(),
        {
            name: undefined,
            autoComplete: 'new-password',
            placeholder: undefined,
            description: undefined,
        },
    );

    const emit = defineEmits<{
        /**
         * 用户修改或清空控件值时回传新值。
         */
        'update:modelValue': [value: string];
        /**
         * 密码输入框失去焦点时触发。
         */
        blur: [];
    }>();

    const isVisible = ref(false);

    const inputType = computed(() => (isVisible.value ? 'text' : 'password'));
    const visibilityIcon = computed(() =>
        isVisible.value ? 'i-lucide-eye-off' : 'i-lucide-eye',
    );
    const visibilityLabel = computed(() =>
        isVisible.value ? '隐藏密码' : '显示密码',
    );
</script>

<template>
    <UFormField :help="description" :label="label" :name="name">
        <UInput
            :autocomplete="autoComplete"
            :placeholder="placeholder"
            :type="inputType"
            :model-value="modelValue"
            class="w-full"
            @update:model-value="
                (value: string) => emit('update:modelValue', value)
            "
            @blur="emit('blur')"
        >
            <template #trailing>
                <UButton
                    :aria-label="visibilityLabel"
                    :icon="visibilityIcon"
                    color="neutral"
                    size="xs"
                    variant="ghost"
                    @click="isVisible = !isVisible"
                />
            </template>
        </UInput>
    </UFormField>
</template>
