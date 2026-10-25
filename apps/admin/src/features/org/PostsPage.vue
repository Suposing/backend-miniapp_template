<script setup lang="ts">
    import type { DeptTreeNode, Post } from '@/lib/api-types';
    import type {
        AppColumnDef,
        AppTable,
    } from '@/components/data-table/table-types';

    import { computed, h, ref, resolveComponent } from 'vue';

    import { useQuery, useQueryClient } from '@tanstack/vue-query';
    import { keepPreviousData } from '@tanstack/vue-query';
    import { useVueTable } from '@tanstack/vue-table';
    import { getCoreRowModel, getSortedRowModel } from '@tanstack/vue-table';
    import { useToast } from '@nuxt/ui/composables';

    import { DEPTS_TREE_QUERY_KEY, fetchDeptTree } from './dept-api';
    import {
        POSTS_QUERY_KEY,
        deletePost,
        getPostErrorMessage,
    } from './post-api';
    import DeptTreeSelect from './DeptTreeSelect.vue';
    import PostFormDialog from './PostFormDialog.vue';
    import PostMembersDrawer from './PostMembersDrawer.vue';

    import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
    import DataTable from '@/components/data-table/DataTable.vue';
    import DataTableSearchReset from '@/components/data-table/DataTableSearchReset.vue';
    import DataTableToolbar from '@/components/data-table/DataTableToolbar.vue';
    import { useColumnSettingKey } from '@/composables/use-column-setting-key';
    import { useMenuPermissions } from '@/composables/use-permissions';
    import { useListQuery } from '@/composables/use-list-query';
    import { createListStore } from '@/lib/list-store';

    const UBadge = resolveComponent('UBadge');
    const UButton = resolveComponent('UButton');
    const UDropdownMenu = resolveComponent('UDropdownMenu');

    /**
     * 岗位管理页（阶段 2，）：
     * 筛选区 + 服务端分页表格。
     *
     * - 筛选：所属组织（DeptTreeSelect，含下级组织的岗位）+ 关键词 + 类别 + 状态；
     * - 列表状态入 feature store（keepAlive 友好），由 useListQuery 装配；
     * - 组织树复用 GET /org/depts/tree 查询缓存（与组织管理页同 key）；
     * - 「在职人数」列点击打开成员穿透抽屉；删除由后端在职校验 409 拦截。
     */

    /**
     * 列表 store（模块级单例：导航返回复用同一份分页/筛选状态）
     */
    const postsListStore = createListStore<{
        /**
         * 所属或筛选组织的内部 ID。
         */
        deptId: string | null;
        /**
         * 岗位类别：management 管理、professional 专业、production 生产。
         */
        category: string | null;
        /**
         * 岗位启停状态：enabled 启用、disabled 停用。
         */
        status: string | null;
    }>({
        deptId: null,
        category: null,
        status: null,
    });

    const toast = useToast();
    const queryClient = useQueryClient();
    const { canAdd, canEdit, canDelete } = useMenuPermissions();

    const store = postsListStore;

    // 组织树（所属组织筛选与表单共用；与组织管理页共享缓存）
    const treeQuery = useQuery({
        queryKey: DEPTS_TREE_QUERY_KEY,
        queryFn: fetchDeptTree,
        placeholderData: keepPreviousData,
        staleTime: 0,
    });
    const tree = computed<DeptTreeNode[]>(() => treeQuery.data.value ?? []);

    // ---------------- 列表（服务端分页 + 筛选 + 排序） ----------------
    const {
        data,
        pagination,
        isLoading,
        isFetching,
        isError,
        refetch,
        submitSearch,
    } = useListQuery<
        Post,
        {
            /**
             * 所属或筛选组织的内部 ID。
             */
            deptId: string | null;
            /**
             * 岗位类别：management 管理、professional 专业、production 生产。
             */
            category: string | null;
            /**
             * 岗位启停状态：enabled 启用、disabled 停用。
             */
            status: string | null;
        }
    >({
        store,
        queryKeyPrefix: POSTS_QUERY_KEY,
        path: '/org/posts',
        // 后端搜索参数名为 keyword（/org/* 统一命名）
        searchParam: 'keyword',
        buildFilters: (f) => ({
            ...(f.deptId ? { deptId: f.deptId } : {}),
            ...(f.category ? { category: f.category } : {}),
            ...(f.status ? { status: f.status } : {}),
        }),
    });

    // 搜索（提交式后端过滤：岗位名称）；条件未变化时 submitSearch 走 refetch，
    // 搜索按钮即「刷新列表」入口
    const searchInput = ref(store.search);

    function applySearch() {
        submitSearch(searchInput.value.trim());
    }

    const searchDirty = computed(
        () => searchInput.value.trim() !== store.search,
    );

    function resetFilters() {
        searchInput.value = '';
        store.reset();
    }

    const categoryOptions = computed<
        {
            /**
             * 界面展示的中文名称或控件标签。
             */
            label: string;
            /**
             * 当前字段的业务键值或控件值。
             */
            value: string;
        }[]
    >(() =>
        (['management', 'professional', 'production'] as const).map(
            (value) => ({
                label: (
                    {
                        management: '管理岗',
                        production: '生产岗',
                        professional: '专业岗',
                    } as Record<string, string>
                )[value],
                value,
            }),
        ),
    );
    const statusOptions = computed<
        {
            /**
             * 界面展示的中文名称或控件标签。
             */
            label: string;
            /**
             * 当前字段的业务键值或控件值。
             */
            value: string;
        }[]
    >(() => [
        { label: '启用', value: 'enabled' },
        { label: '停用', value: 'disabled' },
    ]);

    const canReset = computed(
        () =>
            searchDirty.value ||
            store.search !== '' ||
            Boolean(store.filters.deptId) ||
            Boolean(store.filters.category) ||
            Boolean(store.filters.status),
    );

    // ---------------- 弹窗状态 ----------------
    const formOpen = ref(false);
    const formMode = ref<'create' | 'edit'>('create');
    const formPost = ref<Post | null>(null);

    const membersOpen = ref(false);
    const membersTarget = ref<Post | null>(null);

    const deleteOpen = ref(false);
    const deleteTarget = ref<Post | null>(null);
    const deleteSubmitting = ref(false);

    function openForm(mode: 'create' | 'edit', post: Post | null) {
        formMode.value = mode;
        formPost.value = post;
        formOpen.value = true;
    }

    function openMembers(post: Post) {
        membersTarget.value = post;
        membersOpen.value = true;
    }

    /**
     * 列表失效：岗位变化影响组织树在职/岗位计数，一并失效
     */
    function invalidateList() {
        void queryClient.invalidateQueries({ queryKey: POSTS_QUERY_KEY });
        void queryClient.invalidateQueries({ queryKey: DEPTS_TREE_QUERY_KEY });
    }

    async function confirmDelete() {
        if (!deleteTarget.value) return;

        deleteSubmitting.value = true;

        try {
            await deletePost(deleteTarget.value.id);
        } catch (error) {
            toast.add({
                color: 'error',
                title: getPostErrorMessage(error),
            });

            return; // 失败保持弹窗打开（ConfirmDialog 约定）
        } finally {
            deleteSubmitting.value = false;
        }

        invalidateList();
        deleteOpen.value = false;
        toast.add({
            color: 'success',
            title: '岗位删除成功',
        });
    }

    // ---------------- 表格（TanStack vue-table，服务端分页/排序受控） ----------------
    const columns = computed<AppColumnDef<Post>[]>(() => [
        {
            accessorKey: 'name',
            enableSorting: true,
            header: () => '岗位名称',
            cell: ({ row }) =>
                h('span', { class: 'text-sm font-medium' }, row.original.name),
        },
        {
            id: 'deptPath',
            enableSorting: false,
            header: () => '所属组织',
            cell: ({ row }) =>
                h('span', { class: 'text-sm' }, row.original.deptPath || '—'),
        },
        {
            id: 'category',
            enableSorting: false,
            header: () => '岗位类别',
            cell: ({ row }) =>
                h(UBadge, {
                    color: 'neutral',
                    label: (
                        {
                            management: '管理岗',
                            production: '生产岗',
                            professional: '专业岗',
                        } as Record<string, string>
                    )[row.original.category],
                    variant: 'soft',
                }),
        },
        {
            id: 'rank',
            enableSorting: false,
            header: () => '职级',
            cell: ({ row }) =>
                h(
                    'span',
                    { class: 'font-mono text-sm' },
                    row.original.rank || '—',
                ),
        },
        {
            id: 'userCount',
            enableSorting: false,
            header: () => '在职人数',
            cell: ({ row }) =>
                h(
                    'button',
                    {
                        class: 'rounded-md px-2 py-1 text-sm underline-offset-4 transition-colors hover:bg-elevated/60 hover:underline',
                        type: 'button',
                        onClick: () => openMembers(row.original),
                    },
                    String(row.original.userCount),
                ),
        },
        {
            id: 'status',
            enableSorting: false,
            header: () => '状态',
            cell: ({ row }) =>
                h(UBadge, {
                    color:
                        row.original.status === 'enabled' ? 'success' : 'error',
                    label: row.original.status === 'enabled' ? '启用' : '停用',
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
                        onSelect: () => openForm('edit', row.original),
                    });
                }
                if (canDelete.value) {
                    items.push({
                        key: 'delete',
                        label: '删除',
                        icon: 'i-lucide-trash-2',
                        color: 'error',
                        onSelect: () => {
                            deleteTarget.value = row.original;
                            deleteOpen.value = true;
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

    const columnSettingKey = useColumnSettingKey('/org/posts');

    const table: AppTable<Post> = useVueTable({
        get data() {
            return data.value;
        },
        get columns() {
            return columns.value;
        },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getRowId: (row: Post) => row.id,
        // 服务端分页 + 服务端排序：状态由列表 store 驱动（受控），仅取数
        manualPagination: true,
        manualSorting: true,
        // pageCount 必须用 getter 实时求值（对齐 UsersPage：写死会导致翻页被 clamp）
        get pageCount() {
            return Math.max(
                1,
                Math.ceil(pagination.value.total / store.pageSize),
            );
        },
        state: {
            get pagination() {
                return { pageIndex: store.page - 1, pageSize: store.pageSize };
            },
            get sorting() {
                return store.sorting;
            },
        },
        onPaginationChange: (updater) => {
            const next =
                typeof updater === 'function'
                    ? updater({
                          pageIndex: store.page - 1,
                          pageSize: store.pageSize,
                      })
                    : updater;

            if (next.pageSize !== store.pageSize) {
                store.setPageSize(next.pageSize);
            } else {
                store.setPage(next.pageIndex + 1);
            }
        },
        onSortingChange: (updater) => {
            const next =
                typeof updater === 'function'
                    ? updater(store.sorting)
                    : updater;

            store.setSorting(next);
        },
    });

    const deleteDescription = computed(
        () => `确认删除岗位「${deleteTarget.value?.name ?? ''}」吗？`,
    );
</script>

<script lang="ts">
    export default { name: 'PostsPage' };
</script>

<template>
    <div class="flex w-full flex-col gap-4">
        <DataTableToolbar :column-setting-key="columnSettingKey" :table="table">
            <div class="w-56">
                <DeptTreeSelect
                    aria-label="按组织筛选"
                    :model-value="store.filters.deptId ?? ''"
                    placeholder="选择组织"
                    :tree="tree"
                    @update:model-value="
                        (key: unknown) =>
                            store.setFilters({
                                deptId: key ? String(key) : null,
                            })
                    "
                />
            </div>
            <USelectMenu
                aria-label="按类别筛选"
                :items="categoryOptions"
                :model-value="store.filters.category ?? undefined"
                placeholder="岗位类别"
                class="w-36"
                value-key="value"
                clear
                :search-input="false"
                @update:model-value="
                    (value: unknown) =>
                        store.setFilters({
                            category: value ? String(value) : null,
                        })
                "
            />
            <USelectMenu
                aria-label="按状态筛选"
                :items="statusOptions"
                :model-value="store.filters.status ?? undefined"
                placeholder="状态"
                class="w-36"
                value-key="value"
                clear
                :search-input="false"
                @update:model-value="
                    (value: unknown) =>
                        store.setFilters({
                            status: value ? String(value) : null,
                        })
                "
            />
            <UInput
                v-model="searchInput"
                aria-label="搜索岗位名称"
                placeholder="搜索岗位名称"
                class="w-56"
                icon="i-lucide-search"
                @keyup.enter="applySearch"
            />
            <DataTableSearchReset
                :can-reset="canReset"
                :fetching="isFetching"
                @reset="resetFilters"
                @search="applySearch"
            />
            <UButton
                v-if="canAdd"
                label="新增岗位"
                icon="i-lucide-plus"
                variant="outline"
                @click="openForm('create', null)"
            />
        </DataTableToolbar>

        <DataTable
            :is-error="isError"
            :loading="isLoading"
            :refreshing="isFetching && !isLoading"
            :table="table"
            :total="pagination.total"
            @retry="refetch()"
        />

        <PostFormDialog
            v-model:open="formOpen"
            :mode="formMode"
            :post="formPost"
            :tree="tree"
            @saved="invalidateList"
        />

        <PostMembersDrawer v-model:open="membersOpen" :post="membersTarget" />

        <ConfirmDialog
            v-model:open="deleteOpen"
            :confirm-keyword="deleteTarget?.name"
            confirm-text="删除"
            :description="deleteDescription"
            keyword-label="岗位名称"
            :loading="deleteSubmitting"
            title="删除岗位"
            destructive
            @confirm="confirmDelete"
        />
    </div>
</template>
