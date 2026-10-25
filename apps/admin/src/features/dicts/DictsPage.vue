<script setup lang="ts">
    import type { DictItem, DictType } from '@/lib/api-types';
    import type { AppColumnDef } from '@/components/data-table/table-types';
    import LoadingContent from '@/components/ui/loading-content/index.vue';
    import { computed, h, ref, resolveComponent } from 'vue';

    import {
        keepPreviousData,
        useQuery,
        useQueryClient,
    } from '@tanstack/vue-query';
    import { useVueTable } from '@tanstack/vue-table';
    import { getCoreRowModel } from '@tanstack/vue-table';
    import { useToast } from '@nuxt/ui/composables';

    const UBadge = resolveComponent('UBadge');
    const UButton = resolveComponent('UButton');
    const UDropdownMenu = resolveComponent('UDropdownMenu');

    import {
        DICT_TYPES_QUERY_KEY,
        deleteDictItem,
        deleteDictType,
        dictItemsQueryKey,
        fetchDictItems,
        fetchDictTypes,
        getDictErrorMessage,
    } from './dict-api';
    import DictItemFormDialog from './DictItemFormDialog.vue';
    import DictTypeFormDialog from './DictTypeFormDialog.vue';
    import DictTypeItem from './DictTypeItem.vue';

    import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
    import DataTable from '@/components/data-table/DataTable.vue';
    import DataTableSearchReset from '@/components/data-table/DataTableSearchReset.vue';
    import DataTableToolbar from '@/components/data-table/DataTableToolbar.vue';
    import { useColumnSettingKey } from '@/composables/use-column-setting-key';
    import { type AppTable } from '@/components/data-table/table-types';
    import { useMenuPermissions } from '@/composables/use-permissions';
    import { useDictStore } from '@/stores/dict-store';

    /**
     * 字典管理页：双栏布局——左栏字典类型，
     * 右栏选中类型的字典项。
     *
     * - 无分页：类型/项均全量拉取 + 前端提交式关键字过滤（量级小）；
     * - 选中类型为派生态（selectedCode 失效自动回退首个，删除后无需手动清理）；
     * - 字典项保存后联动刷新 dict-store（业务页下拉实时更新，复用本次请求结果）；
     * - 删除被引用的类型由后端 409（DICT_TYPE_IN_USE）拦截，toast 透出。
     */

    const toast = useToast();
    const queryClient = useQueryClient();
    const dictStore = useDictStore();
    const { canAdd, canEdit, canDelete } = useMenuPermissions();

    // ---------------- 字典类型（左栏） ----------------
    const typesQuery = useQuery({
        queryKey: DICT_TYPES_QUERY_KEY,
        queryFn: fetchDictTypes,
        staleTime: 0,
    });
    const types = computed(() => typesQuery.data.value ?? []);

    // 选中类型：派生态——selectedCode 不在列表中（被删/未选）时回退首个
    const selectedCode = ref<string | null>(null);
    const activeType = computed(
        () =>
            types.value.find((type) => type.code === selectedCode.value) ??
            types.value[0] ??
            null,
    );

    // 左栏过滤（提交式本地过滤：code / 名称 / 描述）
    const typeSearchInput = ref('');
    const typeSearch = ref('');
    const filteredTypes = computed(() => {
        const normalized = typeSearch.value.trim().toLowerCase();

        if (!normalized) return types.value;

        return types.value.filter((type) =>
            [type.code, type.name, type.description ?? ''].some((text) =>
                text.toLowerCase().includes(normalized),
            ),
        );
    });

    function applyTypeSearch() {
        typeSearch.value = typeSearchInput.value.trim();
    }

    // ---------------- 字典项（右栏） ----------------
    const itemsQuery = useQuery({
        queryKey: computed(() =>
            dictItemsQueryKey(activeType.value?.code ?? ''),
        ),
        queryFn: () => fetchDictItems(activeType.value!.code),
        enabled: computed(() => Boolean(activeType.value)),
        placeholderData: keepPreviousData,
        staleTime: 0,
    });
    const items = computed(() => itemsQuery.data.value ?? []);

    // 右栏过滤（提交式本地过滤：value / label）
    const itemSearchInput = ref('');
    const itemSearch = ref('');
    const filteredItems = computed(() => {
        const normalized = itemSearch.value.trim().toLowerCase();

        if (!normalized) return items.value;

        return items.value.filter((item) =>
            [item.value, item.label].some((text) =>
                text.toLowerCase().includes(normalized),
            ),
        );
    });

    function applyItemSearch() {
        itemSearch.value = itemSearchInput.value.trim();
    }

    function resetItemSearch() {
        itemSearchInput.value = '';
        itemSearch.value = '';
    }

    const itemSearchDirty = computed(
        () => itemSearchInput.value.trim() !== itemSearch.value,
    );
    const canResetItems = computed(
        () => itemSearchDirty.value || itemSearch.value !== '',
    );

    // ---------------- 缓存失效 ----------------
    /**
     * 刷新右栏列表并用本次请求结果回填业务侧字典缓存（单次请求）
     */
    async function refreshItemsAndSync(code: string) {
        await queryClient.invalidateQueries({
            queryKey: dictItemsQueryKey(code),
        });
        const fresh = queryClient.getQueryData<DictItem[]>(
            dictItemsQueryKey(code),
        );

        if (fresh) dictStore.setDict(code, fresh);
    }

    function handleItemSaved() {
        if (activeType.value) void refreshItemsAndSync(activeType.value.code);
    }

    /**
     * 类型保存后：等类型列表刷新完成再切选中（创建场景，右栏 items 只发一次请求）
     */
    async function handleTypeSaved(saved: DictType, mode: 'create' | 'edit') {
        await queryClient.invalidateQueries({ queryKey: DICT_TYPES_QUERY_KEY });

        if (mode === 'create') selectedCode.value = saved.code;
    }

    // ---------------- 弹窗状态 ----------------
    const typeFormOpen = ref(false);
    const typeFormMode = ref<'create' | 'edit'>('create');
    const typeFormType = ref<DictType | null>(null);

    const itemFormOpen = ref(false);
    const itemFormMode = ref<'create' | 'edit'>('create');
    const itemFormItem = ref<DictItem | null>(null);

    const typeDeleteOpen = ref(false);
    const deleteTypeTarget = ref<DictType | null>(null);
    const typeDeleteSubmitting = ref(false);

    const itemDeleteOpen = ref(false);
    const deleteItemTarget = ref<DictItem | null>(null);
    const itemDeleteSubmitting = ref(false);

    function openTypeForm(mode: 'create' | 'edit', type: DictType | null) {
        typeFormMode.value = mode;
        typeFormType.value = type;
        typeFormOpen.value = true;
    }

    function openItemForm(mode: 'create' | 'edit', item: DictItem | null) {
        itemFormMode.value = mode;
        itemFormItem.value = item;
        itemFormOpen.value = true;
    }

    /**
     * 删除类型：失败 toast 透出。成功后清业务侧缓存并失效类型列表，
     * 不 removeQueries——激活中的 items 观察者被移除缓存后会立即重发请求
     * （对已删类型返回 404）；选中态经派生自动回退首个。
     */
    async function confirmDeleteType() {
        if (!deleteTypeTarget.value) return;

        typeDeleteSubmitting.value = true;

        try {
            await deleteDictType(deleteTypeTarget.value.code);
        } catch (error) {
            toast.add({
                color: 'error',
                title: getDictErrorMessage(error),
            });

            return;
        } finally {
            typeDeleteSubmitting.value = false;
        }

        dictStore.clearDict(deleteTypeTarget.value.code);
        await queryClient.invalidateQueries({ queryKey: DICT_TYPES_QUERY_KEY });
        typeDeleteOpen.value = false;
        toast.add({
            color: 'success',
            title: '字典类型已删除',
        });
    }

    async function confirmDeleteItem() {
        if (!deleteItemTarget.value) return;

        itemDeleteSubmitting.value = true;

        try {
            await deleteDictItem(deleteItemTarget.value.id);
        } catch (error) {
            toast.add({
                color: 'error',
                title: getDictErrorMessage(error),
            });

            return;
        } finally {
            itemDeleteSubmitting.value = false;
        }

        if (activeType.value) await refreshItemsAndSync(activeType.value.code);
        itemDeleteOpen.value = false;
        toast.add({
            color: 'success',
            title: '字典项已删除',
        });
    }

    // ---------------- 右栏表格列定义 ----------------
    const columns = computed<AppColumnDef<DictItem>[]>(() => [
        {
            id: 'label',
            enableSorting: false,
            header: () => '显示名',
            cell: ({ row }) =>
                h('span', { class: 'text-sm font-medium' }, row.original.label),
        },
        {
            id: 'value',
            enableSorting: false,
            header: () => '键值',
            cell: ({ row }) =>
                h('span', { class: 'font-mono text-sm' }, row.original.value),
        },
        {
            id: 'sort',
            enableSorting: false,
            header: () => '排序',
            cell: ({ row }) =>
                h('span', { class: 'text-sm tabular-nums' }, row.original.sort),
        },
        {
            id: 'enabled',
            enableSorting: false,
            header: () => '启用',
            cell: ({ row }) =>
                h(UBadge, {
                    color: row.original.enabled ? 'success' : 'error',
                    label: row.original.enabled ? '启用' : '停用',
                    variant: 'soft',
                }),
        },
        {
            id: 'actions',
            enableSorting: false,
            enableHiding: false,
            header: () => '操作',
            cell: ({ row }) => {
                if (!canEdit.value && !canDelete.value) return null;

                const items: Array<{
                    /**
                     * 用于识别当前项的稳定键。
                     */
                    key: string;
                    /**
                     * 界面展示的中文名称或控件标签。
                     */
                    label: string;
                    /**
                     * 图标名称，按当前组件的图标约定渲染。
                     */
                    icon: string;
                    /**
                     * 控件或图形使用的颜色值。
                     */
                    color?: 'error';
                    /**
                     * 选择该操作项时执行的回调。
                     */
                    onSelect: () => void;
                }> = [];

                if (canEdit.value) {
                    items.push({
                        key: 'edit',
                        label: '编辑',
                        icon: 'i-lucide-pencil',
                        onSelect: () => openItemForm('edit', row.original),
                    });
                }
                if (canDelete.value) {
                    items.push({
                        key: 'delete',
                        label: '删除',
                        icon: 'i-lucide-trash-2',
                        color: 'error',
                        onSelect: () => {
                            deleteItemTarget.value = row.original;
                            itemDeleteOpen.value = true;
                        },
                    });
                }

                return h(
                    UDropdownMenu,
                    { items: [items], content: { align: 'center' } },
                    () =>
                        h(UButton, {
                            'aria-label': '操作',
                            color: 'neutral',
                            icon: 'i-lucide-ellipsis',
                            size: 'sm',
                            variant: 'ghost',
                        }),
                );
            },
        },
    ]);

    const columnSettingKey = useColumnSettingKey('/settings/dicts');

    const table: AppTable<DictItem> = useVueTable({
        get data() {
            return filteredItems.value;
        },
        get columns() {
            return columns.value;
        },
        getCoreRowModel: getCoreRowModel(),
        getRowId: (row: DictItem) => row.id,
        // 全量展示：关闭自动分页切片（本页不渲染分页条）
        manualPagination: true,
    });
</script>

<template>
    <div class="flex w-full flex-col">
        <div
            class="grid grid-cols-1 items-start gap-4 lg:grid-cols-[280px_minmax(0,1fr)]"
        >
            <!-- 左栏：字典类型 -->
            <UCard>
                <div class="mb-3 flex items-center justify-between gap-2">
                    <span class="text-sm font-medium">
                        字典类型
                        <span class="text-muted ms-1"
                            >({{ types.length }})</span
                        >
                    </span>
                    <UButton
                        v-if="canAdd"
                        aria-label="新增字典类型"
                        icon="i-lucide-plus"
                        size="sm"
                        variant="outline"
                        @click="openTypeForm('create', null)"
                    />
                </div>
                <UInput
                    v-model="typeSearchInput"
                    aria-label="搜索字典类型"
                    placeholder="搜索字典类型"
                    class="mb-3 w-full"
                    icon="i-lucide-search"
                    @keyup.enter="applyTypeSearch"
                />

                <div
                    v-if="typesQuery.isLoading.value"
                    class="flex flex-col gap-1"
                >
                    <div
                        v-for="index in 5"
                        :key="index"
                        class="flex flex-col gap-1.5 rounded-lg px-3 py-2"
                    >
                        <USkeleton class="h-3.5 w-3/5 rounded-md" />
                        <USkeleton class="h-3 w-2/5 rounded-md" />
                    </div>
                </div>

                <p
                    v-else-if="filteredTypes.length === 0"
                    class="text-muted text-xs"
                >
                    {{ typeSearch ? '未找到匹配的字典类型' : '暂无字典类型' }}
                </p>

                <div v-else class="relative flex flex-col gap-1">
                    <DictTypeItem
                        v-for="type in filteredTypes"
                        :key="type.code"
                        :can-delete="canDelete"
                        :can-edit="canEdit"
                        :is-active="type.code === activeType?.code"
                        :type="type"
                        @delete="
                            deleteTypeTarget = type;
                            typeDeleteOpen = true;
                        "
                        @edit="openTypeForm('edit', type)"
                        @select="selectedCode = type.code"
                    />
                    <LoadingContent v-if="typesQuery.isFetching.value" />
                </div>
            </UCard>

            <!-- 右栏：选中类型的字典项 -->
            <div class="flex min-w-0 flex-col gap-4">
                <UCard>
                    <DataTableToolbar
                        :column-setting-key="columnSettingKey"
                        :table="table"
                    >
                        <UInput
                            v-model="itemSearchInput"
                            aria-label="搜索字典项"
                            placeholder="搜索字典项"
                            class="w-64"
                            icon="i-lucide-search"
                            @keyup.enter="applyItemSearch"
                        />
                        <DataTableSearchReset
                            :can-reset="canResetItems"
                            :fetching="itemsQuery.isFetching.value"
                            @reset="resetItemSearch"
                            @search="applyItemSearch"
                        />
                        <UButton
                            v-if="canAdd"
                            :disabled="!activeType"
                            label="新增字典项"
                            icon="i-lucide-plus"
                            variant="outline"
                            @click="openItemForm('create', null)"
                        />
                    </DataTableToolbar>
                </UCard>

                <DataTable
                    :loading="
                        itemsQuery.isLoading.value ||
                        itemsQuery.isFetching.value
                    "
                    :table="table"
                />
            </div>
        </div>

        <!-- 弹窗集合 -->
        <DictTypeFormDialog
            v-model:open="typeFormOpen"
            :mode="typeFormMode"
            :type="typeFormType"
            @saved="handleTypeSaved"
        />

        <DictItemFormDialog
            v-model:open="itemFormOpen"
            :item="itemFormItem"
            :mode="itemFormMode"
            :type-code="activeType?.code ?? ''"
            @saved="handleItemSaved"
        />

        <ConfirmDialog
            v-model:open="typeDeleteOpen"
            :confirm-keyword="deleteTypeTarget?.code"
            confirm-text="删除"
            :description="`确定删除字典类型「${deleteTypeTarget?.code ?? ''}」吗？该操作不可恢复。`"
            keyword-label="类型编码"
            :loading="typeDeleteSubmitting"
            title="删除字典类型"
            destructive
            @confirm="confirmDeleteType"
        />

        <ConfirmDialog
            v-model:open="itemDeleteOpen"
            confirm-text="删除"
            :description="`确定删除字典项「${deleteItemTarget?.label ?? ''}」吗？该操作不可恢复。`"
            :loading="itemDeleteSubmitting"
            title="删除字典项"
            destructive
            @confirm="confirmDeleteItem"
        />
    </div>
</template>
