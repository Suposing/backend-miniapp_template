import { computed } from 'vue';

import { buildColumnSettingKey } from '@/components/data-table/column-setting';
import { useAuthStore } from '@/stores/auth-store';

/**
 * 响应式生成当前用户和路由的列设置键。
 * 未登录时返回 undefined，列设置只在当前组件会话中生效。
 */
export function useColumnSettingKey(routePath: string) {
    const auth = useAuthStore();

    return computed(() =>
        auth.user?.id
            ? buildColumnSettingKey(auth.user.id, routePath)
            : undefined,
    );
}
