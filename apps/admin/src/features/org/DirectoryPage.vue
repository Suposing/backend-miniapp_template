<script setup lang="ts">
    import type { DirectoryEntry } from '@/lib/api-types';
    import type { DirectoryListParams } from './directory-api';
    import type {
        AppColumnDef,
        AppTable,
    } from '@/components/data-table/table-types';

    import { computed, h, ref, resolveComponent, watch } from 'vue';

    import { useRoute, useRouter } from 'vue-router';
    import { useQuery } from '@tanstack/vue-query';
    import { keepPreviousData } from '@tanstack/vue-query';
    import { useVueTable } from '@tanstack/vue-table';
    import { getCoreRowModel, getSortedRowModel } from '@tanstack/vue-table';
    import { useToast } from '@nuxt/ui/composables';

    import { DEPTS_TREE_QUERY_KEY, fetchDeptTree } from './dept-api';
    import {
        DIRECTORY_EXPORT_MAX_ROWS,
        DirectoryExportLimitError,
        exportDirectoryExcel,
    } from './directory-export';
    import { DIRECTORY_QUERY_KEY } from './directory-api';
    import DeptTreePanel from './DeptTreePanel.vue';

    import UserInfo from '@/components/common/UserInfo.vue';
    import Spinner from '@/components/ui/spinner/index.vue';
    import DataTable from '@/components/data-table/DataTable.vue';
    import DataTableSearchReset from '@/components/data-table/DataTableSearchReset.vue';
    import DataTableToolbar from '@/components/data-table/DataTableToolbar.vue';
    import { useColumnSettingKey } from '@/composables/use-column-setting-key';
    import { useMenuPermissions } from '@/composables/use-permissions';
    import { useListQuery } from '@/composables/use-list-query';
    import { createListStore } from '@/lib/list-store';

    const UBadge = resolveComponent('UBadge');

    /**
     * 人员通讯录页（阶段 2，）：
     * 左树右表布局。
     *
     * - 左栏组织树点击即筛选（该组织及全部下级组织的人员，递归），
     *   再次点击「全部人员」清除组织筛选；
     * - 组织筛选与 URL Query 双向同步（/org/directory?deptId=xxx）：
     *   架构图谱节点点击跳转的落点，刷新 / 分享 / 前进后退稳定；
     *   防循环口径：URL → store 用「当前值不同才 set」（setFilters 同值幂等兜底），
     *   store → URL 用 router.replace（不塞历史记录）；
     * - 在职状态缺省 employed（离职人员默认不展示，PRD 3.3.5）；
     * - 工具栏支持导出当前筛选结果为 Excel（EXPORT 位门控，见 directory-export.ts）。
     */

    /**
     * 列表 store（模块级单例：导航返回复用同一份分页/筛选状态）
     */
    const directoryListStore = createListStore<{
        /**
         * 所属或筛选组织的内部 ID。
         */
        deptId: string | null;
        /**
         * 在职状态：employed 在职、resigned 离职，与账号启停独立；空值处理由具体接口决定。
         */
        employmentStatus: string | null;
    }>({
        deptId: null,
        // 默认「在职」（离职人员默认不展示）；「全部」(null) 映射后端 all
        employmentStatus: 'employed',
    });

    const toast = useToast();
    const route = useRoute();
    const router = useRouter();
    const { canExport } = useMenuPermissions();

    const store = directoryListStore;

    // 组织树（左栏筛选；与组织/岗位页共享缓存）
    const treeQuery = useQuery({
        queryKey: DEPTS_TREE_QUERY_KEY,
        queryFn: fetchDeptTree,
        placeholderData: keepPreviousData,
        staleTime: 0,
    });
    const tree = computed(() => treeQuery.data.value ?? []);

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
        DirectoryEntry,
        {
            /**
             * 所属或筛选组织的内部 ID。
             */
            deptId: string | null;
            /**
             * 在职状态：employed 在职、resigned 离职，与账号启停独立；空值处理由具体接口决定。
             */
            employmentStatus: string | null;
        }
    >({
        store,
        queryKeyPrefix: DIRECTORY_QUERY_KEY,
        path: '/org/directory',
        // 后端搜索参数名为 keyword（/org/* 统一命名）
        searchParam: 'keyword',
        buildFilters: (f) => ({
            ...(f.deptId ? { deptId: f.deptId } : {}),
            // 「全部」(null) 映射后端 all；store 默认 employed
            employmentStatus: f.employmentStatus ?? 'all',
        }),
    });

    // 搜索（提交式后端过滤：姓名 / 工号 / 登录名）；条件未变化时 submitSearch
    // 走 refetch，搜索按钮即「刷新列表」入口
    const searchInput = ref(store.search);

    function applySearch() {
        submitSearch(searchInput.value.trim());
    }

    const searchDirty = computed(
        () => searchInput.value.trim() !== store.search,
    );

    // URL Query → 列表 store（图谱跳转 / 刷新 / 前进后退恢复组织筛选）
    const urlDeptId = computed<string | null>(() => {
        const value = route.query.deptId;

        return typeof value === 'string' && value !== '' ? value : null;
    });

    watch(
        urlDeptId,
        (value) => {
            if (store.filters.deptId !== value) {
                store.setFilters({ deptId: value });
            }
        },
        { immediate: true },
    );

    // store → URL（页内树点击 / 清除时同步地址栏，保证分享与刷新一致；
    // replace 避免每次点击都塞历史记录）
    function syncDeptIdToUrl(deptId: string | null) {
        void router.replace({ query: { deptId: deptId ?? undefined } });
    }

    function selectDept(node: {
        /**
         * 当前实体或选项的内部标识。
         */
        id: string;
    }) {
        store.setFilters({ deptId: node.id });
        syncDeptIdToUrl(node.id);
    }

    function clearDeptFilter() {
        store.setFilters({ deptId: null });
        syncDeptIdToUrl(null);
    }

    function resetFilters() {
        searchInput.value = '';
        store.reset();
        syncDeptIdToUrl(null);
    }

    // ---------------- 导出 Excel（write-excel-file 触发时动态加载） ----------------
    const isExporting = ref(false);

    async function handleExport() {
        if (isExporting.value) return;

        isExporting.value = true;

        // toast.promise 三段式（对齐既有 toast.update 形态）
        const exportingToast = toast.add({
            title: '正在导出 Excel…',
            icon: h(Spinner, { size: 'sm', class: 'mt-0.5' }),
            color: 'info',
            duration: 0,
        });

        const sortField = store.sorting[0]?.id;

        try {
            const count = await exportDirectoryExcel({
                params: {
                    ...(store.search ? { keyword: store.search } : {}),
                    ...(store.filters.deptId
                        ? { deptId: store.filters.deptId }
                        : {}),
                    employmentStatus: (store.filters.employmentStatus ??
                        'all') as DirectoryListParams['employmentStatus'],
                    ...(sortField
                        ? {
                              sort: sortField,
                              order: store.sorting[0].desc ? 'desc' : 'asc',
                          }
                        : {}),
                },
            });

            toast.update(exportingToast.id, {
                title: `已导出 ${count} 条人员数据`,
                icon: 'i-lucide-check',
                color: 'success',
            });
        } catch (error) {
            toast.update(exportingToast.id, {
                title:
                    error instanceof DirectoryExportLimitError
                        ? `筛选结果超过 ${DIRECTORY_EXPORT_MAX_ROWS} 条，请缩小范围后重试`
                        : error instanceof Error
                          ? error.message
                          : String(error),
                icon: 'i-lucide-x',
                color: 'error',
            });
        } finally {
            isExporting.value = false;
        }
    }

    const employmentOptions = computed(() => [
        // 「全部」由 placeholder 承担（null → 后端 all），选项只给两个具体状态
        { label: '在职', value: 'employed' },
        { label: '离职', value: 'resigned' },
    ]);

    const canReset = computed(
        () =>
            searchDirty.value ||
            store.search !== '' ||
            Boolean(store.filters.deptId) ||
            store.filters.employmentStatus !== 'employed',
    );

    // ---------------- 表格（TanStack vue-table，服务端分页/排序受控） ----------------
    const columns = computed<AppColumnDef<DirectoryEntry>[]>(() => [
        {
            id: 'displayName',
            enableSorting: true,
            header: () => '人员',
            cell: ({ row }) => h(UserInfo, { user: row.original }),
        },
        {
            id: 'employeeNo',
            enableSorting: true,
            header: () => '工号',
            cell: ({ row }) =>
                h(
                    'span',
                    { class: 'font-mono text-sm' },
                    row.original.employeeNo ?? '—',
                ),
        },
        {
            id: 'deptPath',
            enableSorting: false,
            header: () => '所属组织',
            cell: ({ row }) =>
                h('span', { class: 'text-sm' }, row.original.deptPath ?? '—'),
        },
        {
            id: 'mainPostName',
            enableSorting: false,
            header: () => '主岗',
            cell: ({ row }) =>
                h(
                    'span',
                    { class: 'text-sm' },
                    row.original.mainPostName ?? '—',
                ),
        },
        {
            id: 'phone',
            enableSorting: false,
            header: () => '手机号',
            cell: ({ row }) =>
                h('span', { class: 'text-sm' }, row.original.phone ?? '—'),
        },
        {
            id: 'email',
            enableSorting: false,
            header: () => '邮箱',
            cell: ({ row }) =>
                h('span', { class: 'text-sm' }, row.original.email ?? '—'),
        },
        {
            id: 'entryDate',
            enableSorting: true,
            header: () => '入职日期',
            cell: ({ row }) =>
                h('span', { class: 'text-sm' }, row.original.entryDate ?? '—'),
        },
        {
            id: 'employmentStatus',
            enableSorting: false,
            header: () => '在职状态',
            cell: ({ row }) =>
                h(UBadge, {
                    color:
                        row.original.employmentStatus === 'employed'
                            ? 'success'
                            : 'error',
                    label:
                        row.original.employmentStatus === 'employed'
                            ? '在职'
                            : '离职',
                    variant: 'soft',
                }),
        },
    ]);

    const columnSettingKey = useColumnSettingKey('/org/directory');

    const table: AppTable<DirectoryEntry> = useVueTable({
        get data() {
            return data.value;
        },
        get columns() {
            return columns.value;
        },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getRowId: (row: DirectoryEntry) => row.id,
        // 服务端分页 + 服务端排序：状态由列表 store 驱动（受控），仅取数
        manualPagination: true,
        manualSorting: true,
        // pageCount 必须用 getter 实时求值（写死会导致翻页被 clamp）
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
</script>

<script lang="ts">
    export default { name: 'DirectoryPage' };
</script>

<template>
    <div class="flex w-full flex-col">
        <div
            class="grid grid-cols-1 items-start gap-4 lg:grid-cols-[300px_minmax(0,1fr)]"
        >
            <!-- 左栏：组织树面板（与组织管理共用；树点击即筛选组织及下级） -->
            <DeptTreePanel
                empty-title="暂无组织，点击右上角 + 创建"
                :is-loading="treeQuery.isLoading.value"
                :is-fetching="treeQuery.isFetching.value"
                :nodes="tree"
                :selected-id="store.filters.deptId"
                @select="selectDept"
            >
                <template v-if="store.filters.deptId" #header-action>
                    <UButton
                        aria-label="清除组织筛选，显示全部人员"
                        class="p-1"
                        color="neutral"
                        icon="i-lucide-filter-x"
                        size="sm"
                        variant="ghost"
                        @click="clearDeptFilter"
                    />
                </template>
            </DeptTreePanel>

            <!-- 右栏：人员列表 -->
            <div class="flex min-w-0 flex-col gap-4">
                <DataTableToolbar
                    :column-setting-key="columnSettingKey"
                    :table="table"
                >
                    <UInput
                        v-model="searchInput"
                        aria-label="搜索人员"
                        placeholder="搜索人员"
                        class="w-56"
                        icon="i-lucide-search"
                        @keyup.enter="applySearch"
                    />
                    <USelectMenu
                        aria-label="按在职状态筛选"
                        :items="employmentOptions"
                        :model-value="
                            store.filters.employmentStatus ?? undefined
                        "
                        placeholder="在职状态"
                        class="w-36"
                        value-key="value"
                        clear
                        :search-input="false"
                        @update:model-value="
                            (value: unknown) =>
                                store.setFilters({
                                    employmentStatus: value
                                        ? String(value)
                                        : null,
                                })
                        "
                    />
                    <DataTableSearchReset
                        :can-reset="canReset"
                        :fetching="isFetching"
                        @reset="resetFilters"
                        @search="applySearch"
                    />
                    <UButton
                        v-if="canExport"
                        label="导出 Excel"
                        :loading="isExporting"
                        icon="i-lucide-download"
                        variant="outline"
                        @click="handleExport"
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
            </div>
        </div>
    </div>
</template>
