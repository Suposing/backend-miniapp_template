<script setup lang="ts">
    import type { AccountProfile } from '@/lib/api-types';
    import type { FormSubmitEvent } from '@nuxt/ui';

    import * as z from 'zod';
    import { reactive, ref } from 'vue';

    import { useToast } from '@nuxt/ui/composables';

    import {
        getAccountErrorMessage,
        updateAccountProfile,
    } from '../account-api';
    import TagInput from '../TagInput.vue';

    /**
     * 基本信息卡：username 只读，displayName / phone / tags 可编辑
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

    const FORM_ID = 'account-profile-form';

    const toast = useToast();

    // 长度上限与后端 DTO 对齐（契约 v1.8.1）；手机号收窄为 11 位大陆手机号标准格式
    const DISPLAY_NAME_MAX_LENGTH = 50;
    const PHONE_MAX_LENGTH = 11;
    // 选填：为空合法；填写时必须是 11 位大陆手机号（1 开头，第二位 3-9）
    const PHONE_PATTERN = /^1[3-9]\d{9}$/;

    // 表单校验使用中文提示。
    const schema = z
        .object({
            displayName: z.string(),
            phone: z.string(),
            tags: z.array(z.string()),
        })
        .superRefine((data, ctx) => {
            const displayName = data.displayName.trim();

            if (
                displayName.length < 1 ||
                displayName.length > DISPLAY_NAME_MAX_LENGTH
            ) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['displayName'],
                    message: '显示名称为 1-50 个字符',
                });
            }

            const phone = data.phone.trim();

            if (phone !== '' && !PHONE_PATTERN.test(phone)) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['phone'],
                    message: '请输入 11 位有效手机号',
                });
            }
        });

    type Schema = z.output<typeof schema>;

    // 卡片由页面按 profile.updatedAt 作 key 重建，state 只需在 setup 初始化一次
    const state = reactive<Schema>({
        displayName: props.profile.displayName,
        phone: props.profile.phone ?? '',
        tags: [...props.profile.tags],
    });
    const submitting = ref(false);

    async function onSubmit(event: FormSubmitEvent<Schema>) {
        submitting.value = true;

        try {
            const updated = await updateAccountProfile({
                displayName: event.data.displayName.trim(),
                phone: event.data.phone.trim() ? event.data.phone.trim() : null,
                tags: event.data.tags,
            });

            toast.add({
                color: 'success',
                title: '资料已更新',
            });
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
            <h3 class="font-bold">基本信息</h3>
            <p class="text-muted text-xs">维护你的个人资料与标签</p>
        </template>

        <UForm
            :id="FORM_ID"
            :schema="schema"
            :state="state"
            class="flex flex-col gap-4"
            @submit="onSubmit"
        >
            <UFormField help="登录用户名不可修改" label="用户名">
                <UInput
                    :model-value="profile.username"
                    class="w-full"
                    disabled
                />
            </UFormField>

            <UFormField label="显示名称" name="displayName">
                <!-- trailing 实时字数（与用户表单姓名一致，上限与后端 @Length(1, 50) 对齐） -->
                <UInput
                    v-model="state.displayName"
                    :maxlength="DISPLAY_NAME_MAX_LENGTH"
                    placeholder="请输入显示名称"
                    :ui="{ base: 'pe-13' }"
                    class="w-full"
                >
                    <template #trailing>
                        <span class="text-dimmed text-xs tabular-nums">
                            {{ state.displayName.length }}/{{
                                DISPLAY_NAME_MAX_LENGTH
                            }}
                        </span>
                    </template>
                </UInput>
            </UFormField>

            <UFormField label="电话" name="phone">
                <UInput
                    v-model="state.phone"
                    :maxlength="PHONE_MAX_LENGTH"
                    placeholder="请输入手机号（选填）"
                    class="w-full"
                    inputmode="tel"
                    type="tel"
                />
            </UFormField>

            <TagInput
                v-model="state.tags"
                :disabled="submitting"
                label="个人标签"
                placeholder="输入标签后回车添加（选填）"
            />
        </UForm>

        <template #footer>
            <div class="flex justify-end">
                <UButton
                    :form="FORM_ID"
                    :label="submitting ? '保存中…' : '保存修改'"
                    :loading="submitting"
                    size="sm"
                    type="submit"
                />
            </div>
        </template>
    </UCard>
</template>
