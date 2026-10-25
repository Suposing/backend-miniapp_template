<script setup lang="ts">
    import type { StatsNoticeItem } from '@/lib/api-types';

    import { formatDateTime } from '@/lib/format-date';

    /**
     * 最新公告卡：已发布公告标题 + 发布人
     * （头像 / 首字 fallback）+ 发布时间。服务端仅返回标题 / 时间 / 发布人显示名，
     * 不含正文与范围等敏感信息；每条两行布局，与最近动态条目高度基本一致。
     */

    defineProps<{
        /**
         * 当前组件或请求使用的项目列表。
         */
        items: StatsNoticeItem[];
        /**
         * 卡头「查看全部」出口路径（页面按菜单可见性判定后传入；缺省不渲染）
         */
        viewAllTo?: string;
    }>();
</script>

<template>
    <UCard class="dashboard-card h-full">
        <template #header>
            <div class="flex items-center justify-between gap-2">
                <span
                    class="text-highlighted flex items-center gap-2 text-base font-semibold"
                >
                    <UIcon
                        aria-hidden
                        class="text-primary size-4"
                        name="i-lucide-megaphone"
                    />
                    最新公告
                </span>
                <UButton
                    v-if="viewAllTo"
                    label="查看全部"
                    size="sm"
                    :to="viewAllTo"
                    variant="ghost"
                />
            </div>
        </template>

        <div class="flex flex-col gap-1">
            <UEmpty
                v-if="items.length === 0"
                icon="i-lucide-inbox"
                size="sm"
                title="暂无公告"
                variant="naked"
            />
            <template v-else>
                <div
                    v-for="item in items"
                    :key="item.id"
                    class="hover:bg-elevated flex items-start gap-3 rounded-lg px-2 py-2 transition-colors"
                >
                    <UIcon
                        aria-hidden
                        class="text-muted mt-0.5 size-3.5 shrink-0"
                        name="i-lucide-megaphone"
                    />
                    <div class="min-w-0 flex-1">
                        <p class="text-default truncate text-sm">
                            {{ item.title }}
                        </p>
                        <div class="flex items-center gap-1.5">
                            <!-- key 随头像变化重建子树，规避图片加载状态残留（同 UserInfo 口径） -->
                            <UAvatar
                                :key="item.publisherAvatar ?? 'fallback'"
                                :alt="item.publisherName ?? undefined"
                                :src="item.publisherAvatar ?? undefined"
                                :text="(item.publisherName ?? '?').slice(0, 1)"
                                class="size-4 shrink-0"
                            />
                            <span class="text-muted truncate text-sm">
                                {{
                                    '发布人：' + (item.publisherName ?? '未知')
                                }}
                            </span>
                        </div>
                    </div>
                    <time
                        class="text-muted shrink-0 text-xs tabular-nums"
                        :datetime="item.publishTime"
                    >
                        {{ formatDateTime(item.publishTime) }}
                    </time>
                </div>
            </template>
        </div>
    </UCard>
</template>
