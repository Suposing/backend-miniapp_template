<script setup lang="ts">
    import type { User } from '@/lib/api-types';
    import Spinner from '@/components/ui/spinner/index.vue';
    import { computed, useTemplateRef } from 'vue';

    import { useInfiniteScroll } from '@vueuse/core';
    import { useInfiniteQuery } from '@tanstack/vue-query';

    import { fetchApiList } from '@/lib/api-client';

    /**
     * 负责人选择器（USelectMenu + 无限滚动，官方示例形态：
     * ui.nuxt.com/docs/components/select-menu#with-infinite-scroll）：
     * /users 分页下拉 + 弹层滚动到底自动加载下一页。
     *
     * - 数据用 useInfiniteQuery 缓存（跨弹窗共享、staleTime 内开关弹窗不重复请求）；
     * - 无限滚动挂 USelectMenu 的 viewportRef（useInfiniteScroll），翻页中不重复触发；
     * - 选中回显头像走 USelectMenu 的 avatar prop（leading 位），选项自带 avatar：
     *   有头像显示图片，无头像显示名称首字；
     * - 编辑回显兜底：当前负责人不在已加载用户列表中时补为首条候选；
     * - 无权限（403）等加载失败：禁用选择器，不阻塞表单其余字段编辑。
     */
    const props = defineProps<{
        /**
         * 当前选中值（"" = 未选择）
         */
        modelValue: string;
        /**
         * 编辑回显兜底候选（当前负责人不在已加载列表时显示）
         */
        currentLeader: {
            /**
             * 当前实体或选项的内部标识。
             */
            id: string;
            /**
             * 界面展示的用户姓名或昵称。
             */
            displayName: string;
        } | null;
    }>();

    const emit = defineEmits<{
        /**
         * 用户修改或清空控件值时回传新值。
         */
        'update:modelValue': [value: string];
    }>();

    const LEADER_PAGE_SIZE = 50;

    const usersQuery = useInfiniteQuery({
        queryKey: ['users', 'leader-options'],
        queryFn: ({ pageParam }) =>
            fetchApiList<User>('/users', {
                page: pageParam,
                pageSize: LEADER_PAGE_SIZE,
            }),
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) =>
            allPages.length * LEADER_PAGE_SIZE < lastPage.pagination.total
                ? allPages.length + 1
                : undefined,
        // 弹窗反复开关共享缓存：staleTime 内不发请求，过期后台 refetch 不打断交互
        staleTime: 60_000,
        retry: false,
    });

    const failed = computed(() => usersQuery.isError.value);
    const loading = computed(() => usersQuery.isLoading.value);
    const loadingMore = computed(() => usersQuery.isFetchingNextPage.value);
    const hasNextPage = computed(() => usersQuery.hasNextPage.value);

    interface LeaderOption {
        /**
         * 界面展示的中文名称或控件标签。
         */
        label: string;
        /**
         * 当前字段的业务键值或控件值。
         */
        value: string;
        /**
         * UAvatar props（src 缺省时 UAvatar 用 text 兜底显示首字）
         */
        avatar: {
            /**
             * 图片资源地址。
             */
            src?: string;
            /**
             * 图片替代说明。
             */
            alt: string;
            /**
             * 供当前控件展示的文本。
             */
            text: string;
        };
    }

    const items = computed<LeaderOption[]>(() => {
        const options = (usersQuery.data.value?.pages ?? []).flatMap((page) =>
            page.data.map((user) => {
                const name = user.displayName || user.username;

                return {
                    label: name,
                    value: user.id,
                    avatar: {
                        alt: name,
                        text: name.slice(0, 1),
                        ...(user.avatar ? { src: user.avatar } : {}),
                        color: 'primary',
                    },
                };
            }),
        );

        // 编辑回显兜底：当前负责人不在已加载用户列表中时补为首条候选
        if (
            props.currentLeader &&
            props.modelValue &&
            !options.some((option) => option.value === props.currentLeader!.id)
        ) {
            const name = props.currentLeader.displayName;

            options.unshift({
                label: name,
                value: props.currentLeader.id,
                avatar: { alt: name, text: name.slice(0, 1), color: 'primary' },
            });
        }

        return options;
    });

    const selectedOption = computed(
        () =>
            items.value.find((option) => option.value === props.modelValue) ??
            null,
    );

    const placeholder = computed(() => {
        if (failed.value) return '无人员数据读取权限';
        if (items.value.length === 0 && !props.currentLeader) {
            return '暂无可选人员';
        }

        return '选择负责人';
    });

    const leaderMenu = useTemplateRef('leaderMenu');

    /**
     * 弹层滚动接近底部加载下一页（翻页中不重复触发）
     */
    useInfiniteScroll(
        () => leaderMenu.value?.viewportRef,
        () => {
            void usersQuery.fetchNextPage();
        },
        {
            canLoadMore: () =>
                hasNextPage.value && !loadingMore.value && !failed.value,
        },
    );

    function onSelect(key: unknown) {
        emit(
            'update:modelValue',
            key === null || key === undefined ? '' : String(key),
        );
    }
</script>

<script lang="ts">
    export default { name: 'DeptLeaderSelect' };
</script>

<template>
    <UFormField label="负责人">
        <USelectMenu
            ref="leaderMenu"
            :avatar="selectedOption?.avatar"
            :clear="!failed"
            :disabled="failed"
            :items="items"
            :model-value="modelValue || undefined"
            :placeholder="placeholder"
            class="w-full"
            value-key="value"
            @update:model-value="onSelect"
        >
            <template v-if="loading" #trailing>
                <Spinner size="sm" />
            </template>
        </USelectMenu>
    </UFormField>
</template>
