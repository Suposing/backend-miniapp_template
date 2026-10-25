<script setup lang="ts">
    import type { User } from '@/lib/api-types';
    import type { FormSubmitEvent } from '@nuxt/ui';

    import * as z from 'zod';
    import { computed, h, reactive, ref, useTemplateRef, watch } from 'vue';

    import { useToast } from '@nuxt/ui/composables';

    import { getUserErrorMessage, resetUserPassword } from './user-api';
    import PasswordField from '@/components/common/PasswordField.vue';

    import Spinner from '@/components/ui/spinner/index.vue';
    import { getPasswordError } from '@/lib/password-validation';

    /**
     * 重置密码弹窗：POST /users/:id/reset-password（RESET_PASSWORD 位）。
     *
     * 后端行为：bcrypt 重新散列 + tokenVersion+1 + 物理清空该用户全部
     * refreshTokens——成功后该用户所有已登录设备即刻下线，需重新登录。
     * 密码策略：格式 + 「不含目标用户名」在前端预检；
     * 「不能与其当前密码相同」由后端 400 PASSWORD_SAME_AS_OLD 兜底。
     */
    const props = defineProps<{
        /**
         * 由父组件控制的弹窗或抽屉开关。
         */
        open: boolean;
        /**
         * 当前用户的安全资料与授权快照。
         */
        user: User | null;
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

    const FORM_ID = 'user-reset-password-form';

    const toast = useToast();

    // 对象级 superRefine（与 UserFormDialog 同构）：密码策略含「不含目标用户名」跨字段项，
    // 用户名在校验时从 props.user 读取；不匹配时错误挂 confirmPassword 字段
    const schema = z
        .object({
            newPassword: z.string(),
            confirmPassword: z.string(),
        })
        .superRefine((data, ctx) => {
            const passwordError = getPasswordError(
                data.newPassword,
                props.user?.username,
            );

            if (passwordError) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['newPassword'],
                    message: (
                        {
                            containsUsername: '密码不能包含用户名',
                            invalidChars:
                                '密码只能包含字母、数字和常用符号，不能有空格',
                            missingLetterOrDigit: '密码必须同时包含字母和数字',
                            tooLong: '密码不能超过 20 位',
                            tooShort: '密码至少 8 位',
                        } as Record<string, string>
                    )[passwordError],
                });
            }

            if (data.newPassword !== data.confirmPassword) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['confirmPassword'],
                    message: '两次输入的密码不一致',
                });
            }
        });

    type Schema = z.output<typeof schema>;

    const state = reactive<Schema>({ newPassword: '', confirmPassword: '' });
    const formRef = useTemplateRef('formRef');
    const submitting = ref(false);

    watch(
        () => props.open,
        (open) => {
            if (open) {
                state.newPassword = '';
                state.confirmPassword = '';
                formRef.value?.clear();
            }
        },
    );

    const displayName = computed(
        () => props.user && (props.user.displayName || props.user.username),
    );

    function close() {
        emit('update:open', false);
    }

    async function onSubmit(event: FormSubmitEvent<Schema>) {
        if (!props.user) return;

        submitting.value = true;

        // toast.promise 形态（对齐 React 端）：重置全程 loading toast，
        // 完成后原位替换为成功/失败；duration 0 保证请求返回前不消失
        //（update 会重置计时回落全局时长）；icon 用 Spinner 组件（toast
        // 内容支持 VNode），自带旋转动画
        const savingToast = toast.add({
            title: '重置中…',
            icon: h(Spinner, { size: 'sm', class: 'mt-0.5' }),
            color: 'info',
            duration: 0,
        });

        try {
            await resetUserPassword(props.user.id, event.data.newPassword);

            toast.update(savingToast.id, {
                title: '密码已重置，该用户全部会话已失效',
                icon: 'i-lucide-check',
                color: 'success',
            });
            emit('saved');
            close();
        } catch (error) {
            toast.update(savingToast.id, {
                title: getUserErrorMessage(error),
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
        title="重置密码"
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
                <p class="text-muted text-sm">
                    {{
                        `为用户「${displayName ?? ''}」设置新密码。重置后该用户所有已登录设备将即刻下线。`
                    }}
                </p>

                <PasswordField
                    v-model="state.newPassword"
                    help="须同时包含字母和数字，可含特殊符号（不含空格）"
                    label="新密码"
                    placeholder="8-20 位"
                    name="newPassword"
                    :ui="{ help: 'text-dimmed text-xs' }"
                />

                <PasswordField
                    v-model="state.confirmPassword"
                    label="确认新密码"
                    placeholder="确认新密码"
                    name="confirmPassword"
                />
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
                :label="submitting ? '重置中…' : '重置密码'"
                :loading="submitting"
                type="submit"
            />
        </template>
    </UModal>
</template>
