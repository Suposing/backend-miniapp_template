<script setup lang="ts">
    import type { MenuNode, PermissionItem } from '@/lib/api-types';
    import type {
        AppColumnDef,
        AppTable,
    } from '@/components/data-table/table-types';
    import type {
        ColumnOrderState,
        VisibilityState,
    } from '@tanstack/vue-table';

    import { computed, h, ref, resolveComponent } from 'vue';

    import { useQuery, useQueryClient } from '@tanstack/vue-query';
    import { getCoreRowModel, useVueTable } from '@tanstack/vue-table';
    import { useToast } from '@nuxt/ui/composables';

    const UBadge = resolveComponent('UBadge');
    const UButton = resolveComponent('UButton');
    const UCheckbox = resolveComponent('UCheckbox');
    const UDropdownMenu = resolveComponent('UDropdownMenu');
    const UIcon = resolveComponent('UIcon');

    import {
        deleteMenu,
        fetchManageMenuTree,
        getMenuErrorMessage,
        MENUS_TREE_QUERY_KEY,
    } from './menu-api';

    import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
    import DataTableSearchReset from '@/components/data-table/DataTableSearchReset.vue';
    import DataTableToolbar from '@/components/data-table/DataTableToolbar.vue';
    import LoadingContent from '@/components/ui/loading-content/index.vue';
    import { useColumnSettingKey } from '@/composables/use-column-setting-key';
    import { MENUS_QUERY_KEY } from '@/composables/use-menus';
    import {
        useMenuPermissions,
        usePermissions,
    } from '@/composables/use-permissions';
    import MenuFormModal from './MenuFormModal.vue';

    /**
     * 菜单管理页：管理用全量菜单树的树形表格 + CRUD。
     *
     * - 搜索为后端模糊过滤（菜单名称 / 路径，提交式），结果保留祖先链；
     * - 树形展开：TanStack expanded 模型（getSubRows + expandedRowModel，初始全展开）；
     * - 直接使用 UTable 渲染树形表格（不共用 DataTable，避免破坏其他页面）；
     * - 增删改后失效导航树与管理树两份缓存（导航树必须 exact——["menus"] 是
     *   管理树 key 的前缀，非 exact 会把刚失效在途的管理树取消重发）；
     * - 删除有子菜单的节点由后端 409（MENU_HAS_CHILDREN）拦截。
     */

    const toast = useToast();
    const queryClient = useQueryClient();
    const { canAdd, canEdit, canAddChild, canDelete } = useMenuPermissions();
    const { data: permissionItems } = usePermissions();

    // 搜索（提交式后端过滤）：applied 变化 → queryKey 变化 → 重新请求
    const searchInput = ref('');
    const appliedSearch = ref('');

    // staleTime 0：菜单数据要求强一致；keepPreviousData 搜索切换时保留旧数据
    const { data, isLoading, isFetching } = useQuery({
        queryKey: computed(() => [
            ...MENUS_TREE_QUERY_KEY,
            appliedSearch.value,
        ]),
        queryFn: () => fetchManageMenuTree(appliedSearch.value),
        placeholderData: (previous) => previous,
        staleTime: 0,
    });

    /**
     * 保存/删除后统一失效：当前管理树查询（exact）+ 导航树（exact，防双请求）
     */
    function handleSaved() {
        void queryClient.invalidateQueries({
            queryKey: [...MENUS_TREE_QUERY_KEY, appliedSearch.value],
        });
        void queryClient.invalidateQueries({ queryKey: MENUS_QUERY_KEY });
    }

    function applySearch() {
        appliedSearch.value = searchInput.value.trim();
    }

    function resetSearch() {
        searchInput.value = '';
        appliedSearch.value = '';
    }

    const searchDirty = computed(
        () => searchInput.value.trim() !== appliedSearch.value,
    );
    const canReset = computed(
        () => searchDirty.value || appliedSearch.value !== '',
    );

    // ---------------- 弹窗状态 ----------------
    const formOpen = ref(false);
    const formMode = ref<'create' | 'addChild' | 'edit'>('create');
    const formNode = ref<MenuNode | null>(null);

    const deleteOpen = ref(false);
    const deleteTarget = ref<MenuNode | null>(null);
    const deleting = ref(false);

    function openForm(
        mode: 'create' | 'addChild' | 'edit',
        node: MenuNode | null,
    ) {
        formMode.value = mode;
        formNode.value = node;
        formOpen.value = true;
    }

    async function confirmDelete() {
        if (!deleteTarget.value) return;

        deleting.value = true;

        try {
            await deleteMenu(deleteTarget.value.id);
            handleSaved();
            toast.add({
                color: 'success',
                title: '菜单已删除',
            });
            deleteOpen.value = false;
        } catch (error) {
            toast.add({
                color: 'error',
                title: getMenuErrorMessage(error),
            });
        } finally {
            deleting.value = false;
        }
    }

    // ---------------- 权限位解析（列渲染用） ----------------
    interface GrantedPermission {
        /**
         * 界面展示的用户姓名或昵称。
         */
        displayName: string;
        /**
         * 图标名称，按当前组件的图标约定渲染。
         */
        icon: string;
    }

    function getGrantedPermissions(
        permissions: string,
        items: PermissionItem[],
    ): GrantedPermission[] {
        let bits: bigint;

        try {
            bits = BigInt(permissions || '0');
        } catch {
            return [];
        }

        if (bits === 0n) return [];

        return (items as PermissionItem[])
            .filter((item) => {
                const itemBits = BigInt(item.bits);

                return itemBits !== 0n && (bits & itemBits) === itemBits;
            })
            .map((item) => {
                const key = `features.permissions.items.${item.value}`;
                const name = key;

                return {
                    displayName: name === key ? item.label : name,
                    icon: item.icon,
                };
            });
    }

    // ---------------- 树形表格（expanded 模型，初始全展开） ----------------
    const columns = computed<AppColumnDef<MenuNode>[]>(() => [
        {
            id: 'label',
            enableSorting: false,
            header: () => '菜单名称',
            cell: ({ row }) => {
                const node = row.original as MenuNode;

                return h(
                    'span',
                    {
                        class: 'flex items-center gap-2',
                        style: { paddingInlineStart: `${row.depth * 12}px` },
                    },
                    [
                        row.getCanExpand()
                            ? h(UButton, {
                                  'aria-label': row.getIsExpanded()
                                      ? '折叠'
                                      : '展开',
                                  class: 'shrink-0',
                                  color: 'neutral',
                                  icon: row.getIsExpanded()
                                      ? 'i-lucide-chevron-down'
                                      : 'i-lucide-chevron-right',
                                  size: 'xs',
                                  variant: 'ghost',
                                  onClick: (event: MouseEvent) =>
                                      (
                                          row.getToggleExpandedHandler() as (
                                              e: MouseEvent,
                                          ) => void
                                      )(event),
                              })
                            : h('span', {
                                  class: 'inline-block size-6 shrink-0',
                              }),
                        h(UIcon, {
                            'aria-hidden': true,
                            class: 'text-muted size-4 shrink-0',
                            name: `i-lucide-${node.icon || 'circle'}`,
                        }),
                        h('span', { class: 'font-medium' }, node.label),
                    ],
                );
            },
        },
        {
            id: 'route',
            enableSorting: false,
            header: () => '路由',
            cell: ({ row }) =>
                h(
                    'span',
                    { class: 'text-muted text-sm' },
                    (row.original as MenuNode).to ?? '—',
                ),
        },
        {
            id: 'permissions',
            enableSorting: false,
            header: () => '按钮权限',
            cell: ({ row }) => {
                const node = row.original as MenuNode;
                const granted = getGrantedPermissions(
                    node.permissions,
                    permissionItems.value ?? [],
                );

                if (granted.length === 0) {
                    return h('span', { class: 'text-muted text-sm' }, '—');
                }

                const visible = granted.slice(0, 2);
                const extraCount = granted.length - visible.length;

                return h(
                    'div',
                    {
                        class: 'flex flex-wrap items-center justify-center gap-1',
                    },
                    [
                        ...visible.map((perm) =>
                            h(UBadge, {
                                color: 'neutral',
                                icon: perm.icon
                                    ? `i-lucide-${perm.icon}`
                                    : undefined,
                                label: perm.displayName,
                                variant: 'soft',
                            }),
                        ),
                        extraCount > 0
                            ? h(UBadge, {
                                  color: 'neutral',
                                  label: `+${extraCount}`,
                                  variant: 'soft',
                              })
                            : null,
                    ],
                );
            },
        },
        ...(
            [
                ['keepAlive', '路由保活', 'keepAlive'],
                ['hideInMenu', '侧边栏隐藏', 'hideInMenu'],
                ['enabled', '启用', 'enabled'],
                ['defaultOpen', '默认展开', 'defaultOpen'],
            ] as const
        ).map(([id, labelText, field]) => ({
            id,
            enableSorting: false,
            header: () => labelText,
            cell: ({
                row,
            }: {
                /**
                 * 表格当前行的记录包装。
                 */
                row: {
                    /**
                     * 表格行对应的原始业务记录。
                     */
                    original: MenuNode;
                };
            }) =>
                h(UCheckbox, {
                    disabled: true,
                    'model-value': Boolean((row.original as MenuNode)[field]),
                }),
        })),
        {
            id: 'sort',
            enableSorting: false,
            header: () => '排序',
            cell: ({ row }) =>
                h(UBadge, {
                    color: 'neutral',
                    label: String(row.original.sort),
                    variant: 'soft',
                }),
        },
        {
            id: 'actions',
            enableSorting: false,
            enableHiding: false,
            header: () => '操作',
            cell: ({ row }) => {
                const node = row.original as MenuNode;
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
                        onSelect: () => openForm('edit', node),
                    });
                }
                if (canAddChild.value) {
                    items.push({
                        key: 'addChild',
                        label: '新增子菜单',
                        icon: 'i-lucide-plus',
                        onSelect: () => openForm('addChild', node),
                    });
                }
                if (canDelete.value) {
                    items.push({
                        key: 'delete',
                        label: '删除',
                        icon: 'i-lucide-trash-2',
                        color: 'error',
                        onSelect: () => {
                            deleteTarget.value = node;
                            deleteOpen.value = true;
                        },
                    });
                }

                if (items.length === 0) return null;

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

    /**
     * 树形子行提取函数（透传给 UTable）
     */
    function menuSubRows(row: MenuNode): MenuNode[] | undefined {
        return row.children;
    }

    // ---------------- 列设置（页面级 table 实例 ↔ UTable 内部实例桥接） ----------------
    // 树形表格直接由 UTable 渲染（内部自建 TanStack 实例），此实例只承载列元信息与
    // 列可见性 / 列顺序状态供 DataTableViewOptions 读写，再经 v-model 桥接到 UTable
    // （做法同 DataTable.vue 的 rowSelection 桥接）
    const columnSettingKey = useColumnSettingKey('/settings/menus');

    const table: AppTable<MenuNode> = useVueTable({
        get data() {
            return data.value ?? [];
        },
        get columns() {
            return columns.value;
        },
        getCoreRowModel: getCoreRowModel(),
        getRowId: (row: MenuNode) => row.id,
    });

    const columnVisibility = computed<VisibilityState>({
        get: () => table.getState().columnVisibility,
        set: (value) => table.setColumnVisibility(value),
    });
    const columnOrder = computed<ColumnOrderState>({
        get: () => table.getState().columnOrder,
        set: (value) => table.setColumnOrder(value),
    });
</script>

<template>
    <div class="flex w-full flex-col gap-4">
        <DataTableToolbar :column-setting-key="columnSettingKey" :table="table">
            <UInput
                v-model="searchInput"
                aria-label="按名称 / 路由过滤"
                placeholder="按名称 / 路由过滤"
                class="w-64"
                icon="i-lucide-search"
                @keyup.enter="applySearch"
            />
            <DataTableSearchReset
                :can-reset="canReset"
                :fetching="isFetching"
                @reset="resetSearch"
                @search="applySearch"
            />
            <UButton
                v-if="canAdd"
                label="新增菜单"
                icon="i-lucide-plus"
                variant="outline"
                @click="openForm('create', null)"
            />
        </DataTableToolbar>

        <div class="relative">
            <LoadingContent v-if="isFetching || isLoading" />
            <UTable
                v-model:column-visibility="columnVisibility"
                v-model:column-order="columnOrder"
                sticky
                :loading="isFetching || isLoading"
                :data="data ?? []"
                :columns="columns"
                :get-sub-rows="menuSubRows"
                :get-row-id="(row: MenuNode) => row.id"
                :ui="{
                    thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
                    tr: 'group',
                    td: 'group-has-[td:not(:empty)]:border-b border-default text-start',
                }"
            >
                <template #empty>
                    <div class="flex items-center justify-center w-full">
                        <UEmpty
                            icon="i-lucide-inbox"
                            title="暂无数据"
                            class="ring-0"
                        />
                    </div>
                </template>
            </UTable>
        </div>

        <MenuFormModal
            v-model:open="formOpen"
            :mode="formMode"
            :node="formNode"
            :permission-items="permissionItems ?? []"
            :tree="data ?? []"
            @saved="handleSaved"
        />

        <ConfirmDialog
            v-model:open="deleteOpen"
            :confirm-keyword="deleteTarget?.label"
            confirm-text="删除"
            :description="`确定删除菜单「${deleteTarget?.label ?? ''}」吗？该操作不可恢复。`"
            keyword-label="菜单名称"
            :loading="deleting"
            title="删除菜单"
            destructive
            @confirm="confirmDelete"
        />
    </div>
</template>

<style scoped>
    /*
 * 树形表格：子行通过 getSubRows + expanded 自动展开为独立行，
 * UTable 仍会为每个展开的父行渲染一个空的 expanded <tr>（单个 td[colspan]），
 * 通过 CSS 隐藏该空行（仅影响本页，不破坏其他使用 DataTable 的页面）。
 */
    :deep(table tbody tr:has(> td[colspan]:only-child)) {
        display: none;
    }
</style>
