<script setup lang="ts">
    import { computed } from 'vue';

    import type { User, UserStatus } from '@/lib/api-types';

    /**
     * 行操作下拉（cell 组件）：编辑/重置密码/启停/删除，按权限与保护口径显隐。
     */
    const props = defineProps<{
        /**
         * 当前用户的安全资料与授权快照。
         */
        user: User;
        /**
         * 是否允许编辑当前记录。
         */
        canEdit: boolean;
        /**
         * 是否允许删除当前账号。
         */
        canDelete: boolean;
        /**
         * 是否允许重置当前账号密码。
         */
        canResetPassword: boolean;
        /**
         * 目标用户是否受写操作保护（删除/重置密码隐藏；停用按状态判定）
         */
        isProtected: boolean;
        /**
         * 切换启停操作将写入的目标状态。
         */
        nextStatus: UserStatus;
        /**
         * 是否允许切换当前记录的启停状态。
         */
        canToggle: boolean;
    }>();

    const emit = defineEmits<{
        /**
         * 稳定的业务动作标识或接口请求动作。
         */
        action: [key: 'edit' | 'reset-password' | 'toggle' | 'delete'];
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

        if (props.canEdit) {
            list.push({
                key: 'edit',
                label: '编辑',
                icon: 'i-lucide-pencil',
                onSelect: () => emit('action', 'edit'),
            });
        }
        if (props.canResetPassword && !props.isProtected) {
            list.push({
                key: 'reset-password',
                label: '重置密码',
                icon: 'i-lucide-key-round',
                onSelect: () => emit('action', 'reset-password'),
            });
        }
        if (props.canToggle) {
            list.push({
                key: 'toggle',
                label: props.user.status === 'active' ? '停用' : '启用',
                icon:
                    props.user.status === 'active'
                        ? 'i-lucide-power-off'
                        : 'i-lucide-power',
                color: props.user.status === 'active' ? 'error' : undefined,
                onSelect: () => emit('action', 'toggle'),
            });
        }
        if (props.canDelete && !props.isProtected) {
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
