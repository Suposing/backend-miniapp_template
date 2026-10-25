<script setup lang="ts">
    import type { DeptTreeNode, NoticeScopeType } from '@/lib/api-types';
    import type { User } from '@/lib/api-types';

    import { computed, ref } from 'vue';

    /**
     * 公告接收范围选择器，将组织、岗位和人员选择按并集合成提交目标。
     * 三类 ID 分别受控，切换类别时保留已有选择；组织和岗位候选按当前启停状态限制选择。
     */
    const props = defineProps<{
        /**
         * 三类目标分别受控（并集语义，提交时合成 NoticeScope[]）
         */
        deptIds: string[];
        /**
         * 关联岗位 ID 列表。
         */
        postIds: string[];
        /**
         * 当前选中的内部人员 ID 列表。
         */
        userIds: string[];
        /**
         * 供选择或展示的完整树数据。
         */
        tree: DeptTreeNode[];
        /**
         * 岗位候选记录列表。
         */
        posts: {
            /**
             * 当前实体或选项的内部标识。
             */
            id: string;
            /**
             * 记录或选项的展示名称。
             */
            name: string;
            /**
             * 从顶层到所属组织的完整名称路径。
             */
            deptPath: string;
            /**
             * 岗位启停状态：enabled 启用、disabled 停用。
             */
            status: string;
        }[];
        /**
         * 人员候选记录列表。
         */
        users: Pick<User, 'id' | 'username' | 'displayName' | 'avatar'>[];
        /**
         * 人员选项是否正在加载。
         */
        usersLoading: boolean;
    }>();

    const emit = defineEmits<{
        /**
         * 组织选择变化时回传完整的已选组织 ID 列表。
         */
        'update:deptIds': [ids: string[]];
        /**
         * 岗位选择变化时回传完整的已选岗位 ID 列表。
         */
        'update:postIds': [ids: string[]];
        /**
         * 人员选择变化时回传完整的已选人员 ID 列表。
         */
        'update:userIds': [ids: string[]];
    }>();

    const tab = ref<NoticeScopeType>('dept');

    const tabItems = computed(() => [
        { label: '按组织', value: 'dept' },
        { label: '按岗位', value: 'post' },
        { label: '按人员', value: 'user' },
    ]);

    // 组织平铺选项（「└ 」前缀表达层级，有编码以「名称(编码)」展示；含停用禁选）
    interface DeptOption {
        /**
         * 界面展示的中文名称或控件标签。
         */
        label: string;
        /**
         * 当前字段的业务键值或控件值。
         */
        value: string;
        /**
         * 是否禁用当前控件的交互。
         */
        disabled: boolean;
    }

    const deptOptions = computed<DeptOption[]>(() => {
        const options: DeptOption[] = [];

        const walk = (nodes: DeptTreeNode[], level: number) => {
            for (const node of nodes) {
                const prefix = '\u3000'.repeat(level) + (level > 0 ? '└ ' : '');
                const label = node.code
                    ? `${node.name}(${node.code})`
                    : node.name;

                options.push({
                    label: prefix + label,
                    value: node.id,
                    disabled: node.status !== 'enabled',
                });
                walk(node.children, level + 1);
            }
        };

        walk(props.tree, 0);

        return options;
    });

    const postOptions = computed(() =>
        props.posts.map((post) => ({
            label: post.name,
            // 次行组织路径（USelectMenu item 的 description 槽，对齐 React 端 deptPath 次行）
            description: post.deptPath,
            value: post.id,
            disabled: post.status !== 'enabled',
        })),
    );

    const userOptions = computed(() =>
        props.users.map((user) => {
            const name = user.displayName || user.username;

            return {
                label: name,
                value: user.id,
                // UAvatar props（src 缺省时 UAvatar 用 text 兜底显示首字，同 DeptLeaderSelect）
                avatar: {
                    alt: name,
                    text: name.slice(0, 1),
                    ...(user.avatar ? { src: user.avatar } : {}),
                    // as const 防字面量拓宽为 string（AvatarProps.color 为字面量联合）
                    color: 'primary' as const,
                },
            };
        }),
    );

    const selectedSummary = computed(() => {
        const parts: string[] = [];

        if (props.deptIds.length) parts.push(`${props.deptIds.length} 个组织`);
        if (props.postIds.length) parts.push(`${props.postIds.length} 个岗位`);
        if (props.userIds.length) parts.push(`${props.userIds.length} 名人员`);

        return parts.length ? parts.join('、') : '未选择范围';
    });

    function toIds(value: unknown): string[] {
        if (Array.isArray(value)) {
            return value.map((id) => String(id));
        }

        return value == null ? [] : [String(value)];
    }
</script>

<script lang="ts">
    export default { name: 'NoticeScopeSelector' };
</script>

<template>
    <div class="flex flex-col gap-2">
        <UTabs
            v-model:model-value="tab"
            :content="false"
            :items="tabItems"
            size="sm"
        />

        <USelectMenu
            v-if="tab === 'dept'"
            :items="deptOptions"
            :model-value="deptIds"
            placeholder="选择组织（可多选）"
            class="w-full"
            multiple
            value-key="value"
            @update:model-value="
                (value: unknown) => emit('update:deptIds', toIds(value))
            "
        />

        <USelectMenu
            v-else-if="tab === 'post'"
            :items="postOptions"
            :model-value="postIds"
            placeholder="选择岗位（可多选）"
            class="w-full"
            multiple
            value-key="value"
            :ui="{
                itemDescription: 'text-xs',
            }"
            @update:model-value="
                (value: unknown) => emit('update:postIds', toIds(value))
            "
        />

        <USelectMenu
            v-else
            :items="userOptions"
            :loading="usersLoading"
            :model-value="userIds"
            :placeholder="usersLoading ? '正在加载人员…' : '选择人员（可多选）'"
            class="w-full"
            multiple
            value-key="value"
            @update:model-value="
                (value: unknown) => emit('update:userIds', toIds(value))
            "
        />
        <p class="text-muted text-xs">{{ selectedSummary }}</p>
    </div>
</template>
