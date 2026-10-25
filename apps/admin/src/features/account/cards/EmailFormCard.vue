<script setup lang="ts">
    import type { AccountProfile } from '@/lib/api-types';
    import type { FormSubmitEvent } from '@nuxt/ui';

    import * as z from 'zod';
    import { reactive, ref } from 'vue';

    import { useToast } from '@nuxt/ui/composables';

    import { getAccountErrorMessage, updateAccountEmail } from '../account-api';

    import PasswordField from '@/components/common/PasswordField.vue';

    /**
     * 邮箱卡：新邮箱 + 当前密码确认（唯一性由后端校验，冲突 409）
     */
    const props = defineProps<{
        /**
         * 当前账号资料快照，保存成功后由父组件刷新。
         */
        profile: AccountProfile;
    }>();

    const emit = defineEmits<{
        /**
         * 记录保存成功后触发，供父组件刷新当前列表或资料。
         */
        saved: [updated: AccountProfile];
    }>();

    const FORM_ID = 'account-email-form';

    const toast = useToast();

    const schema = z
        .object({
            email: z.string(),
            currentPassword: z.string(),
        })
        .superRefine((data, ctx) => {
            if (!z.email().safeParse(data.email.trim()).success) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['email'],
                    message: '请输入合法的邮箱地址',
                });
            }

            if (data.currentPassword.length < 1) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['currentPassword'],
                    message: '请输入当前密码',
                });
            }
        });

    type Schema = z.output<typeof schema>;

    const state = reactive<Schema>({
        email: props.profile.email,
        currentPassword: '',
    });
    const submitting = ref(false);

    async function onSubmit(event: FormSubmitEvent<Schema>) {
        submitting.value = true;

        try {
            const updated = await updateAccountEmail({
                email: event.data.email.trim(),
                currentPassword: event.data.currentPassword,
            });

            toast.add({
                color: 'success',
                title: '邮箱已更新，下次请使用新邮箱登录',
            });
            state.currentPassword = '';
            emit('saved', updated);
        } catch (error) {
            toast.add({ color: 'error', title: getAccountErrorMessage(error) });
        } finally {
            submitting.value = false;
        }
    }
</script>

<template>
    <UCard>
        <template #header>
            <h3 class="font-bold">修改邮箱</h3>
            <p class="text-muted text-xs">
                修改邮箱需验证当前密码，且新邮箱不能与其他账号重复
            </p>
        </template>

        <UForm
            :id="FORM_ID"
            :schema="schema"
            :state="state"
            class="flex flex-col gap-4"
            @submit="onSubmit"
        >
            <UFormField label="新邮箱" name="email">
                <UInput
                    v-model="state.email"
                    :maxlength="254"
                    placeholder="请输入新邮箱地址"
                    autocomplete="email"
                    class="w-full"
                    type="email"
                />
            </UFormField>

            <PasswordField
                v-model="state.currentPassword"
                label="当前密码"
                placeholder="请输入当前密码"
                auto-complete="current-password"
                name="currentPassword"
            />
        </UForm>

        <template #footer>
            <div class="flex justify-end">
                <UButton
                    :form="FORM_ID"
                    :label="submitting ? '更新中…' : '更新邮箱'"
                    :loading="submitting"
                    size="sm"
                    type="submit"
                />
            </div>
        </template>
    </UCard>
</template>
