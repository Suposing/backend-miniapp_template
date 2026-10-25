import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
});

it('升级后仍可恢复原有登录缓存，并持久化更新和退出登录', async () => {
    const key = 'app_template:miniapp:auth';
    const storage = new Map([
        [key, JSON.stringify({ accessToken: 'existing-session' })],
    ]);
    vi.stubGlobal('uni', {
        getStorageSync: (name: string) => storage.get(name) ?? '',
        setStorageSync: (name: string, value: string) =>
            storage.set(name, value),
    });

    const { createApp, nextTick } = await import('vue');
    const { default: pinia } = await import('@/modules/pinia');
    const { useAuthStore } = await import('@/stores/auth');
    const app = createApp({});
    app.use(pinia);
    const auth = useAuthStore(pinia);

    expect(auth.accessToken).toBe('existing-session');
    expect(auth.isLogin).toBe(true);

    auth.setAccessToken('renewed-session');
    await nextTick();
    expect(JSON.parse(storage.get(key)!)).toEqual({
        accessToken: 'renewed-session',
    });

    auth.logout();
    await nextTick();
    expect(auth.isLogin).toBe(false);
    expect(JSON.parse(storage.get(key)!)).toEqual({ accessToken: '' });
});
