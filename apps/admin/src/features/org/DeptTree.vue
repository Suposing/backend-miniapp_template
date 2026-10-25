<script setup lang="ts">
    import type { DeptSortItem, DeptTreeNode } from '@/lib/api-types';

    import { computed, ref, watch } from 'vue';
    import { useSortable } from '@vueuse/integrations/useSortable';

    /**
     * 基于 UTree 的组织选择与拖拽组件，向父组件回传节点选择和排序结果。
     */

    /**
     * 选项类型：不 extends TreeItem（其 ui 字段引用 ComponentConfig<AppConfig> 深链
     * 会令 vue-tsc 递归展开爆栈 TS2589）；UTree 接受 TreeItem（带 [key: string]: any），
     * 结构兼容的普通对象可直接传入。
     */
    interface DeptTreeOption {
        /**
         * 界面展示的中文名称或控件标签。
         */
        label: string;
        /**
         * 原始树节点（选中回传 / 拖拽组定位用）
         */
        dept: DeptTreeNode;
        /**
         * 当前节点的直接子节点列表；空数组表示叶节点。
         */
        children?: DeptTreeOption[];
        /**
         * 是否禁用当前控件的交互。
         */
        disabled?: boolean;
        /**
         * 树初始化时展开的节点标识列表。
         */
        defaultExpanded?: boolean;
        /**
         * Iconify icon name（停用节点行尾 x 图标）
         */
        trailingIcon?: string;
        [key: string]: unknown;
    }

    const props = defineProps<{
        /**
         * 当前层级或组件使用的树节点列表。
         */
        nodes: DeptTreeNode[];
        /**
         * 当前选中节点 ID；空值表示未选择。
         */
        selectedId: string | null;
        /**
         * 是否允许拖拽调整组织层级与排序。
         */
        canReorder: boolean;
    }>();

    const emit = defineEmits<{
        /**
         * 用户选择组织节点时回传节点标识。
         */
        select: [node: DeptTreeNode];
        /**
         * 组织拖拽完成后回传新的父级和排序结果。
         */
        reorder: [items: DeptSortItem[]];
    }>();

    // ---- items 镜像（DeptTreeNode[] → TreeItem[]） ----

    function toTreeOption(node: DeptTreeNode): DeptTreeOption {
        return {
            label: node.name,
            dept: node,
            // 停用节点：行内用 lucide-x 角标 + 禁用交互
            ...(node.status === 'disabled'
                ? { trailingIcon: 'i-lucide-x', disabled: true }
                : {}),
            ...(node.children.length
                ? { children: node.children.map(toTreeOption) }
                : {}),
        };
    }

    /**
     * 本地镜像数组：拖拽移动（乐观 UI）落在这里，props 变化（refetch）时重置
     */
    const items = ref<DeptTreeOption[]>([]);

    function collectIds(nodes: DeptTreeNode[], acc: string[] = []): string[] {
        for (const node of nodes) {
            acc.push(node.id);
            collectIds(node.children, acc);
        }

        return acc;
    }

    /**
     * 展开集合（组织 id）；初始化 = 全展开，refetch 只并入新节点、保留用户收起状态
     */
    const expandedIds = ref<Set<string>>(new Set());

    const expandedList = computed(() => [...expandedIds.value]);

    watch(
        () => [props.nodes, props.selectedId] as const,
        ([nodes]) => {
            items.value = nodes.map(toTreeOption);
            const ids = collectIds(nodes);

            expandedIds.value =
                expandedIds.value.size === 0
                    ? new Set(ids)
                    : new Set([...expandedIds.value, ...ids]);
        },
        { immediate: true },
    );

    // ---- 选中（reka 原生链路 → TreeItem select 事件 → UTree onSelect prop） ----

    function handleSelect(_event: unknown, item: unknown) {
        if (
            item &&
            typeof item === 'object' &&
            'dept' in item &&
            item.dept &&
            typeof item.dept === 'object' &&
            'id' in item.dept
        ) {
            emit('select', item.dept as DeptTreeNode);
        }
    }

    function handleExpandedUpdate(keys: string[]) {
        expandedIds.value = new Set(keys);
    }

    // 受控选中：reka 对 modelValue 同样应用 get-key，须传 items 中的 item 对象
    // （经 :get-key 映射为组织 id 与点击选中对齐）；找不到时传 null = 无选中
    const selectedItem = computed<DeptTreeOption | null>(() => {
        const find = (list: DeptTreeOption[]): DeptTreeOption | null => {
            for (const option of list) {
                if (option?.dept?.id === props.selectedId) return option;

                const found = find(option?.children ?? []);

                if (found) return found;
            }

            return null;
        };

        return find(items.value);
    });

    // ---- 拖拽（官方参考示例的 flatten + moveItem） ----

    function flatten(
        list: DeptTreeOption[],
        parent: DeptTreeOption[] = list,
    ): {
        /**
         * 当前操作的记录或列表项。
         */
        item: DeptTreeOption;
        /**
         * 父级节点；null 表示根节点。
         */
        parent: DeptTreeOption[];
        /**
         * 当前项在展示列表中的下标。
         */
        index: number;
    }[] {
        return list.flatMap((item, index) => [
            { item, parent, index },
            ...(item.children?.length && expandedIds.value.has(item?.dept?.id)
                ? flatten(item.children, item.children)
                : []),
        ]);
    }

    function moveItem(oldIndex: number, newIndex: number) {
        if (oldIndex === newIndex) return;

        const flat = flatten(items.value);
        const source = flat[oldIndex];
        const target = flat[newIndex];

        if (!source || !target) return;

        const [moved] = source.parent.splice(source.index, 1);

        if (!moved) return;

        const updatedFlat = flatten(items.value);
        const updatedTarget = updatedFlat.find(
            ({ item }) => item === target.item,
        );

        if (!updatedTarget) return;

        const insertIndex =
            oldIndex < newIndex ? updatedTarget.index + 1 : updatedTarget.index;

        updatedTarget.parent.splice(insertIndex, 0, moved);

        // 受影响组整组重编号提交；顶级组 parentId 为 null
        emit(
            'reorder',
            updatedTarget.parent.map((sibling, idx) => ({
                id: sibling?.dept?.id ?? '',
                parentId: moved?.dept?.parentId ?? null,
                sort: updatedTarget.parent.length - 1 - idx,
            })),
        );
    }

    const tree = ref<HTMLElement | null>(null);

    useSortable(tree, items, {
        animation: 150,
        ghostClass: 'opacity-50',
        onUpdate: (e) => {
            if (e.oldIndex !== undefined && e.newIndex !== undefined) {
                moveItem(e.oldIndex, e.newIndex);
            }
        },
    });
</script>

<script lang="ts">
    export default { name: 'DeptTree' };
</script>

<template>
    <!-- UTree 原生模式：选中受控（model-value = selectedId，get-key 映射为组织 id），
       保证刷新 / URL 恢复（通讯录 ?deptId=）时高亮与数据筛选一致，不依赖 reka 点击内部态 -->
    <UTree
        ref="tree"
        :items="items"
        :expanded="expandedList"
        :get-key="(item: DeptTreeOption) => item?.dept?.id ?? ''"
        :model-value="selectedItem ?? undefined"
        :nested="false"
        :unmount-on-hide="false"
        :ui="{ linkLeadingIcon: 'hidden' }"
        @update:expanded="handleExpandedUpdate"
        @select="handleSelect"
    />
</template>
