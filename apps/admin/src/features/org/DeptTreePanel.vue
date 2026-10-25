<script setup lang="ts">
    import type { DeptSortItem, DeptTreeNode } from '@/lib/api-types';

    import DeptTree from './DeptTree.vue';

    import LoadingContent from '@/components/ui/loading-content/index.vue';

    /**
     * 组织管理和人员通讯录共用的组织树面板，负责加载、选择及可选拖拽操作。
     */
    withDefaults(
        defineProps<{
            /**
             * 当前层级或组件使用的树节点列表。
             */
            nodes: DeptTreeNode[];
            /**
             * 是否处于首轮数据加载状态。
             */
            isLoading: boolean;
            /**
             * 有数据时的刷新遮罩（增删改/排序后 refetch 全程可见，数据保留不闪白）
             */
            isFetching?: boolean;
            /**
             * 排序请求中（拖拽提交到 API 完成前也显示遮罩）
             */
            isPending?: boolean;
            /**
             * 当前选中节点 ID；空值表示未选择。
             */
            selectedId: string | null;
            /**
             * 同级拖拽排序（可选；通讯录不启用）
             */
            canReorder?: boolean;
            /**
             * 空态主文案（如「暂无组织」）
             */
            emptyTitle: string;
        }>(),
        { isFetching: false, isPending: false, canReorder: false },
    );

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
</script>

<script lang="ts">
    export default { name: 'DeptTreePanel' };
</script>

<template>
    <!-- 内边距收口到 body（p-3）：UCard 默认 body p-4 sm:p-6，叠加 root p-4 会双份 -->
    <UCard
        class="flex flex-col"
        variant="outline"
        :ui="{ body: 'flex flex-col gap-3 p-3' }"
    >
        <div class="flex items-center justify-between gap-2">
            <span class="text-sm font-medium">
                组织架构
                <span class="text-muted ms-1">({{ nodes.length }})</span>
            </span>
            <slot name="header-action" />
        </div>

        <!-- 骨架屏：与树行同形的占位（展开箭头 + 名称条，逐行缩进模拟层级） -->
        <div v-if="isLoading" class="flex flex-col gap-1">
            <div
                v-for="index in 6"
                :key="index"
                :style="{ paddingInlineStart: ((index - 1) % 3) * 16 + 8 }"
                class="flex items-center gap-2 rounded-xl py-2"
            >
                <USkeleton class="size-3.5 rounded" />
                <USkeleton
                    :style="{ width: `${52 - ((index - 1) % 3) * 8}%` }"
                    class="h-3.5 rounded-md"
                />
            </div>
        </div>

        <div
            v-else-if="nodes.length === 0"
            class="text-muted flex flex-col items-center justify-center gap-2 py-8"
        >
            <p class="text-sm">{{ emptyTitle }}</p>
            <slot name="empty-action" />
        </div>

        <div v-else class="relative">
            <!-- 树遮罩：增删改/排序后 refetch 或排序请求中全程可见（数据保留不闪白） -->
            <LoadingContent
                v-if="isFetching || isPending"
                overlay="bg-default/30"
                class="rounded-xl backdrop-blur-[1px]"
            />
            <DeptTree
                :can-reorder="canReorder"
                :nodes="nodes"
                :selected-id="selectedId"
                @reorder="emit('reorder', $event)"
                @select="emit('select', $event)"
            />
        </div>
    </UCard>
</template>
