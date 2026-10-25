<script setup lang="ts">
    import type { DictType } from '@/lib/api-types';
    import type { FormSubmitEvent } from '@nuxt/ui';

    import * as z from 'zod';
    import { computed, h, reactive, ref, useTemplateRef, watch } from 'vue';

    import { useToast } from '@nuxt/ui/composables';

    import Spinner from '@/components/ui/spinner/index.vue';

    import {
        createDictType,
        getDictErrorMessage,
        updateDictType,
    } from './dict-api';
    import { DICT_TYPE_CODE_PATTERN } from '@/lib/constants';

    /**
     * 字典类型新增/编辑弹窗：UForm + zod schema 校验（官方范式，@submit 仅在
     * 校验通过后触发，event.data 为校验转换后的值）。
     * - code 仅创建时可填且创建后不可变更（程序标识，风格同角色 code）；
     * - code/name 唯一性由后端 409 拦截（DICT_TYPE_CODE_EXISTS）；
     * - description 清空传 ""（后端部分更新 + ?? 兜底语义，null 被拒绝）。
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
         * 当前实体或展示项的类别。
         */
        type: DictType | null;
    }>();

    const emit = defineEmits<{
        /**
         * 弹窗或抽屉开关变化时回传新值，供父组件同步状态。
         */
        'update:open': [value: boolean];
        /**
         * 记录保存成功后触发，供父组件刷新当前列表或资料。
         */
        saved: [type: DictType, mode: 'create' | 'edit'];
    }>();

    const FORM_ID = 'dict-type-form';
    const CODE_MAX_LENGTH = 50;
    const NAME_MAX_LENGTH = 20;
    const DESCRIPTION_MAX_LENGTH = 200;

    const toast = useToast();

    const isEdit = computed(() => props.mode === 'edit');

    // 表单校验使用中文提示。
    const schema = z
        .object({
            code: z.string().trim(),
            name: z
                .string()
                .trim()
                .min(1, { error: () => '请输入 1-50 字的类型名称' })
                .max(NAME_MAX_LENGTH, {
                    error: () => '请输入 1-50 字的类型名称',
                }),
            description: z.string().trim().max(DESCRIPTION_MAX_LENGTH),
        })
        // code 仅创建时校验（编辑态锁定不可改，superRefine 运行时读取 isEdit）
        .superRefine((data, ctx) => {
            if (!isEdit.value && !DICT_TYPE_CODE_PATTERN.test(data.code)) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['code'],
                    message: '字母开头，仅允许字母、数字、中划线、下划线',
                });
            }
        });

    type Schema = z.output<typeof schema>;

    const state = reactive<Schema>({ code: '', name: '', description: '' });
    const formRef = useTemplateRef('formRef');
    const submitting = ref(false);

    watch(
        () => props.open,
        (open) => {
            if (!open) return;

            state.code = props.type?.code ?? '';
            state.name = props.type?.name ?? '';
            state.description = props.type?.description ?? '';
            formRef.value?.clear();
        },
        { immediate: true },
    );

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

        try {
            const saved = isEdit.value
                ? await updateDictType(props.type!.code, {
                      name: event.data.name,
                      description: event.data.description,
                  })
                : await createDictType({
                      code: event.data.code,
                      name: event.data.name,
                      description: event.data.description,
                  });

            toast.update(savingToast.id, {
                title: isEdit.value ? '字典类型已更新' : '字典类型已创建',
                icon: 'i-lucide-check',
                color: 'success',
            });
            emit('saved', saved, props.mode);
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
        :title="isEdit ? '编辑字典类型' : '新增字典类型'"
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
                <!-- disabled 必须挂在 UInput 上：UFormField 无 disabled prop（不传导输入控件） -->
                <UFormField
                    label="类型编码（code）"
                    name="code"
                    required
                    help="创建后不可修改"
                    :ui="{ help: 'text-xs' }"
                >
                    <UInput
                        v-model="state.code"
                        :disabled="isEdit"
                        :maxlength="CODE_MAX_LENGTH"
                        placeholder="user_status"
                        :ui="{ base: 'pe-13' }"
                        class="w-full"
                    >
                        <template #trailing>
                            <span class="text-dimmed text-xs tabular-nums">
                                {{ state.code.length }}/{{ CODE_MAX_LENGTH }}
                            </span>
                        </template>
                    </UInput>
                </UFormField>

                <UFormField label="类型名称" name="name" required>
                    <UInput
                        v-model="state.name"
                        :maxlength="NAME_MAX_LENGTH"
                        placeholder="如：用户状态"
                        :ui="{ base: 'pe-13' }"
                        class="w-full"
                    >
                        <template #trailing>
                            <span class="text-dimmed text-xs tabular-nums">
                                {{ state.name.length }}/{{ NAME_MAX_LENGTH }}
                            </span>
                        </template>
                    </UInput>
                </UFormField>

                <UFormField label="描述">
                    <div class="flex flex-col gap-1">
                        <UTextarea
                            v-model="state.description"
                            :maxlength="DESCRIPTION_MAX_LENGTH"
                            placeholder="选填，便于理解用途"
                            :rows="4"
                            class="w-full"
                        />
                        <span class="self-end text-xs text-muted">
                            {{ state.description.length }}/{{
                                DESCRIPTION_MAX_LENGTH
                            }}
                        </span>
                    </div>
                </UFormField>
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
