<script setup lang="ts">
    import type { TreeItemSelectEvent } from 'reka-ui';

    import { computed, ref, watch } from 'vue';

    import { useQueryClient } from '@tanstack/vue-query';
    import { useToast } from '@nuxt/ui/composables';

    import { getRoleErrorMessage, updateRoleMenus } from './role-api';
    import { useGrantTree, type GrantTreeItem } from './use-grant-tree';

    import ErrorContent from '@/components/common/ErrorContent.vue';

    /**
     * 角色授权抽屉（UTree 渲染，勾选模型与级联语义见 use-grant-tree.ts）。
     * 权限位是叶子菜单的虚拟子节点，父子级联由 useGrantTree 的集合模型精确
     * 对齐 React 基准（toggleMaster 语义）；保存 = PUT 全量替换 role_menus
     * （载荷只含选中节点及其位）；保存后页面统一失效导航菜单缓存。
     */
    const props = defineProps<{
        /**
         * 由父组件控制的弹窗或抽屉开关。
         */
        open: boolean;
        /**
         * 授权目标角色（null = 关闭态；code 用于系统内置角色保护）
         */
        role: {
            /**
             * 当前实体或选项的内部标识。
             */
            id: string;
            /**
             * 记录或选项的展示名称。
             */
            name: string;
            /**
             * 稳定的业务编码。
             */
            code: string;
        } | null;
    }>();

    const emit = defineEmits<{
        /**
         * 弹窗或抽屉开关变化时回传新值，供父组件同步状态。
         */
        'update:open': [value: boolean];
        /**
         * 记录保存成功后触发，供父组件刷新当前列表或资料。
         */
        saved: [];
    }>();

    const toast = useToast();
    const queryClient = useQueryClient();

    const roleId = computed(() => props.role?.id ?? '');
    const roleName = computed(() => props.role?.name ?? '');

    const grantTree = useGrantTree(
        () => roleId.value,
        () => props.role?.code ?? '',
    );

    // 打开时重置本地覆盖层、选中集合与展开状态（数据就绪后回显）
    watch(
        () => props.open,
        (open) => {
            if (open) grantTree.resetSelection();
        },
    );

    const saving = ref(false);

    function close() {
        emit('update:open', false);
    }

    /**
     * 统一拦截组件默认 toggle：行点击仅展开/折叠（勾选只在 checkbox 上）；
     * 键盘 Enter/Space 等价勾选。两者都走 toggleItem（toggleMaster 级联语义，
     * 与当前后台一致），不走 reka 内建 propagate/bubble。
     */
    function onTreeSelect(
        event: TreeItemSelectEvent<GrantTreeItem>,
        item: GrantTreeItem,
    ) {
        event.preventDefault();
        grantTree.toggleItem(item);
    }

    function getItemKey(item: GrantTreeItem) {
        return item?.key ?? '';
    }

    async function onSave() {
        if (!props.role) return;

        saving.value = true;

        try {
            await updateRoleMenus(props.role.id, grantTree.buildMenusPayload());

            // 授权已变：失效角色授权缓存 + 导航菜单缓存（当前用户自己的角色立即生效）
            void queryClient.invalidateQueries({
                queryKey: ['roles', props.role.id, 'menus'],
            });
            emit('saved');
            toast.add({
                color: 'success',
                title: '授权已保存',
            });
            close();
        } catch (error) {
            toast.add({
                color: 'error',
                title: getRoleErrorMessage(error),
            });
        } finally {
            saving.value = false;
        }
    }
</script>

<template>
    <USlideover
        :open="open"
        :ui="{ content: 'w-152 max-w-[85vw]' }"
        @update:open="(value: boolean) => !value && close()"
    >
        <template #title>
            <div class="flex flex-col gap-1">
                <div class="flex items-center gap-2">
                    <UIcon
                        class="size-5 text-muted"
                        name="i-lucide-key-round"
                    />
                    <span class="text-base font-semibold">
                        {{ `角色授权 — ${roleName}` }}
                    </span>
                </div>
                <p class="text-muted text-xs">
                    {{
                        `勾选父级将自动勾选全部子菜单；部分子级选中时父级呈半选状态。已勾选 ${grantTree.selectedCount.value}/${grantTree.totalNodes.value} 项菜单。`
                    }}
                </p>
            </div>
        </template>

        <template #body>
            <div class="flex flex-col gap-3">
                <UAlert
                    v-if="grantTree.isProtected.value"
                    color="warning"
                    icon="i-lucide-triangle-alert"
                    description="超级管理员的授权是全量权限的载体，不可修改。如需调整权限，请创建新的角色并分配。"
                    title="系统内置角色"
                />

                <div
                    v-if="grantTree.loading.value"
                    class="flex flex-col gap-2 py-1"
                >
                    <div
                        v-for="(indent, index) in [0, 1, 1, 2, 2, 2, 1, 2]"
                        :key="index"
                        class="flex items-center gap-2.5 py-1"
                        :style="{ paddingInlineStart: `${indent * 20}px` }"
                    >
                        <USkeleton class="size-4 rounded-md" />
                        <USkeleton
                            class="h-3.5 rounded-md"
                            :style="{ width: `${88 - indent * 12}px` }"
                        />
                    </div>
                </div>

                <ErrorContent
                    v-else-if="grantTree.loadError.value"
                    retry-label="重试"
                    title="菜单数据加载失败"
                    @retry="grantTree.refetch()"
                />

                <p
                    v-else-if="grantTree.treeItems.value.length === 0"
                    class="text-muted py-8 text-center text-sm"
                >
                    暂无菜单数据
                </p>

                <!--
          bubble-select 仅为 isIndeterminate（半选显示）推导；选中集合完全
          受控，级联走 toggleItem。link 用 div 渲染（checkbox 是 button，
          禁止嵌套）；授权树无「导航选中」语义，覆盖选中行背景高亮。
        -->
                <UTree
                    v-else
                    v-model="grantTree.selectedItems.value"
                    v-model:expanded="grantTree.expandedKeys.value"
                    :as="{ link: 'div' }"
                    :get-key="getItemKey"
                    :items="grantTree.treeItems.value"
                    :ui="{ link: 'before:bg-transparent' }"
                    bubble-select
                    multiple
                    @select="onTreeSelect"
                >
                    <template #item-leading="{ item, selected, indeterminate }">
                        <UCheckbox
                            :aria-label="
                                item.kind === 'menu'
                                    ? `「${item.label}」可见性`
                                    : item.label
                            "
                            :model-value="
                                indeterminate ? 'indeterminate' : selected
                            "
                            tabindex="-1"
                            @change="() => grantTree.toggleItem(item)"
                            @click.stop
                        />
                        <UIcon
                            v-if="item.icon"
                            class="text-muted size-4 shrink-0"
                            :name="item.icon"
                        />
                    </template>

                    <template #item-label="{ item }">
                        <template v-if="item.kind === 'menu'">
                            <span class="text-sm font-medium">{{
                                item.label
                            }}</span>
                            <span
                                v-if="!item.node.enabled"
                                class="text-muted shrink-0 text-xs"
                            >
                                (已停用)
                            </span>
                        </template>
                        <span v-else class="text-muted text-xs">{{
                            item.label
                        }}</span>
                    </template>
                </UTree>
            </div>
        </template>

        <template #footer>
            <div class="flex w-full items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                    <UButton
                        :disabled="
                            grantTree.loading.value ||
                            grantTree.treeItems.value.length === 0
                        "
                        label="全部折叠"
                        color="neutral"
                        size="sm"
                        variant="soft"
                        @click="grantTree.setAllExpanded(false)"
                    />
                    <UButton
                        :disabled="
                            grantTree.loading.value ||
                            grantTree.treeItems.value.length === 0
                        "
                        label="全部展开"
                        color="neutral"
                        size="sm"
                        variant="soft"
                        @click="grantTree.setAllExpanded(true)"
                    />
                </div>
                <div class="flex items-center gap-2">
                    <UButton
                        label="取消"
                        color="neutral"
                        variant="outline"
                        @click="close"
                    />
                    <UButton
                        :disabled="
                            grantTree.loading.value ||
                            grantTree.isProtected.value
                        "
                        :label="saving ? '保存中…' : '保存授权'"
                        :loading="saving"
                        @click="onSave"
                    />
                </div>
            </div>
        </template>
    </USlideover>
</template>
