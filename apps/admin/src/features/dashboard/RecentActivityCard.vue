<script setup lang="ts">
    import type { StatsLogItem } from '@/lib/api-types';

    import { formatRelativeTime } from '@/lib/format-date';

    /**
     * 最近动态卡：用户首字头像 + 操作人 +
     * 动作人话文案 + 相对时间。数据为 type=operation 日志（服务端已剔除敏感字段；
     * 接口不返回头像 URL 时以姓名首字 fallback 呈现）。
     */

    /**
     * action → 中文文案 键映射（人话文案）。覆盖内置操作与登录/登出动作；
     * 未收录的 action 回退显示原始值（等宽小字，保证不丢信息）。
     */
    const ACTION_LABELS: Record<string, string> = {
        'user.create': '创建了用户',
        'user.update': '更新了用户',
        'user.delete': '删除了用户',
        'role.create': '创建了角色',
        'role.update': '更新了角色',
        'menu.update': '更新了菜单',
        'dept.create': '创建了组织',
        'dept.update': '更新了组织',
        'dept.sort': '调整了组织排序',
        'post.create': '创建了岗位',
        'post.update': '更新了岗位',
        'notice.create': '发布了公告',
        'notice.update': '更新了公告',
        'notice.withdraw': '撤回了公告',
        'notice.remind': '催办了公告',
        'log.delete': '清理了日志',
        'login.success': '登录成功',
        'login.success.demo': '演示登录成功',
        logout: '退出了登录',
    };

    defineProps<{
        /**
         * 当前组件或请求使用的项目列表。
         */
        items: StatsLogItem[];
        /**
         * 卡头「查看全部」出口路径（页面按菜单可见性判定后传入；缺省不渲染）
         */
        viewAllTo?: string;
    }>();

    function nameOf(item: StatsLogItem): string {
        return item.displayName ?? item.username ?? '系统';
    }
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
                        name="i-lucide-activity"
                    />
                    最近动态
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
                title="暂无操作动态"
                variant="naked"
            />
            <template v-else>
                <div
                    v-for="item in items"
                    :key="item.id"
                    class="hover:bg-elevated flex items-center gap-3 rounded-lg px-2 py-2 transition-colors"
                >
                    <!-- key 随 avatar 变化重建子树：图片加载状态卸载后不重置，
               避免头像加载失败后 fallback 不回显（同 UserInfo 口径） -->
                    <UAvatar
                        :key="item.avatar ?? 'fallback'"
                        :alt="nameOf(item)"
                        :src="item.avatar ?? undefined"
                        :text="nameOf(item).slice(0, 1)"
                        class="shrink-0"
                        size="sm"
                    />
                    <p class="min-w-0 flex-1 truncate text-sm">
                        <span class="text-default font-medium">{{
                            nameOf(item)
                        }}</span>
                        <span
                            v-if="ACTION_LABELS[item.action]"
                            class="text-muted ml-1.5"
                        >
                            {{ ACTION_LABELS[item.action] }}
                        </span>
                        <span
                            v-else
                            class="text-muted ml-1.5 font-mono text-xs"
                        >
                            {{ item.action }}
                        </span>
                    </p>
                    <time
                        class="text-muted shrink-0 text-xs tabular-nums"
                        :datetime="item.createdAt"
                    >
                        {{ formatRelativeTime(item.createdAt) }}
                    </time>
                </div>
            </template>
        </div>
    </UCard>
</template>
