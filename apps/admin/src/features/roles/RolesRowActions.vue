<script setup lang="ts">
    import { computed } from 'vue';

    import type { Role } from '@/lib/api-types';

    /**
     * 行操作下拉（cell 组件）：授权/编辑/启停/删除，按权限与内置角色保护显隐。
     */
    const props = defineProps<{
        /**
         * 当前操作的角色记录。
         */
        role: Role;
        /**
         * 是否允许编辑当前记录。
         */
        canEdit: boolean;
        /**
         * 是否允许修改当前角色授权。
         */
        canGrantRow: boolean;
        /**
         * 是否允许切换当前记录的启停状态。
         */
        canToggle: boolean;
        /**
         * 是否允许删除当前角色。
         */
        canDeleteRow: boolean;
    }>();

    const emit = defineEmits<{
        /**
         * 稳定的业务动作标识或接口请求动作。
         */
        action: [key: 'grant' | 'edit' | 'toggle' | 'delete'];
    }>();

    const items = computed(() => {
        const list: Array<{
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

        if (props.canGrantRow) {
            list.push({
                key: 'grant',
                label: '菜单授权',
                icon: 'i-lucide-key-round',
                onSelect: () => emit('action', 'grant'),
            });
        }
        if (props.canEdit) {
            list.push({
                key: 'edit',
                label: '编辑',
                icon: 'i-lucide-pencil',
                onSelect: () => emit('action', 'edit'),
            });
        }
        if (props.canToggle) {
            list.push({
                key: 'toggle',
                label: props.role.enabled ? '停用' : '启用',
                icon: props.role.enabled
                    ? 'i-lucide-power-off'
                    : 'i-lucide-power',
                color: props.role.enabled ? 'error' : undefined,
                onSelect: () => emit('action', 'toggle'),
            });
        }
        if (props.canDeleteRow) {
            list.push({
                key: 'delete',
                label: '删除',
                icon: 'i-lucide-trash-2',
                color: 'error',
                onSelect: () => emit('action', 'delete'),
            });
        }

        return [list];
    });
</script>

<template>
    <UDropdownMenu
        v-if="items[0]?.length"
        :items="items"
        :content="{ align: 'center' }"
    >
        <UButton
            aria-label="操作"
            color="neutral"
            icon="i-lucide-ellipsis"
            size="sm"
            variant="ghost"
        />
    </UDropdownMenu>
</template>
