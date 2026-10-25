import type { StorageLike } from 'pinia-plugin-persistedstate';
import { createPinia } from 'pinia';
import { createPersistedState } from 'pinia-plugin-persistedstate';
import { PINIA_PERSIST_KEY_PREFIX } from '@/shared/env';

/**
 * 基于 uni-app Storage 的持久化适配（多端一致）。
 * @returns Pinia 持久化所需的同步存储适配器
 */
function createUniStorage(): StorageLike {
    return {
        /**
         * 读取本地缓存（不存在时返回 null）。
         * @param key 存储 key
         * @returns 存储值
         */
        getItem: (key: string) => {
            try {
                const value = uni.getStorageSync(key);

                if (value === undefined || value === null) return null;

                return String(value);
            } catch {
                return null;
            }
        },
        /**
         * 写入本地缓存。
         * @param key 存储 key
         * @param value 存储值（序列化后的字符串）
         */
        setItem: (key: string, value: string) => {
            try {
                uni.setStorageSync(key, value);
            } catch {
                // 写入失败时静默，避免影响主流程
            }
        },
    };
}

const pinia = createPinia();

pinia.use(
    createPersistedState({
        key: (storeKey: string) => `${PINIA_PERSIST_KEY_PREFIX}:${storeKey}`,
        storage: createUniStorage(),
    }),
);

export default pinia;
