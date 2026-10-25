<script setup lang="ts">
    import type { StatsSeriesPoint } from '@/lib/api-types';

    import { computed, useId } from 'vue';

    import AreaChart from '@/components/chart/AreaChart.vue';
    import { chartTooltipNode } from '@/lib/chart-theme';

    import { AXIS_DIVISIONS, axisScale } from './chart-geometry';

    /**
     * 将登录计数映射为 Unovis 面积趋势图，提供日期刻度和安全的 DOM 悬停提示。
     * 纵轴使用显式整数范围，避免计数出现小数刻度。
     */

    /**
     * 传给封装的数据形状：在契约原点上补一个数值型 index 供 x 轴使用
     */
    interface TrendPoint extends StatsSeriesPoint {
        /**
         * 当前项在展示列表中的下标。
         */
        index: number;
    }

    const props = defineProps<{
        /**
         * 按日期或显示顺序排列的趋势数据。
         */
        series: StatsSeriesPoint[];
    }>();

    /**
     * 渐变 id 必须每实例唯一：多标签页 KeepAlive 下同组件会有多个实例，写死会串色
     */
    const gradientId = `login-trend-${useId()}`;

    /**
     * 注入库容器 `<defs>` 的原始 SVG（库的 svgDefs 只收字符串）。色值必须写在 style 上
     * ——SVG 呈现属性位不解析 CSS 变量，stop-color="var(--ui-primary)" 不生效。
     */
    const svgDefs = `<linearGradient id="${gradientId}" x1="0" x2="0" y1="0" y2="1">
  <stop offset="0%" style="stop-color: var(--ui-primary); stop-opacity: 0.32"/>
  <stop offset="100%" style="stop-color: var(--ui-primary); stop-opacity: 0.02"/>
</linearGradient>`;

    const data = computed<TrendPoint[]>(() =>
        props.series.map((point, index) => ({ ...point, index })),
    );

    const yDomain = computed<[number, number]>(() => {
        const max = Math.max(...props.series.map((point) => point.count), 0);

        return [0, axisScale(max).top || AXIS_DIVISIONS];
    });

    const x = (point: TrendPoint) => point.index;
    const y = (point: TrendPoint) => point.count;
    const color = () => `url(#${gradientId})`;
    /**
     * 描边必须是实色：填充用了渐变，而库的 lineColor 缺省跟随 color 会被染淡
     */
    const LINE_COLOR = 'var(--ui-primary)';

    function xTickFormat(value: number): string {
        return props.series[Math.round(value)]?.date ?? '';
    }

    function tooltip(point: TrendPoint): HTMLElement {
        return chartTooltipNode(point.date, `${'登录次数'}：${point.count}`);
    }
</script>

<template>
    <div class="dashboard-trend-glow h-full min-h-56 w-full flex-1">
        <AreaChart
            :color="color"
            :data="data"
            :line="true"
            :line-color="LINE_COLOR"
            :svg-defs="svgDefs"
            :tooltip="tooltip"
            :x="x"
            :x-tick-format="xTickFormat"
            :y="y"
            :y-domain="yDomain"
            aria-label="登录趋势"
        />
    </div>
</template>
