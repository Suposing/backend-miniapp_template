<script setup lang="ts">
    import type { StatsKpis, StatsSeriesPoint } from '@/lib/api-types';
    import type { TabsItem } from '@nuxt/ui';

    import NumberFlow from '@number-flow/vue';
    import { useQuery } from '@tanstack/vue-query';
    import { computed, defineAsyncComponent, ref } from 'vue';

    import KpiCard from './KpiCard.vue';
    import LatestNoticesCard from './LatestNoticesCard.vue';
    import RecentActivityCard from './RecentActivityCard.vue';
    import { STATS_OVERVIEW_QUERY_KEY, fetchStatsOverview } from './stats-api';
    import WelcomeBanner from './WelcomeBanner.vue';

    /**
     * 两张主图走异步组件：它们是唯一依赖 Unovis 的地方，静态导入会把 Unovis 打进
     * `(authenticated)` 共享 chunk（实测 74KB gzip），让每个登录页都替 Dashboard 买单。
     * 卡片占位高度由 min-h 固定，异步到位不跳版；采用异步组件分包。
     */
    const LoginTrendChart = defineAsyncComponent(
        () => import('./LoginTrendChart.vue'),
    );
    const RoleDistributionChart = defineAsyncComponent(
        () => import('./RoleDistributionChart.vue'),
    );

    import { useMenus } from '@/composables/use-menus';
    import { collectMenuPaths } from '@/lib/menu-utils';
    import { useAuthStore } from '@/stores/auth-store';

    /**
     * Dashboard 概览页。
     *
     * 布局骨架：欢迎横幅（时段问候 + 日期/天气 Chip + 快捷入口）→
     * KPI 行（4 张扁平卡：图标徽标 + 标题 + 右侧状态 badge + 大数字 + 底部通栏
     * sparkline）→ 主图表卡（登录趋势：卡头右侧时间范围 Tabs + 卡内周期/日均小结带）
     * + 角色占比卡（等高自适应，圆心显示成员总数）→ 最近动态 + 最新公告
     * （各 1/2，卡头带查看全部出口）。
     *
     * - 数据：单一聚合接口 GET /stats/overview，**整页只有一个查询 key**；
     *   趋势区间 7/30 日是图表的视图状态，对固定 30 点的 loginTrend 本地截取，
     *   切 Tabs 不发请求；
     * - 图表：Unovis（封装位于 components/chart），两张主图经
     *   `defineAsyncComponent` 分包，避免库进共享 chunk；KPI 迷你 sparkline 仍手写
     *   SVG（三端同口径，7 个点不值得为它配库）；
     * - 动画：区块入场 stagger（styles/dashboard.css，尊重 prefers-reduced-motion）
     *   + NumberFlow 数字滚动；
     * - 视觉：全部复用 Nuxt UI Design Tokens（--ui-*），不新增色值 / 圆角 / 阴影；
     * - 宽屏：内容限宽 max-w-7xl 居中（页面交互约定 §1.2 非 fluid Main 口径）。
     */

    /**
     * 动态 / 公告「查看全部」目标路径（与欢迎横幅快捷入口同源）
     */
    const ACTIVITY_PATH = '/settings/logs';
    const NOTICES_PATH = '/org/notices';

    const auth = useAuthStore();
    const { data: menus } = useMenus();

    // 整页仅此一个查询：v1.12.0 起接口无取数参数，趋势区间在视图层本地切换
    const { data, error, isError, isPending, refetch } = useQuery({
        queryKey: STATS_OVERVIEW_QUERY_KEY,
        queryFn: fetchStatsOverview,
        staleTime: 60_000,
    });

    /**
     * 趋势区间是图表的视图状态：接口固定给 30 点，这里本地截取，切 Tabs 不发请求
     */
    const days = ref<7 | 30>(7);
    const rangeItems = computed<TabsItem[]>(() => [
        { label: '近 7 日', value: 7 },
        { label: '近 30 日', value: 30 },
    ]);
    /**
     * UTabs 的 modelValue 是 string | number，回写时收敛为 7 / 30
     */
    const rangeModel = computed({
        get: () => days.value,
        set: (value: string | number) => {
            days.value = Number(value) === 30 ? 30 : 7;
        },
    });

    /**
     * 环比昨日百分比（昨日为 0 时不计环比返回 null）
     */
    function loginDeltaPercent(kpis: StatsKpis): number | null {
        if (kpis.loginsYesterday === 0) return null;

        return (
            Math.round(
                ((kpis.loginsToday - kpis.loginsYesterday) /
                    kpis.loginsYesterday) *
                    1000,
            ) / 10
        );
    }

    const kpis = computed(() => data.value?.kpis);

    const trendSeries = computed<StatsSeriesPoint[]>(() =>
        (data.value?.loginTrend ?? []).slice(-days.value),
    );

    /**
     * 主图卡小结（序列求和与均值，纯前端计算，随所选区间变化）
     */
    const summaryStats = computed(() => {
        const series = trendSeries.value;
        const periodTotal = series.reduce((sum, point) => sum + point.count, 0);

        return [
            {
                label: '周期登录',
                value: periodTotal,
            },
            {
                label: '日均登录',
                value: series.length
                    ? Math.round(periodTotal / series.length)
                    : 0,
            },
        ];
    });

    /**
     * KPI 卡的视图模型（显式声明，避免四卡异构对象被推成属性缺失的联合类型）
     */
    interface KpiCardView {
        /**
         * 指标旁显示的变化或说明标签。
         */
        badge?: string;
        /**
         * 指标标签使用的语义配色。
         */
        badgeTone?: 'up' | 'down' | 'accent' | 'neutral';
        /**
         * 图标名称，按当前组件的图标约定渲染。
         */
        icon: string;
        /**
         * 界面展示的中文名称或控件标签。
         */
        label: string;
        /**
         * 按日期或显示顺序排列的趋势数据。
         */
        series?: StatsSeriesPoint[];
        /**
         * 当前字段的业务键值或控件值。
         */
        value: number;
    }

    /**
     * KPI 四卡数据（badge 缺项不渲染；零值不占主色语义，降为中性灰）
     */
    const kpiCards = computed<KpiCardView[]>(() => {
        const stats = kpis.value;

        if (!stats) return [];

        const delta = loginDeltaPercent(stats);

        return [
            {
                badge: `今日新增 ${stats.usersTodayNew}`,
                // 零值不该占用主色语义（看起来像坏数据）
                badgeTone: stats.usersTodayNew === 0 ? 'neutral' : 'accent',
                icon: 'i-lucide-users',
                label: '用户总数',
                series: stats.usersDailyNew,
                value: stats.usersTotal,
            },
            {
                badge:
                    delta === null
                        ? undefined
                        : delta === 0
                          ? '持平'
                          : `${delta > 0 ? '↑' : '↓'} ${Math.abs(delta)}%`,
                badgeTone:
                    delta === null || delta === 0
                        ? 'neutral'
                        : delta > 0
                          ? 'up'
                          : 'down',
                icon: 'i-lucide-log-in',
                label: '今日登录',
                series: stats.loginsDailyNew,
                value: stats.loginsToday,
            },
            {
                badge: `今日 ${stats.logsToday} 条`,
                icon: 'i-lucide-history',
                label: '累计操作日志',
                series: stats.logsDailyNew,
                value: stats.logsTotal,
            },
            {
                badge: `岗位 ${stats.postsCount} 个`,
                icon: 'i-lucide-building-2',
                label: '组织规模',
                value: stats.deptsCount,
            },
        ];
    });

    /**
     * 「查看全部」入口与路由守卫同判据：无该模块可见菜单时不出入口。
     * 最近动态取 7 条、公告 5 条：动态单行约 50px、公告两行约 68px，
     * 两卡内容高度基本齐平，并排时不出现整块底部空白。
     */
    const viewAllPaths = computed(() => {
        const visiblePaths = collectMenuPaths(menus.value ?? []);

        return {
            activity: visiblePaths.has(ACTIVITY_PATH)
                ? ACTIVITY_PATH
                : undefined,
            notices: visiblePaths.has(NOTICES_PATH) ? NOTICES_PATH : undefined,
        };
    });

    const activityItems = computed(() =>
        (data.value?.recentLogs ?? []).slice(0, 7),
    );
    const noticeItems = computed(() => data.value?.latestNotices ?? []);

    const ready = computed(
        () =>
            !isPending.value &&
            !isError.value &&
            Boolean(data.value) &&
            Boolean(auth.user),
    );
</script>

<template>
    <!-- 整页错误态（接口挂掉整页不白屏：错误 + 重试） -->
    <div
        v-if="isError"
        class="flex min-h-[50vh] items-center justify-center"
        data-dashboard-stagger="1"
    >
        <UEmpty
            :actions="[
                {
                    label: '重试',
                    color: 'neutral',
                    icon: 'i-lucide-rotate-ccw',
                    size: 'sm',
                    variant: 'outline',
                    onClick: () => void refetch(),
                },
            ]"
            :description="error?.message"
            icon="i-lucide-inbox"
            title="概览加载失败"
            variant="naked"
        />
    </div>

    <!-- 整页骨架：布局与真实内容一致（圆角对齐 UCard 的 rounded-lg，杜绝加载→内容替换瞬间跳变） -->
    <div
        v-else-if="!ready"
        aria-busy="true"
        aria-label="加载中…"
        class="mx-auto flex w-full max-w-7xl flex-col gap-6"
    >
        <USkeleton class="h-32 rounded-lg" />
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <USkeleton
                v-for="index in 4"
                :key="index"
                class="h-36 rounded-lg"
            />
        </div>
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <USkeleton class="h-96 rounded-lg lg:col-span-2" />
            <USkeleton class="h-96 rounded-lg" />
        </div>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <USkeleton
                v-for="index in 2"
                :key="index"
                class="h-80 rounded-lg"
            />
        </div>
    </div>

    <div v-else class="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <!-- 页头：欢迎横幅（问候 + 日期/天气 + 快捷入口） -->
        <div data-dashboard-stagger="1">
            <WelcomeBanner :user="auth.user!" />
        </div>

        <!-- KPI 行（4 张卡：图标徽标 + 标题 + 右侧 badge + 大数字 + 底部通栏趋势带） -->
        <div
            class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
            data-dashboard-stagger="2"
        >
            <KpiCard
                v-for="card in kpiCards"
                :key="card.label"
                :badge="card.badge"
                :badge-tone="card.badgeTone"
                :icon="card.icon"
                :label="card.label"
                :series="card.series"
                :value="card.value"
            />
        </div>

        <!-- 主图表卡（2/3，卡头右侧时间范围切换）+ 角色占比卡（1/3，等高自适应） -->
        <div
            class="grid grid-cols-1 gap-4 lg:grid-cols-3"
            data-dashboard-stagger="3"
        >
            <!-- 卡体（ui.body 覆盖为 flex-1 列容器）让图表吃掉剩余高度，两卡等高 -->
            <UCard
                class="dashboard-card flex flex-col lg:col-span-2"
                :ui="{ body: 'flex min-h-0 flex-1 flex-col gap-3' }"
            >
                <template #header>
                    <div
                        class="flex flex-nowrap items-center justify-between gap-3"
                    >
                        <span
                            class="text-highlighted min-w-0 truncate text-base font-semibold"
                        >
                            登录趋势
                        </span>
                        <UTabs
                            v-model="rangeModel"
                            aria-label="时间范围"
                            class="shrink-0"
                            :content="false"
                            :items="rangeItems"
                            size="sm"
                        />
                    </div>
                </template>

                <!-- 小结带：浅底成组，与下方图表拉开层次（值随所选区间变化） -->
                <div
                    class="bg-elevated/50 flex items-center gap-6 rounded-lg px-4 py-2.5"
                >
                    <template
                        v-for="(stat, index) in summaryStats"
                        :key="stat.label"
                    >
                        <span
                            v-if="index > 0"
                            aria-hidden
                            class="h-8 w-px"
                            style="background: var(--ui-border)"
                        />
                        <div class="flex flex-col gap-0.5">
                            <span class="text-muted text-xs">{{
                                stat.label
                            }}</span>
                            <NumberFlow
                                :value="stat.value"
                                class="text-highlighted text-lg leading-6 font-semibold tabular-nums"
                            />
                        </div>
                    </template>
                </div>
                <LoginTrendChart :series="trendSeries" />
            </UCard>

            <UCard
                class="dashboard-card flex flex-col"
                :ui="{ body: 'flex min-h-0 flex-1 flex-col' }"
            >
                <template #header>
                    <span class="text-highlighted text-base font-semibold">
                        角色占比
                    </span>
                </template>

                <RoleDistributionChart :slices="data?.roleDistribution ?? []" />
            </UCard>
        </div>

        <!-- 最近动态 + 最新公告（各 1/2） -->
        <div
            class="grid grid-cols-1 gap-4 md:grid-cols-2"
            data-dashboard-stagger="4"
        >
            <RecentActivityCard
                :items="activityItems"
                :view-all-to="viewAllPaths.activity"
            />
            <LatestNoticesCard
                :items="noticeItems"
                :view-all-to="viewAllPaths.notices"
            />
        </div>
    </div>
</template>
