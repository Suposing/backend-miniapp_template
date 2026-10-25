import type { ComputedRef, Ref } from 'vue';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { AUTH_PERSIST_PATHS } from '@/shared/env';

/**
 * 用户登录态 store 对外返回字段
 */
interface AuthStoreReturn {
    /**
     * 登录 Token（持久化存储）
     */
    accessToken: Ref<string>;
    /**
     * 是否已登录（基于本地 Token）
     */
    isLogin: ComputedRef<boolean>;
    /**
     * 写入登录 Token
     * @param token 登录 Token
     */
    setAccessToken: (token: string) => void;
    /**
     * 退出登录（清空本地 Token）
     */
    logout: () => void;
}

/**
 * 维护模板保留的本地 Token 状态，并按 AUTH_PERSIST_PATHS 持久化。
 * isLogin 只表示本地 Token 非空，不代表服务端验证通过；微信客户登录尚未接入。
 */
export const useAuthStore = defineStore(
    'auth',
    (): AuthStoreReturn => {
        /**
         * 登录 Token（持久化存储）
         */
        const accessToken = ref('');

        /**
         * 是否已登录（基于本地 Token）
         */
        const isLogin = computed(() => Boolean(accessToken.value));

        /**
         * 写入登录 Token
         * @param token 登录 Token
         */
        function setAccessToken(token: string) {
            accessToken.value = token;
        }

        /**
         * 退出登录（清空本地 Token）
         */
        function logout() {
            accessToken.value = '';
        }

        return {
            accessToken,
            isLogin,
            setAccessToken,
            logout,
        };
    },
    {
        persist: {
            pick: [...AUTH_PERSIST_PATHS],
        },
    },
);
