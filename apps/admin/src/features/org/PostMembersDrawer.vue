<script setup lang="ts">
    import type { DirectoryEntry, Post } from '@/lib/api-types';

    import { computed, ref, watch } from 'vue';

    import { keepPreviousData, useQuery } from '@tanstack/vue-query';

    import { fetchPostMembers } from './post-api';

    import Spinner from '@/components/ui/spinner/index.vue';

    /**
     * 岗位在职人员抽屉（在职人数穿透，GET /org/posts/:id/members，
     * ）：点击岗位列表「在职人数」打开，
     * 服务端分页展示在职人员（仅在职且未删除用户）。
     * 总数固定在标题副文案、分页固定在 footer，名单滚动时两者不随动
     * （与角色关联用户抽屉同构）。
     */
    const props = defineProps<{
        /**
         * 由父组件控制的弹窗或抽屉开关。
         */
        open: boolean;
        /**
         * 穿透目标岗位（关闭后置 null）
         */
        post: Post | null;
    }>();

    const emit = defineEmits<{
        /**
         * 弹窗或抽屉开关变化时回传新值，供父组件同步状态。
         */
        'update:open': [value: boolean];
    }>();

    /**
     * 名单分页大小（pageSize 全站枚举 10/20/30/40/50），与角色关联用户抽屉一致
     */
    const MEMBERS_PAGE_SIZE = 20;

    const page = ref(1);

    // 关闭即回到第一页：下次打开（含同一岗位）都从头看名单
    watch(
        () => props.open,
        (open) => {
            if (!open) page.value = 1;
        },
    );

    const membersQuery = useQuery({
        queryKey: computed(() => [
            'org',
            'posts',
            'members',
            props.post?.id ?? '',
            page.value,
        ]),
        queryFn: () =>
            fetchPostMembers(props.post!.id, page.value, MEMBERS_PAGE_SIZE),
        enabled: computed(() => props.open && Boolean(props.post)),
        placeholderData: keepPreviousData,
        staleTime: 0,
    });

    const members = computed<DirectoryEntry[]>(
        () => membersQuery.data.value?.data ?? [],
    );
    const total = computed(
        () => membersQuery.data.value?.pagination.total ?? 0,
    );
    const totalPages = computed(() =>
        Math.max(1, Math.ceil(total.value / MEMBERS_PAGE_SIZE)),
    );
    // 翻页期间 keepPreviousData 持续显示旧页数据：降透明 + 叠加 Spinner 给出反馈
    const switching = computed(() => membersQuery.isPlaceholderData.value);

    const title = computed(() =>
        props.post ? `「${props.post.name}」在职人员` : '岗位在职人员',
    );
    // 总数固定在头部副文案：加载完成且非空才显示（与 React 端一致）
    const countText = computed(() =>
        membersQuery.isSuccess.value && members.value.length > 0
            ? `共 ${total.value} 名在职人员`
            : undefined,
    );

    function close() {
        emit('update:open', false);
    }
</script>

<script lang="ts">
    export default { name: 'PostMembersDrawer' };
</script>

<template>
    <USlideover
        :open="open"
        :ui="{ content: 'w-105 max-w-[85vw]' }"
        :title="title"
        :description="countText"
        @update:open="(value: boolean) => !value && close()"
    >
        <template #body>
            <div
                v-if="membersQuery.isLoading.value"
                class="grid place-items-center py-10"
            >
                <Spinner size="md" />
            </div>
            <p
                v-else-if="membersQuery.isError.value"
                class="text-muted text-sm"
            >
                在职人员加载失败
            </p>
            <p
                v-else-if="members.length === 0"
                class="text-muted py-6 text-center text-sm"
            >
                该岗位暂无在职人员
            </p>
            <div
                v-else
                class="relative flex flex-col gap-2 transition-opacity data-[loading=true]:pointer-events-none data-[loading=true]:opacity-40"
                :data-loading="switching ? 'true' : undefined"
            >
                <div
                    v-for="entry in members"
                    :key="entry.id"
                    class="border-default flex items-center gap-3 rounded-xl border px-3 py-2"
                >
                    <UAvatar
                        :alt="entry.displayName"
                        :src="entry.avatar ?? undefined"
                        :text="entry.displayName.slice(0, 1)"
                        class="shrink-0"
                        size="sm"
                    />
                    <div class="min-w-0 flex-1">
                        <p class="truncate text-sm font-medium">
                            {{ entry.displayName }}
                        </p>
                        <p class="text-muted truncate text-xs">
                            {{ entry.deptPath ?? entry.username }}
                        </p>
                    </div>
                </div>
                <div
                    v-if="switching"
                    class="absolute inset-0 grid place-items-center"
                >
                    <Spinner size="sm" />
                </div>
            </div>
        </template>

        <template v-if="totalPages > 1" #footer>
            <div class="flex w-full justify-center">
                <UPagination
                    :page="page"
                    :total="total"
                    :items-per-page="MEMBERS_PAGE_SIZE"
                    :sibling-count="1"
                    size="sm"
                    @update:page="(value: number) => (page = value)"
                />
            </div>
        </template>
    </USlideover>
</template>
