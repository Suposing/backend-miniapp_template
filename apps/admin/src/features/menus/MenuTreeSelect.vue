<script setup lang="ts">
    import type { MenuNode } from '@/lib/api-types';

    import { computed } from 'vue';

    /**
     * 菜单树下拉选择器（参考 DeptTreeSelect）：USelectMenu + 扁平树选项，
     * 层级用全角空格缩进 + 「└ 」前缀表达；Nuxt UI 无 Tree 组件。
     *
     * 用于菜单管理表单的「父级菜单」字段：
     * - 选项 = 全量菜单树扁平化：全角空格（U+3000）按层级重复缩进 + 子级前缀
     *   「└ 」（不用普通空格：HTML 会折叠）；
     * - value 为菜单 id，"" = 未选择（顶级）；
     * - selfId 传入时禁选自身及其全部后代（编辑防环）；
     * - clear 内置清除（替代此前外挂关闭 Button）。
     */
    const modelValue = defineModel<string>({ default: '' });

    const props = withDefaults(
        defineProps<{
            /**
             * 供选择或展示的完整树数据。
             */
            tree: MenuNode[];
            /**
             * 禁选自身及后代（编辑防环场景）；缺省不禁
             */
            selfId?: string | null;
            /**
             * 根据候选节点判断是否允许选择的回调。
             */
            isDisabled?: boolean;
        }>(),
        { selfId: null, isDisabled: false },
    );

    interface MenuOption {
        /**
         * 界面展示的中文名称或控件标签。
         */
        label: string;
        /**
         * 当前字段的业务键值或控件值。
         */
        value: string;
        /**
         * 图标名称，按当前组件的图标约定渲染。
         */
        icon: string;
        /**
         * 是否禁用当前控件的交互。
         */
        disabled: boolean;
    }

    const options = computed<MenuOption[]>(() => {
        const list: MenuOption[] = [];

        const flattenTree = (
            nodes: MenuNode[],
            depth: number,
            underSelf: boolean,
        ) => {
            for (const node of nodes) {
                const isSelf = node.id === props.selfId;
                const disabled = underSelf || isSelf;
                const prefix = '\u3000'.repeat(depth) + (depth > 0 ? '└ ' : '');

                list.push({
                    label: prefix + node.label,
                    value: node.id,
                    icon: `i-lucide-${node.icon}`,
                    disabled,
                });
                flattenTree(
                    node.children ?? [],
                    depth + 1,
                    underSelf || isSelf,
                );
            }
        };

        flattenTree(props.tree, 0, false);

        return list;
    });

    function onSelect(key: unknown) {
        modelValue.value = key === null || key === undefined ? '' : String(key);
    }
</script>

<template>
    <USelectMenu
        :items="options"
        :model-value="modelValue || undefined"
        :clear="!isDisabled"
        :disabled="isDisabled"
        placeholder="请选择"
        class="w-full"
        value-key="value"
        @update:model-value="onSelect"
    />
</template>
