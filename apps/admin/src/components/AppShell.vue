<script setup lang="ts">
    import { computed } from 'vue';
    import { useRoute } from 'vue-router';
    import { useToast } from '@nuxt/ui/composables';

    import AdminLayout from '@/layouts/AdminLayout.vue';
    import AuthLayout from '@/layouts/AuthLayout.vue';
    import { ApiClientError, setApiErrorHandler } from '@/lib/api-client';
    import { isAdminLayoutRoute, isAuthLayoutPath } from '@/lib/route-access';

    /**
     * 应用外壳，注册 API 错误提示并按路由选择认证、后台或全屏布局。
     */
    const toast = useToast();

    setApiErrorHandler((error) => {
        if (error instanceof ApiClientError && error.status >= 500) {
            toast.add({
                color: 'error',
                title: error.message,
            });
        }
    });

    const route = useRoute();

    const useAdminLayout = computed(() => isAdminLayoutRoute(route));

    // 认证页外壳（React 端 (auth) 路由组对应物）：登录 / 后续注册、忘记密码
    const useAuthLayout = computed(() => isAuthLayoutPath(route.path));
</script>

<template>
    <AuthLayout v-if="useAuthLayout" />
    <AdminLayout v-else-if="useAdminLayout" />
    <RouterView v-else />
</template>
