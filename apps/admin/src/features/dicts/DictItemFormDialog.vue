<script setup lang="ts">
    import type { DictItem } from '@/lib/api-types';
    import type { FormSubmitEvent } from '@nuxt/ui';

    import * as z from 'zod';
    import { computed, h, reactive, ref, useTemplateRef, watch } from 'vue';

    import { useToast } from '@nuxt/ui/composables';

    import Spinner from '@/components/ui/spinner/index.vue';

    import {
        createDictItem,
        getDictErrorMessage,
        updateDictItem,
    } from './dict-api';

    /**
     * 字典项新增/编辑弹窗：UForm + zod schema 校验（官方范式，@submit 仅在
     * 校验通过后触发，event.data 为校验转换后的值）。
     * - value/label 必填（同类型下 value/label 唯一由后端 409 拦截）；
     * - sort 0-999 整数；enabled 开关。
     */
    const props = defineProps<{
        /**
         * 由父组件控制的弹窗或抽屉开关。
         */
        open: boolean;
        /**
         * 当前操作模式，由调用方选择创建、编辑或展示。
         */
        mode: 'create' | 'edit';
        /**
         * 当前操作的记录或列表项。
         */
        item: DictItem | null;
        /**
         * 所属字典类型 code（create 挂载目标）
         */
        typeCode: string;
    }>();

    const emit = defineEmits<{
        /**
         * 弹窗或抽屉开关变化时回传新值，供父组件同步状态。
         */
        'update:open': [value: boolean];
        /**
         * 记录保存成功后触发，供父组件刷新当前列表或资料。
         */
        saved: [];
    }>();

    const FORM_ID = 'dict-item-form';
    const VALUE_MAX_LENGTH = 50;
    const LABEL_MAX_LENGTH = 20;

    const toast = useToast();

    // 表单校验使用中文提示。
    const schema = z.object({
        value: z
            .string()
            .trim()
            .min(1, { error: () => '请输入 1-100 字的键值' })
            .max(VALUE_MAX_LENGTH, {
                error: () => '请输入 1-100 字的键值',
            }),
        label: z
            .string()
            .trim()
            .min(1, { error: () => '请输入 1-100 字的显示名' })
            .max(LABEL_MAX_LENGTH, {
                error: () => '请输入 1-100 字的显示名',
            }),

        sort: z.number(),
        enabled: z.boolean(),
    });

    type Schema = z.output<typeof schema>;

    const state = reactive<Schema>({
        value: '',
        label: '',

        sort: 0,
        enabled: true,
    });
    const formRef = useTemplateRef('formRef');
    const submitting = ref(false);

    watch(
        () => props.open,
        (open) => {
            if (!open) return;

            const item = props.mode === 'edit' ? props.item : null;

            state.value = item?.value ?? '';
            state.label = item?.label ?? '';

            state.sort = item?.sort ?? 0;
            state.enabled = item?.enabled ?? true;
            formRef.value?.clear();
        },
        { immediate: true },
    );

    const isEdit = computed(() => props.mode === 'edit');

    function close() {
        emit('update:open', false);
    }

    async function onSubmit(event: FormSubmitEvent<Schema>) {
        submitting.value = true;

        // toast.promise 形态（对齐 React 端）：保存全程 loading toast，
        // 完成后原位替换为成功/失败；duration 0 保证请求返回前不消失
        //（update 会重置计时回落全局时长）；icon 用 Spinner 组件（toast
        // 内容支持 VNode），自带旋转动画
        const savingToast = toast.add({
            title: '保存中…',
            icon: h(Spinner, { size: 'sm', class: 'mt-0.5' }),
            color: 'info',
            duration: 0,
        });

        const input = {
            value: event.data.value,
            label: event.data.label,

            sort: event.data.sort,
            enabled: event.data.enabled,
        };

        try {
            if (isEdit.value && props.item) {
                await updateDictItem(props.item.id, input);
            } else {
                await createDictItem(props.typeCode, input);
            }

            toast.update(savingToast.id, {
                title: isEdit.value ? '字典项已更新' : '字典项已创建',
                icon: 'i-lucide-check',
                color: 'success',
            });
            emit('saved');
            close();
        } catch (error) {
            toast.update(savingToast.id, {
                title: getDictErrorMessage(error),
                icon: 'i-lucide-x',
                color: 'error',
            });
        } finally {
            submitting.value = false;
        }
    }
</script>

<template>
    <UModal
        :open="open"
        :dismissible="false"
        :title="isEdit ? '编辑字典项' : '新增字典项'"
        :ui="{ content: 'sm:max-w-md', footer: 'justify-end' }"
        @update:open="(value: boolean) => !value && close()"
    >
        <template #body>
            <UForm
                :id="FORM_ID"
                ref="formRef"
                :schema="schema"
                :state="state"
                class="flex flex-col gap-4"
                @submit="onSubmit"
            >
                <UFormField label="键值（value）" name="value" required>
                    <UInput
                        v-model="state.value"
                        :maxlength="VALUE_MAX_LENGTH"
                        placeholder="1"
                        :ui="{ base: 'pe-13' }"
                        class="w-full"
                    >
                        <template #trailing>
                            <span class="text-dimmed text-xs tabular-nums">
                                {{ state.value.length }}/{{ VALUE_MAX_LENGTH }}
                            </span>
                        </template>
                    </UInput>
                </UFormField>

                <UFormField label="显示名" name="label" required>
                    <UInput
                        v-model="state.label"
                        :maxlength="LABEL_MAX_LENGTH"
                        placeholder="如：启用"
                        :ui="{ base: 'pe-13' }"
                        class="w-full"
                    >
                        <template #trailing>
                            <span class="text-dimmed text-xs tabular-nums">
                                {{ state.label.length }}/{{ LABEL_MAX_LENGTH }}
                            </span>
                        </template>
                    </UInput>
                </UFormField>

                <UFormField label="排序">
                    <UInputNumber
                        v-model="state.sort"
                        :min="0"
                        class="w-full"
                    />
                </UFormField>

                <div
                    class="border-default flex items-center justify-between gap-3 rounded-xl border px-3 py-2"
                >
                    <span class="text-sm"> 启用 </span>
                    <USwitch
                        v-model="state.enabled"
                        aria-label="启用"
                        unchecked-icon="i-lucide-x"
                        checked-icon="i-lucide-check"
                    />
                </div>
            </UForm>
        </template>

        <template #footer="{ close: onClose }">
            <UButton
                label="取消"
                color="neutral"
                variant="outline"
                @click="onClose"
            />
            <UButton
                :form="FORM_ID"
                :label="submitting ? '保存中…' : '确认'"
                :loading="submitting"
                type="submit"
            />
        </template>
    </UModal>
</template>
