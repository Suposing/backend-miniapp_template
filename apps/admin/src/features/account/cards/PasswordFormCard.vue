<script setup lang="ts">
    import type { FormSubmitEvent } from '@nuxt/ui';

    import * as z from 'zod';
    import { reactive, ref } from 'vue';

    import { useToast } from '@nuxt/ui/composables';

    import {
        getAccountErrorMessage,
        updateAccountPassword,
    } from '../account-api';
    import PasswordStrength from '../PasswordStrength.vue';

    import PasswordField from '@/components/common/PasswordField.vue';
    import { getPasswordError } from '@/lib/password-validation';
    import { useAuthStore } from '@/stores/auth-store';

    /**
     * 密码卡：新密码按密码策略预检，
     * 含「不能包含本人用户名」；「不能与当前密码相同」前端无法比对，由后端 400
     * PASSWORD_SAME_AS_OLD 兜底提示。成功后端全端强制下线（tokenVersion+1），
     * 前端清会话跳登录页。
     */
    const FORM_ID = 'account-password-form';

    const toast = useToast();
    const auth = useAuthStore();

    const schema = z
        .object({
            currentPassword: z.string(),
            newPassword: z.string(),
            confirmPassword: z.string(),
        })
        .superRefine((data, ctx) => {
            if (data.currentPassword.length < 1) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['currentPassword'],
                    message: '请输入当前密码',
                });
            }

            const passwordError = getPasswordError(
                data.newPassword,
                auth.user?.username,
            );

            if (passwordError) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['newPassword'],
                    message: (
                        {
                            containsUsername: '新密码不能包含用户名',
                            invalidChars:
                                '新密码只能包含字母、数字和常用符号，不能有空格',
                            missingLetterOrDigit:
                                '新密码必须同时包含字母和数字',
                            tooLong: '新密码不能超过 20 位',
                            tooShort: '新密码至少 8 位',
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

    const state = reactive<Schema>({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const submitting = ref(false);

    async function onSubmit(event: FormSubmitEvent<Schema>) {
        submitting.value = true;

        try {
            await updateAccountPassword({
                currentPassword: event.data.currentPassword,
                newPassword: event.data.newPassword,
            });

            // 本会话已被服务端撤销（tokenVersion+1）：清本地会话 → 登录页
            toast.add({
                color: 'success',
                title: '密码已修改，请重新登录',
            });
            auth.clearSession();
            window.location.assign('/sign-in');
        } catch (error) {
            toast.add({ color: 'error', title: getAccountErrorMessage(error) });
            submitting.value = false;
        }
    }
</script>

<template>
    <UCard>
        <template #header>
            <h3 class="font-bold">修改密码</h3>
            <p class="text-muted text-xs">
                修改密码需验证当前密码；成功后所有登录会话将失效，需要重新登录
            </p>
        </template>

        <UForm
            :id="FORM_ID"
            :schema="schema"
            :state="state"
            class="flex flex-col gap-4"
            @submit="onSubmit"
        >
            <PasswordField
                v-model="state.currentPassword"
                label="当前密码"
                placeholder="请输入当前密码"
                auto-complete="current-password"
                name="currentPassword"
            />

            <div class="flex flex-col gap-1">
                <PasswordField
                    v-model="state.newPassword"
                    description="须同时包含字母和数字，可含特殊符号（不含空格）"
                    label="新密码"
                    placeholder="8-20 位字符"
                    :ui="{ help: 'text-dimmed text-xs' }"
                    auto-complete="new-password"
                    name="newPassword"
                />
                <!-- 5 档强度指示（未输入不渲染，见 PasswordStrength） -->
                <PasswordStrength :password="state.newPassword" />
            </div>

            <PasswordField
                v-model="state.confirmPassword"
                label="确认新密码"
                placeholder="再次输入新密码"
                auto-complete="new-password"
                name="confirmPassword"
            />
        </UForm>

        <template #footer>
            <div class="flex justify-end">
                <UButton
                    :form="FORM_ID"
                    :label="submitting ? '更新中…' : '更新密码'"
                    :loading="submitting"
                    size="sm"
                    type="submit"
                />
            </div>
        </template>
    </UCard>
</template>
