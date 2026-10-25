import { watch } from 'vue';
import { useRoute } from 'vue-router';

import { ENV } from '@/lib/env';
import { resolveRouteTitle } from '@/lib/route-access';

/**
 * 根据当前路由同步中文页面标题。
 */
export function useDocumentTitle(): void {
    const route = useRoute();

    watch(
        () => route.path,
        (path) => {
            const title = resolveRouteTitle(path);
            document.title = title ? `${title} - ${ENV.appName}` : ENV.appName;
        },
        { immediate: true },
    );
}
