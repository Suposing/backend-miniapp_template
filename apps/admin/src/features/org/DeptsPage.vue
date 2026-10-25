<script setup lang="ts">
    import type { DeptSortItem, DeptTreeNode } from '@/lib/api-types';
    import type { AppColumnDef } from '@/components/data-table/table-types';
    import Spinner from '@/components/ui/spinner/index.vue';
    import { computed, h, ref, resolveComponent } from 'vue';

    import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
    import { keepPreviousData } from '@tanstack/vue-query';
    import { useToast } from '@nuxt/ui/composables';
    import { useVueTable } from '@tanstack/vue-table';
    import { getCoreRowModel } from '@tanstack/vue-table';

    import {
        DEPTS_TREE_QUERY_KEY,
        deleteDept,
        fetchDeptTree,
        getDeptErrorMessage,
        sortDepts,
    } from './dept-api';
    import DeptFormDialog from './DeptFormDialog.vue';
    import DeptTreePanel from './DeptTreePanel.vue';

    import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
    import UserInfo from '@/components/common/UserInfo.vue';
    import DataTable from '@/components/data-table/DataTable.vue';
    import DataTableViewOptions from '@/components/data-table/DataTableViewOptions.vue';
    import { type AppTable } from '@/components/data-table/table-types';
    import { useColumnSettingKey } from '@/composables/use-column-setting-key';
    import { useMenuPermissions } from '@/composables/use-permissions';

    /**
     * 组织管理页面，左侧组织树与右侧分页列表共享选择状态，支持组织资料和层级维护。
     */

    const UButton = resolveComponent('UButton');
    const UBadge = resolveComponent('UBadge');
    const UDropdownMenu = resolveComponent('UDropdownMenu');

    const queryClient = useQueryClient();
    const toast = useToast();
    const { canAdd, canEdit, canDelete } = useMenuPermissions();

    // 全量树（含停用组织，左栏置灰）；staleTime 0 保证强一致
    const treeQuery = useQuery({
        queryKey: DEPTS_TREE_QUERY_KEY,
        queryFn: fetchDeptTree,
        placeholderData: keepPreviousData,
        staleTime: 0,
    });
    const tree = computed(() => treeQuery.data.value ?? []);

    // 选中组织：派生态——selectedId 不在树中（被删/未选）时回退顶级首个
    const selectedId = ref<string | null>(null);
    const selectedNode = computed<DeptTreeNode | null>(() => {
        const find = (nodes: DeptTreeNode[]): DeptTreeNode | null => {
            for (const node of nodes) {
                if (node.id === selectedId.value) return node;

                const found = find(node.children);

                if (found) return found;
            }

            return null;
        };

        return find(tree.value) ?? tree.value[0] ?? null;
    });

    function invalidateTree() {
        void queryClient.invalidateQueries({ queryKey: DEPTS_TREE_QUERY_KEY });
    }

    // ---------------- 同级拖拽排序 ----------------

    const reorderMutation = useMutation({
        mutationFn: sortDepts,
        // 成功失败都失效树：失败时同样回拉服务端真实状态，避免本地残留拖拽后的视觉顺序
        onSettled: () => invalidateTree(),
    });

    function handleReorder(items: DeptSortItem[]) {
        // toast.promise 形态（对齐 React 端）：先显示 loading，API 完成后
        // 通过 toast.update 原位替换为成功/失败；duration 0 保证排序接口
        // 返回前 loading 不被全局时长提前移除（update 后回落全局时长）；
        // icon 用 Spinner 组件（toast 内容支持 VNode），自带旋转动画
        const loadingToast = toast.add({
            title: '正在保存排序…',
            icon: h(Spinner, { size: 'sm', class: 'mt-0.5' }),
            color: 'info',
            duration: 0,
        });

        reorderMutation.mutate(items, {
            onSuccess: () => {
                toast.update(loadingToast.id, {
                    title: '排序已更新',
                    icon: 'i-lucide-check',
                    color: 'success',
                });
            },
            onError: (error) => {
                toast.update(loadingToast.id, {
                    title: getDeptErrorMessage(error),
                    icon: 'i-lucide-x',
                    color: 'error',
                });
            },
        });
    }

    // ---------------- 弹窗状态 ----------------

    interface FormContext {
        /**
         * 当前操作模式，由调用方选择创建、编辑或展示。
         */
        mode: 'create' | 'edit';
        /**
         * 当前组织记录及其展示资料。
         */
        dept: DeptTreeNode | null;
        /**
         * create：预设父级（新增子组织）；create-root 为 null
         */
        parentNode: DeptTreeNode | null;
    }

    const formOpen = ref(false);
    const formMode = ref<FormContext['mode']>('create');
    const formDept = ref<DeptTreeNode | null>(null);
    const formParentNode = ref<DeptTreeNode | null>(null);

    const deleteOpen = ref(false);
    const deleteTarget = ref<DeptTreeNode | null>(null);
    const deleteSubmitting = ref(false);

    function openCreateRoot() {
        formMode.value = 'create';
        formDept.value = null;
        formParentNode.value = null;
        formOpen.value = true;
    }

    function openCreateChild(parent: DeptTreeNode) {
        formMode.value = 'create';
        formDept.value = null;
        formParentNode.value = parent;
        formOpen.value = true;
    }

    function openEdit(node: DeptTreeNode) {
        formMode.value = 'edit';
        // 树节点含全部表单回显字段（标量子集），直接传节点
        formDept.value = node;
        formParentNode.value = null;
        formOpen.value = true;
    }

    function openDelete(node: DeptTreeNode) {
        deleteTarget.value = node;
        deleteOpen.value = true;
    }

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteDept(id),
    });

    async function handleDeleteConfirm() {
        if (!deleteTarget.value) return;

        deleteSubmitting.value = true;

        try {
            await deleteMutation.mutateAsync(deleteTarget.value.id);
            invalidateTree();
            deleteOpen.value = false;

            toast.add({
                color: 'success',
                title: '组织删除成功',
            });
        } catch (error) {
            toast.add({
                color: 'error',
                title: getDeptErrorMessage(error),
            });
        } finally {
            deleteSubmitting.value = false;
        }
    }

    // ---------------- 子组织表格列（数据源：选中节点的 children） ----------------

    const childNodes = computed(() => selectedNode.value?.children ?? []);

    const columns = computed<AppColumnDef<DeptTreeNode>[]>(() => [
        {
            id: 'name',
            enableSorting: false,
            header: () => '组织名称',
            cell: ({ row }) =>
                h('span', { class: 'text-sm font-medium' }, row.original.name),
        },
        {
            id: 'code',
            enableSorting: false,
            header: () => '组织编码',
            cell: ({ row }) =>
                h(
                    'span',
                    { class: 'text-sm font-mono' },
                    row.original.code ?? '—',
                ),
        },
        {
            id: 'leaderName',
            enableSorting: false,
            header: () => '负责人',
            // 负责人与侧边栏 / 日志操作人同一展示形式（头像 + 姓名）：树节点只有姓名与
            // 头像，username 复用姓名使 UserInfo 副行与主行相同而不渲染；未设负责人或
            // 其账号已删除（leaderName 为 null）时显示 —
            cell: ({ row }) => {
                const { leaderName, leaderAvatar } = row.original;

                return leaderName
                    ? h(UserInfo, {
                          user: {
                              avatar: leaderAvatar,
                              displayName: leaderName,
                              username: leaderName,
                              email: null,
                          },
                      })
                    : h('span', { class: 'text-muted text-sm' }, '—');
            },
        },
        {
            id: 'childCount',
            enableSorting: false,
            header: () => '下级组织',
            cell: ({ row }) =>
                h(UBadge, { color: 'neutral', variant: 'soft' }, () =>
                    String(row.original.children.length),
                ),
        },
        {
            id: 'status',
            enableSorting: false,
            header: () => '状态',
            cell: ({ row }) =>
                h(
                    UBadge,
                    {
                        color:
                            row.original.status === 'enabled'
                                ? 'success'
                                : 'error',
                        variant: 'soft',
                    },
                    () => (row.original.status === 'enabled' ? '启用' : '停用'),
                ),
        },
        {
            id: 'actions',
            enableSorting: false,
            enableHiding: false,
            header: () => '操作',
            cell: ({ row }) => {
                if (!canAdd.value && !canEdit.value && !canDelete.value)
                    return null;

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

                if (canAdd.value) {
                    items.push({
                        key: 'add',
                        label: '新增子组织',
                        icon: 'i-lucide-plus',
                        onSelect: () => openCreateChild(row.original),
                    });
                }
                if (canEdit.value) {
                    items.push({
                        key: 'edit',
                        label: '编辑',
                        icon: 'i-lucide-pencil',
                        onSelect: () => openEdit(row.original),
                    });
                }
                if (canDelete.value) {
                    items.push({
                        key: 'delete',
                        label: '删除',
                        icon: 'i-lucide-trash-2',
                        color: 'error',
                        onSelect: () => openDelete(row.original),
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

    const columnSettingKey = useColumnSettingKey('/org/depts');

    const table: AppTable<DeptTreeNode> = useVueTable({
        get data() {
            return childNodes.value;
        },
        get columns() {
            return columns.value;
        },
        getCoreRowModel: getCoreRowModel(),
        getRowId: (row: DeptTreeNode) => row.id,
        // 全量展示：子组织列表随树派生，不渲染分页条
        manualPagination: true,
    });

    const deleteDescription = computed(
        () => `确认删除组织「${deleteTarget.value?.name ?? ''}」吗？`,
    );
</script>

<template>
    <div
        class="grid grid-cols-1 items-start gap-4 lg:grid-cols-[300px_minmax(0,1fr)]"
    >
        <!-- 左栏：组织树面板（与人员通讯录共用） -->
        <DeptTreePanel
            :can-reorder="canEdit && !reorderMutation.isPending.value"
            :is-fetching="treeQuery.isFetching.value"
            :is-loading="treeQuery.isLoading.value"
            :is-pending="reorderMutation.isPending.value"
            :nodes="tree"
            :selected-id="selectedNode?.id ?? null"
            empty-title="暂无组织，点击右上角 + 创建"
            @reorder="handleReorder"
            @select="(node) => (selectedId = node.id)"
        >
            <template v-if="canAdd" #header-action>
                <UButton
                    aria-label="新增顶级组织"
                    class="p-1"
                    color="neutral"
                    icon="i-lucide-plus"
                    size="sm"
                    variant="outline"
                    @click="openCreateRoot"
                />
            </template>
            <template v-if="canAdd" #empty-action>
                <UButton
                    color="neutral"
                    icon="i-lucide-plus"
                    size="sm"
                    variant="outline"
                    @click="openCreateRoot"
                >
                    新增顶级组织
                </UButton>
            </template>
        </DeptTreePanel>

        <!-- 右栏：选中组织详情 + 子组织列表 -->
        <div class="flex min-w-0 flex-col gap-4">
            <UCard class="flex flex-col gap-3" variant="outline">
                <template v-if="selectedNode">
                    <div
                        class="flex flex-wrap items-center justify-between gap-2"
                    >
                        <div class="flex min-w-0 items-center gap-2">
                            <span class="truncate text-sm font-semibold">
                                {{ selectedNode.name }}
                            </span>
                            <UBadge
                                :color="
                                    selectedNode.status === 'enabled'
                                        ? 'success'
                                        : 'error'
                                "
                                variant="soft"
                            >
                                {{
                                    selectedNode.status === 'enabled'
                                        ? '启用'
                                        : '停用'
                                }}
                            </UBadge>
                        </div>
                        <!-- 允许换行：窄屏/长名称时按钮折行右对齐，不挤压左侧标题区 -->
                        <div
                            class="flex flex-wrap items-center justify-end gap-2"
                        >
                            <UButton
                                v-if="canAdd"
                                size="sm"
                                @click="openCreateChild(selectedNode)"
                            >
                                <UIcon class="size-4" name="i-lucide-plus" />
                                新增子组织
                            </UButton>
                            <UButton
                                v-if="canEdit"
                                color="neutral"
                                size="sm"
                                variant="subtle"
                                @click="openEdit(selectedNode)"
                            >
                                <UIcon class="size-4" name="i-lucide-pencil" />
                                编辑
                            </UButton>
                            <UButton
                                v-if="canDelete"
                                color="error"
                                size="sm"
                                variant="subtle"
                                @click="openDelete(selectedNode)"
                            >
                                <UIcon class="size-4" name="i-lucide-trash-2" />
                                删除
                            </UButton>
                            <DataTableViewOptions
                                :storage-key="columnSettingKey"
                                :table="table"
                                size="sm"
                            />
                        </div>
                    </div>
                    <div
                        class="text-muted flex flex-wrap gap-x-6 gap-y-1 text-sm"
                    >
                        <span>
                            组织编码：
                            <span class="font-mono">{{
                                selectedNode.code ?? '—'
                            }}</span>
                        </span>
                        <span>
                            负责人：
                            {{ selectedNode.leaderName ?? '—' }}
                        </span>
                        <span>
                            {{
                                `${selectedNode.children.length} 个直接下级组织`
                            }}
                        </span>
                    </div>
                </template>
                <div
                    v-else
                    class="text-muted flex flex-col items-center justify-center gap-2 py-10"
                >
                    <p class="text-sm">在左侧选择组织查看详情</p>
                </div>
            </UCard>

            <!-- 子组织列表（与详情卡留出呼吸间距，页面底部有 pb-8） -->
            <div class="flex min-w-0 flex-col">
                <DataTable
                    :loading="treeQuery.isLoading.value"
                    :table="table"
                />
            </div>
        </div>
    </div>

    <!-- 弹窗集合 -->
    <DeptFormDialog
        v-model:open="formOpen"
        :dept="formDept"
        :mode="formMode"
        :parent-node="formParentNode"
        :tree="tree"
        @saved="invalidateTree"
    />

    <ConfirmDialog
        v-model:open="deleteOpen"
        :confirm-keyword="deleteTarget?.name"
        confirm-text="删除"
        :description="deleteDescription"
        keyword-label="组织名称"
        :loading="deleteSubmitting"
        title="删除组织"
        destructive
        @confirm="handleDeleteConfirm"
    />
</template>
