import { QueryClient } from '@tanstack/vue-query';

/**
 * 应用共享的服务端查询缓存，统一菜单等数据的请求去重与缓存生命周期。
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            staleTime: 60_000,
            refetchOnWindowFocus: false,
        },
    },
});
