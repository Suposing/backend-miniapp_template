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

    import { openExternalLink } from '@/lib/profile-links';

    /**
     * 个人链接卡：固定协议/平台前缀的输入框，
     * 存裸值（域名 / 用户名），展示 URL 由前端拼接。
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

    const FORM_ID = 'account-links-form';

    const toast = useToast();

    /**
     * 与后端同规约：先剥协议/平台前缀再校验，空串归一为 null（清空）
     */
    const WEBSITE_PATTERN =
        /^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,63}(?::\d{1,5})?(?:\/\S*)?$/;
    const GITHUB_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;
    const X_PATTERN = /^[a-zA-Z0-9_]{4,15}$/;

    const stripWebsite = (v: string) => v.replace(/^https?:\/\//i, '');
    const stripGithub = (v: string) =>
        v.replace(/^(?:https?:\/\/)?(?:www\.)?github\.com\//i, '');
    const stripX = (v: string) =>
        v.replace(/^(?:https?:\/\/)?(?:www\.)?(?:x|twitter)\.com\//i, '');

    type LinkField = 'website' | 'githubUsername' | 'xUsername';

    const linkFields: {
        /**
         * 记录或选项的展示名称。
         */
        name: LinkField;
        /**
         * 表单字段的中文标签。
         */
        labelText: string;
        /**
         * 展示值之前追加的文本。
         */
        prefix: string;
        /**
         * 空值状态显示的输入或选择提示。
         */
        placeholder: string;
        /**
         * 字段格式校验失败时展示的文案。
         */
        errorText: string;
        /**
         * 输入文本的最大字符数。
         */
        maxLength: number;
        /**
         * 用于验证当前字段格式的正则表达式。
         */
        pattern: RegExp;
        /**
         * 提交前移除平台前缀并归一化输入的回调。
         */
        strip: (v: string) => string;
    }[] = [
        {
            name: 'website',
            labelText: '个人网站',
            prefix: 'https://',
            placeholder: 'baidu.com',
            errorText: '网站格式不正确，示例：baiwumm.com',
            maxLength: 255,
            pattern: WEBSITE_PATTERN,
            strip: stripWebsite,
        },
        {
            name: 'githubUsername',
            labelText: 'GitHub 用户名',
            prefix: 'https://github.com/',
            placeholder: 'baiwumm',
            errorText: 'GitHub 用户名格式不正确（1-39 位字母数字或连字符）',
            maxLength: 60,
            pattern: GITHUB_PATTERN,
            strip: stripGithub,
        },
        {
            name: 'xUsername',
            labelText: 'X 用户名',
            prefix: 'https://x.com/',
            placeholder: 'baiwumm',
            errorText: 'X 用户名格式不正确（4-15 位字母数字或下划线）',
            maxLength: 40,
            pattern: X_PATTERN,
            strip: stripX,
        },
    ];

    // 校验：剥前缀后匹配各自 pattern（空串合法 = 清空）；输出：裸值或 null
    const schema = z
        .object({
            website: z.string(),
            githubUsername: z.string(),
            xUsername: z.string(),
        })
        .superRefine((data, ctx) => {
            for (const field of linkFields) {
                const bare = field.strip(data[field.name].trim());

                if (bare !== '' && !field.pattern.test(bare)) {
                    ctx.addIssue({
                        code: 'custom',
                        path: [field.name],
                        message: field.errorText,
                    });
                }
            }
        })
        .transform((data) => {
            const toBare = (field: (typeof linkFields)[number]) => {
                const bare = field.strip(data[field.name].trim());

                return bare === '' ? null : bare;
            };

            return {
                website: toBare(linkFields[0]!),
                githubUsername: toBare(linkFields[1]!),
                xUsername: toBare(linkFields[2]!),
            };
        });

    type Schema = z.output<typeof schema>;
    type FormState = z.input<typeof schema>;

    const state = reactive<FormState>({
        website: props.profile.website ?? '',
        githubUsername: props.profile.githubUsername ?? '',
        xUsername: props.profile.xUsername ?? '',
    });
    const submitting = ref(false);

    /**
     * 按提交同款规则剥前缀后拼出预览 URL（输入为空返回 null）
     */
    function buildPreviewUrl(
        field: (typeof linkFields)[number],
    ): string | null {
        const bare = field.strip(state[field.name].trim());

        return bare === '' ? null : `${field.prefix}${bare}`;
    }

    function openPreview(field: (typeof linkFields)[number]) {
        const url = buildPreviewUrl(field);

        if (url) openExternalLink(url);
    }

    async function onSubmit(event: FormSubmitEvent<Schema>) {
        submitting.value = true;

        try {
            const updated = await updateAccountProfile(event.data);

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
            <h3 class="font-bold">个人链接</h3>
            <p class="text-muted text-xs">
                填写后将在控制台展示；输入框已含固定前缀，只需填写对应部分
            </p>
        </template>

        <UForm
            :id="FORM_ID"
            :schema="schema"
            :state="state"
            class="flex flex-col gap-4"
            @submit="onSubmit"
        >
            <UFormField
                v-for="field in linkFields"
                :key="field.name"
                :label="field.labelText"
                :name="field.name"
            >
                <UFieldGroup class="w-full">
                    <UBadge
                        :label="field.prefix"
                        class="shrink-0 font-normal"
                        color="neutral"
                        variant="outline"
                    />
                    <UInput
                        v-model="state[field.name]"
                        :maxlength="field.maxLength"
                        :placeholder="field.placeholder"
                        class="flex-1"
                    />
                    <UButton
                        aria-label="新窗口打开"
                        :disabled="buildPreviewUrl(field) === null"
                        color="neutral"
                        icon="i-lucide-external-link"
                        variant="outline"
                        @click="openPreview(field)"
                    />
                </UFieldGroup>
            </UFormField>
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
