<script setup lang="ts">
    import type { Role } from '@/lib/api-types';
    import type { FormSubmitEvent } from '@nuxt/ui';

    import * as z from 'zod';
    import { computed, h, reactive, ref, useTemplateRef, watch } from 'vue';

    import { useToast } from '@nuxt/ui/composables';

    import { createRole, getRoleErrorMessage, updateRole } from './role-api';

    import Spinner from '@/components/ui/spinner/index.vue';
    import {
        SUPER_ADMIN_ROLE_CODE,
        DICT_TYPE_CODE_PATTERN,
    } from '@/lib/constants';

    /**
     * 角色新增/编辑弹窗：
     * UForm + zod schema 校验（官方范式，@submit 仅在校验通过后触发，
     * event.data 为校验转换后的值）。
     *
     * - code 仅创建时可填且创建后不可变更（角色 code 为程序标识，后端锁定）；
     * - name/code 唯一性由后端 409（ROLE_NAME_EXISTS / ROLE_CODE_EXISTS）拦截；
     * - super_admin 编辑态仅 description 可改（授权/删除另有 403 兜底）。
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
         * edit：被编辑的角色；create：null
         */
        role: Role | null;
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

    const FORM_ID = 'role-form';
    const CODE_MAX_LENGTH = 50;
    const NAME_MAX_LENGTH = 20;
    const DESCRIPTION_MAX_LENGTH = 200;

    const toast = useToast();

    const isEdit = computed(() => props.mode === 'edit');
    const isSuperAdmin = computed(
        () => isEdit.value && props.role?.code === SUPER_ADMIN_ROLE_CODE,
    );

    // 表单校验使用中文提示。
    const schema = z
        .object({
            code: z.string().trim(),
            name: z
                .string()
                .trim()
                .min(1, { error: () => '请输入 1-50 字的角色名称' })
                .max(50, { error: () => '请输入 1-50 字的角色名称' }),
            description: z
                .string()
                .trim()
                .max(200, {
                    error: () => '描述不能超过 200 字',
                }),
            sort: z.number(),
            enabled: z.boolean(),
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

    const state = reactive<Schema>({
        code: '',
        name: '',
        description: '',
        sort: 0,
        enabled: true,
    });
    const formRef = useTemplateRef('formRef');
    const submitting = ref(false);

    watch(
        () => props.open,
        (open) => {
            if (!open) return;

            const role = props.role;

            state.code = role?.code ?? '';
            state.name = role?.name ?? '';
            state.description = role?.description ?? '';
            state.sort = role?.sort ?? 0;
            state.enabled = role?.enabled ?? true;
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
            const input = {
                name: event.data.name,
                description: event.data.description || undefined,
                sort: event.data.sort,
                enabled: event.data.enabled,
            };

            if (isEdit.value && props.role) {
                await updateRole(props.role.id, input);
            } else {
                await createRole({ code: event.data.code, ...input });
            }

            toast.update(savingToast.id, {
                title: isEdit.value ? '角色已更新' : '角色已创建',
                icon: 'i-lucide-check',
                color: 'success',
            });
            emit('saved');
            close();
        } catch (error) {
            toast.update(savingToast.id, {
                title: getRoleErrorMessage(error),
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
        :title="isEdit ? '编辑角色' : '新增角色'"
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
                    label="角色标识（code）"
                    help="创建后不可修改"
                    :ui="{ help: 'text-dimmed text-xs' }"
                    name="code"
                    required
                >
                    <UInput
                        v-model="state.code"
                        :disabled="isEdit"
                        :maxlength="CODE_MAX_LENGTH"
                        placeholder="如：editor"
                        class="w-full"
                        :ui="{ base: 'pe-13' }"
                    >
                        <template #trailing>
                            <span class="text-dimmed text-xs tabular-nums">
                                {{ state.code.length }}/{{ CODE_MAX_LENGTH }}
                            </span>
                        </template>
                    </UInput>
                </UFormField>

                <UFormField label="角色名称" name="name" required>
                    <UInput
                        v-model="state.name"
                        :disabled="isSuperAdmin"
                        :maxlength="NAME_MAX_LENGTH"
                        placeholder="如：编辑者"
                        class="w-full"
                        :ui="{ base: 'pe-13' }"
                    >
                        <template #trailing>
                            <span class="text-dimmed text-xs tabular-nums">
                                {{ state.name.length }}/{{ NAME_MAX_LENGTH }}
                            </span>
                        </template>
                    </UInput>
                </UFormField>

                <UFormField label="描述" name="description">
                    <div class="flex flex-col gap-1">
                        <UTextarea
                            v-model="state.description"
                            :maxlength="DESCRIPTION_MAX_LENGTH"
                            placeholder="选填，便于理解角色定位"
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
                    <span class="text-sm font-medium"> 启用 </span>
                    <USwitch
                        v-model="state.enabled"
                        :disabled="isSuperAdmin"
                        unchecked-icon="i-lucide-x"
                        checked-icon="i-lucide-check"
                        aria-label="启用"
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
