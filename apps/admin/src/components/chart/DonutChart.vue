<script setup lang="ts" generic="Datum extends object">
    import { computed } from 'vue';

    import {
        VisDonut,
        VisDonutSelectors,
        VisSingleContainer,
        VisTooltip,
    } from '@unovis/vue';

    import { chartColor } from '@/lib/chart-theme';

    /**
     * 环形图封装（Unovis）。
     *
     * 圆心读数走库的 `centralLabel` / `centralSubLabel`，由库按几何算圆心 —— 这是换掉
     * 手写 SVG 的收益之一：nuxt-charts 的 default slot 覆盖层恒在容器 50%，内置图例又
     * 会把圆心 cy 顶上去，得在组件外测图例高度做补偿。
     *
     * 图例不在本封装内：库的 `VisBulletLegend` 是独立件、官方示例也放在图表容器之外
     * （放外面正好不占图表几何，不会把圆心顶偏），由调用方直接用它。
     */

    const props = withDefaults(
        defineProps<{
            /**
             * 环形图使用的原始分类切片列表。
             */
            data: Datum[];
            /**
             * 读取单个切片数量的回调，数值决定该分类所占角度。
             */
            value: (datum: Datum) => number;
            /**
             * 生成悬停内容，动态文本宜返回 HTMLElement；字符串仅用于可信静态 HTML，不能拼入未过滤业务文本。
             */
            tooltip: (datum: Datum) => HTMLElement | string;
            /**
             * 环形图中心的主要文本。
             */
            centralLabel?: string;
            /**
             * 环形图中心的补充文本。
             */
            centralSubLabel?: string;
            /**
             * 环带厚度（像素）。库默认 20，`0` 即退化为饼图
             */
            arcWidth?: number;
            /**
             * 扇区间隙角，单位「度」——库的 padAngle 用弧度，这里换算以免调用方踩单位
             */
            padAngleDeg?: number;
            /**
             * 根据原始分类记录和下标返回该切片颜色；省略时由 chartColor 派生。
             */
            color?: (datum: Datum, index: number) => string;
            /**
             * 供辅助技术读取的图表或控件说明。
             */
            ariaLabel?: string;
        }>(),
        {
            centralLabel: undefined,
            centralSubLabel: undefined,
            arcWidth: 20,
            padAngleDeg: 2,
            color: (datum: Datum, index: number) => chartColor(index),
            ariaLabel: undefined,
        },
    );

    const padAngle = computed(() => (props.padAngleDeg * Math.PI) / 180);

    const tooltipTriggers = {
        /**
         * 库给扇区触发器的是 d3 的 PieArcDatum（原始数据在 `.data`、数值在 `.value`），
         * 直接当原始切片用会拿到 undefined。这里统一拆包，对外仍暴露原始 datum。
         */
        [VisDonutSelectors.segment]: (arc: {
            /**
             * 图表库传入的扇区对应的原始分类记录。
             */
            data: Datum;
        }) => props.tooltip(arc.data),
    };
</script>

<template>
    <div class="chart-theme h-full min-h-0 w-full">
        <VisSingleContainer :data="data" :aria-label="ariaLabel">
            <VisDonut
                :data="data"
                :value="value"
                :color="color"
                :arc-width="arcWidth"
                :pad-angle="padAngle"
                :central-label="centralLabel"
                :central-sub-label="centralSubLabel"
            />
            <VisTooltip :triggers="tooltipTriggers" />
        </VisSingleContainer>
    </div>
</template>
