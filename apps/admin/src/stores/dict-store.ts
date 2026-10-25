import type { DictItem } from '@/lib/api-types';

import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

import { fetchApi } from '@/lib/api-client';

/**
 * 按字典编码保存应用内存缓存，供筛选和表单共享。
 * 缓存不会自动订阅账号变化，管理页在字典变更后主动更新或清理。
 */
export const useDictStore = defineStore('dict', () => {
    const itemsByCode = ref<Record<string, DictItem[]>>({});
    const loadingByCode = ref<Record<string, boolean>>({});

    /**
     * 加载字典（已缓存直接返回；force=true 强制刷新）。失败抛错不写缓存。
     */
    async function fetchDict(
        typeCode: string,
        force = false,
    ): Promise<DictItem[]> {
        const cached = itemsByCode.value[typeCode];

        if (cached && !force) return cached;

        loadingByCode.value[typeCode] = true;

        try {
            const items = await fetchApi<DictItem[]>(
                `/dict/types/${encodeURIComponent(typeCode)}/items`,
            );

            itemsByCode.value[typeCode] = items;

            return items;
        } finally {
            loadingByCode.value[typeCode] = false;
        }
    }

    /**
     * 清除指定类型缓存（类型被删除后调用，避免残留脏数据）
     */
    function clearDict(typeCode: string) {
        delete itemsByCode.value[typeCode];
    }

    /**
     * 直接写入缓存（字典管理页在自身列表刷新后回填，不重复发请求）
     */
    function setDict(typeCode: string, items: DictItem[]) {
        itemsByCode.value[typeCode] = items;
    }

    /**
     * 强制刷新（404 静默忽略；应改用 clearDict）
     */
    function refreshDict(typeCode: string) {
        void fetchDict(typeCode, true).catch(() => {
            /* 404：类型已被删除 */
        });
    }

    /**
     * 读取指定类型的字典项（响应式）
     */
    const items = (typeCode: string) =>
        computed(() => itemsByCode.value[typeCode] ?? []);

    return {
        itemsByCode,
        loadingByCode,
        fetchDict,
        clearDict,
        setDict,
        refreshDict,
        items,
    };
});
