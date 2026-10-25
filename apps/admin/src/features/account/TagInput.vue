<script lang="ts">
    /**
     * 基于 UInputTags 的个人标签输入。
     * 每项去除首尾空白，最多 10 项、每项 1–20 字符；重复和超限输入显示内联提示。
     */

    export const TAG_MAX_COUNT = 10;
    export const TAG_MAX_LENGTH = 20;
</script>

<script setup lang="ts">
    import { ref } from 'vue';

    const props = withDefaults(
        defineProps<{
            /**
             * 基于 UInputTags 的个人标签输入。
             * 每项去除首尾空白，最多 10 项、每项 1–20 字符；重复和超限输入显示内联提示。
             */
            modelValue: string[];
            /**
             * 字段标签文案
             */
            label: string;
            /**
             * 空值状态显示的输入或选择提示。
             */
            placeholder?: string;
            /**
             * 是否禁用当前控件的交互。
             */
            disabled?: boolean;
        }>(),
        { placeholder: undefined, disabled: false },
    );

    const emit = defineEmits<{
        /**
         * 用户修改或清空控件值时回传新值。
         */
        'update:modelValue': [tags: string[]];
    }>();

    const error = ref<string | null>(null);

    /**
     * 单项去首尾空格（纯空格输入 trim 为空串，由 onUpdate 过滤）
     */
    function trimTag(value: string) {
        return value.trim();
    }

    /**
     * 标签变化：过滤空串后回写（UForm 经 v-model 同步 state.tags），并清除上次错误
     */
    function onUpdate(tags: string[]) {
        emit(
            'update:modelValue',
            tags.filter((tag) => tag !== ''),
        );
        error.value = null;
    }

    /**
     * 添加被拒绝（重复 / 超过数量上限）：区分原因给出内联提示
     */
    function onInvalid(tag: string) {
        error.value = props.modelValue.includes(tag)
            ? '该标签已存在'
            : `最多添加 ${TAG_MAX_COUNT} 个标签`;
    }
</script>

<template>
    <UFormField :error="error ?? false" :label="label">
        <UInputTags
            :convert-value="trimTag"
            :disabled="disabled"
            :max="TAG_MAX_COUNT"
            :max-length="TAG_MAX_LENGTH"
            :model-value="modelValue"
            :placeholder="placeholder"
            class="w-full"
            @invalid="onInvalid"
            @update:model-value="onUpdate"
        />
    </UFormField>
</template>
