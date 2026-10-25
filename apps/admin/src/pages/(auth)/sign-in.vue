<script setup lang="ts">
    import { computed } from 'vue';

    import { useRoute, useRouter } from 'vue-router';
    import { useToast } from '@nuxt/ui/composables';
    import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui';
    import { useAuthStore } from '@/stores/auth-store';
    const route = useRoute(),
        router = useRouter(),
        auth = useAuthStore(),
        toast = useToast();
    const fields = computed<AuthFormField[]>(() => [
        {
            name: 'username',
            type: 'text',
            label: '用户名',
            placeholder: '请输入用户名',
            required: true,
            icon: 'i-lucide-user',
            autocomplete: 'username',
        },
        {
            name: 'password',
            type: 'password',
            label: '密码',
            placeholder: '请输入密码',
            required: true,
            icon: 'i-lucide-lock',
            autocomplete: 'current-password',
        },
        {
            name: 'remember',
            type: 'checkbox',
            label: '记住我',
            defaultValue: true,
        },
    ]);

    function validate(
        state: Partial<{
            /**
             * 内部账号的登录用户名。
             */
            username: string;
            /**
             * 需要校验或展示强度的密码；只用于当前操作，不记录到日志。
             */
            password: string;
        }>,
    ) {
        const errors: {
            /**
             * 记录或选项的展示名称。
             */
            name: string;
            /**
             * 可展示给使用者的中文错误说明。
             */
            message: string;
        }[] = [];

        if (!state.username?.trim())
            errors.push({
                name: 'username',
                message: '请输入用户名',
            });
        if (!state.password)
            errors.push({
                name: 'password',
                message: '请输入密码',
            });

        return errors;
    }
    async function submit(
        event: FormSubmitEvent<{
            /**
             * 内部账号的登录用户名。
             */
            username: string;
            /**
             * 需要校验或展示强度的密码；只用于当前操作，不记录到日志。
             */
            password: string;
            /**
             * 是否勾选记住我，以决定是否持久化刷新会话。
             */
            remember?: boolean;
        }>,
    ) {
        try {
            await auth.login(
                event.data.username.trim(),
                event.data.password,
                event.data.remember ?? false,
            );
            toast.add({
                color: 'success',
                title: '登录成功，欢迎回来',
            });
            const target = route.query.redirect;

            await router.replace(
                typeof target === 'string' &&
                    target.startsWith('/') &&
                    !target.startsWith('//') &&
                    !target.includes('\\')
                    ? target
                    : '/',
            );
        } catch (error) {
            toast.add({
                color: 'error',
                title:
                    error instanceof Error ? error.message : '登录失败，请重试',
            });
        }
    }
</script>
<template>
    <UPageCard
        class="sign-in-card w-full max-w-sm rounded-3xl shadow-sm backdrop-blur sm:max-w-md"
        variant="outline"
    >
        <UAuthForm
            :fields="fields"
            :validate="validate"
            :loading="auth.isLoading"
            title="欢迎回来"
            description="使用管理员分配的账号登录"
            :submit="{ label: '登 录' }"
            :ui="{
                header: 'gap-2 text-left',
                title: 'text-2xl font-bold tracking-tight',
                description: 'mt-0 text-xs',
                form: 'flex flex-col',
            }"
            @submit="submit"
        />
    </UPageCard>
</template>
