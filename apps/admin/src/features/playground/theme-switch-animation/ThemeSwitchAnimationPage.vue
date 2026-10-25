<script setup lang="ts">
    import { computed, onMounted, ref } from 'vue';

    import {
        prefersReducedMotion,
        supportsViewTransition,
    } from 'theme-switch-animation';
    import {
        ThemeAnimationDirection,
        ThemeAnimationType,
    } from 'theme-switch-animation/vue';

    import { useDesignThemeStore } from '@/stores/design-theme-store';

    import DemoControl from '../DemoControl.vue';
    import DemoSection from '../DemoSection.vue';
    import DemoSegmented from '../DemoSegmented.vue';
    import DemoSlider from '../DemoSlider.vue';
    import DemoStage from '../DemoStage.vue';
    import PlaygroundPage from '../PlaygroundPage.vue';

    import AlignedTrigger from './AlignedTrigger.vue';
    import AnimationTypeCard from './AnimationTypeCard.vue';
    import {
        DEMO_ANIMATION_TYPES,
        type DemoAnimationType,
    } from './animation-types';
    import { themeSwitchAnimationMeta } from './meta';
    import {
        useDemoThemeAnimation,
        type ReverseMode,
    } from './use-demo-theme-animation';

    const DURATION_RANGE = { min: 200, max: 1500, step: 50 };
    const BLUR_RANGE = { min: 1, max: 10, step: 0.5 };
    /**
     * BLINDS 叶片宽度合法域（库约定 16–200px，越界静默回落默认 72）
     */
    const SLAT_WIDTH_RANGE = { min: 16, max: 200, step: 2 };
    const SLAT_WIDTH_DEFAULT = 72;
    /**
     * RIPPLE 涟漪波长合法域（库约定 8–60px，越界静默回落默认 18）
     */
    const WAVE_WIDTH_RANGE = { min: 8, max: 60, step: 1 };
    const WAVE_WIDTH_DEFAULT = 18;
    /**
     * FAN 扇叶数合法域（库约定 4–16 的整数，越界静默回落默认 8；非整数会让末帧扇叶接缝错位）
     */
    const BLADE_COUNT_RANGE = { min: 4, max: 16, step: 1 };
    const BLADE_COUNT_DEFAULT = 8;

    /**
     * 消费 `direction` 选项的三种属性驱动类型（其余类型传入无效果）
     */
    const DIRECTION_CONSUMING_TYPES: readonly DemoAnimationType[] = [
        ThemeAnimationType.BLINDS,
        ThemeAnimationType.SCAN,
        ThemeAnimationType.QR_GRID,
    ];

    /**
     * 消费 `reverse` 选项的五种类型（0.4.0；`CIRCLE_REVERT` 已并入 `CIRCLE + reverse`）。
     * 形状族与 BLINDS / SCAN / QR_GRID 有意不接入：反向必须动 `mask-size`，
     * 会重新引入已修完的蒙版设备像素对齐抖动。
     */
    const REVERSE_CONSUMING_TYPES: readonly DemoAnimationType[] = [
        ThemeAnimationType.CIRCLE,
        ThemeAnimationType.FAN,
        ThemeAnimationType.RIPPLE,
        ThemeAnimationType.CLOCK_SWEEP,
        ThemeAnimationType.CURTAIN,
    ];

    /**
     * 「反向揭开」三档的控件取值（映射为库取值见 `toLibraryReverse`）。
     */
    const REVERSE_MODES: readonly {
        /**
         * 当前实体或选项的内部标识。
         */
        id: ReverseMode;
    }[] = [{ id: 'off' }, { id: 'on' }, { id: 'auto' }];

    const DIRECTION_PRESETS = [
        ThemeAnimationDirection.LTR,
        ThemeAnimationDirection.RTL,
        ThemeAnimationDirection.TTB,
        ThemeAnimationDirection.BTT,
    ] as const;

    const EASING_PRESETS = [
        { id: 'ease-in-out', label: 'ease-in-out' },
        { id: 'cubic-bezier(0.4, 0, 0.2, 1)', label: 'cubic-bezier' },
        { id: 'linear', label: 'linear' },
    ] as const;

    type EasingId = (typeof EASING_PRESETS)[number]['id'];

    /**
     * `DemoSegmented` 收 `{ id, label }[]`（可变数组），由只读预设映射而来。
     */
    const EASING_OPTIONS: {
        /**
         * 当前实体或选项的内部标识。
         */
        id: EasingId;
        /**
         * 界面展示的中文名称或控件标签。
         */
        label: string;
    }[] = EASING_PRESETS.map((preset) => ({
        id: preset.id,
        label: preset.label,
    }));

    /**
     * 区块三三个触发点的水平对齐类（下标 + 1 即展示序号）。
     */
    const TRIGGER_ALIGNS = [
        'justify-start',
        'justify-center',
        'justify-end',
    ] as const;

    /**
     * 演示场 › 主题切换动画：`theme-switch-animation`（View Transitions API 蒙版揭示）。
     *
     * 与项目既有主题切换（`stores/design-theme-store` 的 clip-path 四向揭示）**并存**：
     * 本页只演示库的 15 种蒙版动画，受控模式接入同一主题 store，不替换业务的主题动画实现。
     */

    const store = useDesignThemeStore();

    const animationType = ref<DemoAnimationType>(ThemeAnimationType.CIRCLE);
    const duration = ref(750);
    const easing = ref<EasingId>('ease-in-out');
    const blurAmount = ref(2);
    const direction = ref<ThemeAnimationDirection>(ThemeAnimationDirection.LTR);
    const slatWidth = ref(SLAT_WIDTH_DEFAULT);
    const waveWidth = ref(WAVE_WIDTH_DEFAULT);
    const bladeCount = ref(BLADE_COUNT_DEFAULT);
    // reverse 默认取 'auto'（切暗扩散、切亮收拢）：保留 0.3.x CIRCLE_REVERT 卡
    // 被移除前的标志性观感；库默认是 false（总是正向）
    const reverse = ref<ReverseMode>('auto');

    /**
     * `DemoSegmented` 收 `{ id, label }[]`（可变数组），方向文案走 中文文案 动态映射。
     */
    const DIRECTION_OPTIONS = computed(() =>
        DIRECTION_PRESETS.map((preset) => ({
            id: preset,
            label: (
                {
                    btt: '从下向上',
                    ltr: '从左向右',
                    rtl: '从右向左',
                    ttb: '从上向下',
                } as Record<string, string>
            )[preset],
        })),
    );

    /**
     * 反向揭开三档文案走 中文文案 动态映射。
     */
    const REVERSE_OPTIONS = computed(() =>
        REVERSE_MODES.map((mode) => ({
            id: mode.id,
            label: (
                { auto: '跟随方向', off: '总是正向', on: '总是反向' } as Record<
                    string,
                    string
                >
            )[mode.id],
        })),
    );

    // 区块二专属实例：以当前参数触发一次切换
    const {
        isAnimating: paramsAnimating,
        triggerRef: paramsTriggerRef,
        toggle: toggleParams,
    } = useDemoThemeAnimation<HTMLDivElement>(() => ({
        animationType: animationType.value,
        blurAmount: blurAmount.value,
        bladeCount: bladeCount.value,
        direction: direction.value,
        duration: duration.value,
        easing: easing.value,
        reverse: reverse.value,
        slatWidth: slatWidth.value,
        waveWidth: waveWidth.value,
    }));

    /**
     * 与页头主题选择器、Logo 深浅色同一状态源，演示页切换后全站同步。
     */
    const isDark = computed(() => store.isDark);

    function selectAnimationType(type: DemoAnimationType): void {
        animationType.value = type;
    }

    // 区块四：能力探测只在客户端执行（渲染阶段不触碰 window / document）
    const env = ref<{
        /**
         * 是否按减少动态效果偏好简化动画。
         */
        reduced: boolean;
        /**
         * 当前浏览器是否支持演示所需的视图过渡能力。
         */
        supported: boolean;
    } | null>(null);

    onMounted(() => {
        env.value = {
            reduced: prefersReducedMotion(window),
            supported: supportsViewTransition(document),
        };
    });
</script>

<template>
    <PlaygroundPage :meta="themeSwitchAnimationMeta">
        <!-- 区块一：15 种动画类型，逐类型点击体验（圆钮即扩散圆心，网格不同位置即不同起点） -->
        <DemoSection
            description="15 张卡片各带一枚独立触发按钮（各自一个 useThemeAnimation 实例）：圆钮即扩散圆心，在网格不同位置点击即可验证扩散起点跟随触发元素；受控模式下所有实例共用同一主题状态源。"
            title="15 种动画类型"
        >
            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <AnimationTypeCard
                    v-for="(item, index) in DEMO_ANIMATION_TYPES"
                    :key="item.type"
                    :blur-amount="blurAmount"
                    :blade-count="bladeCount"
                    :direction="direction"
                    :duration="duration"
                    :easing="easing"
                    :hint-text="item.hintText"
                    :icon="item.icon"
                    :index="index"
                    :reverse="reverse"
                    :slat-width="slatWidth"
                    :type="item.type"
                    :wave-width="waveWidth"
                />
            </div>
        </DemoSection>

        <!-- 区块二：选中一种动画并调节时长 / 缓动 / 模糊强度 / 方向 / 叶宽等，再以该参数触发一次切换 -->
        <DemoSection
            description="先选中一种动画，再调时长 / 缓动（CIRCLE_BLUR 另有模糊强度，BLINDS / SCAN / QR_GRID 另有方向，BLINDS 另有叶宽，RIPPLE / FAN 另有波长 / 扇叶数，CIRCLE 等五类另有反向揭开），点右侧按钮以该参数切换主题；参数对下一次切换立即生效。"
            title="动画参数"
        >
            <template #controls>
                <DemoControl label="时长">
                    <DemoSlider
                        v-model="duration"
                        :format-options="{ style: 'unit', unit: 'millisecond' }"
                        label="时长"
                        :max="DURATION_RANGE.max"
                        :min="DURATION_RANGE.min"
                        :step="DURATION_RANGE.step"
                    />
                </DemoControl>
                <DemoControl label="缓动">
                    <DemoSegmented
                        v-model="easing"
                        label="缓动"
                        :options="EASING_OPTIONS"
                    />
                </DemoControl>
                <DemoControl
                    v-if="animationType === ThemeAnimationType.CIRCLE_BLUR"
                    label="模糊强度"
                >
                    <DemoSlider
                        v-model="blurAmount"
                        label="模糊强度"
                        :max="BLUR_RANGE.max"
                        :min="BLUR_RANGE.min"
                        :step="BLUR_RANGE.step"
                    />
                </DemoControl>
                <DemoControl
                    v-if="DIRECTION_CONSUMING_TYPES.includes(animationType)"
                    label="方向"
                >
                    <DemoSegmented
                        v-model="direction"
                        label="方向"
                        :options="DIRECTION_OPTIONS"
                    />
                </DemoControl>
                <DemoControl
                    v-if="animationType === ThemeAnimationType.BLINDS"
                    label="叶片宽度"
                >
                    <!-- 像素值不传 format-options：Intl 单位无 "pixel"，传入会抛 RangeError -->
                    <DemoSlider
                        v-model="slatWidth"
                        label="叶片宽度"
                        :max="SLAT_WIDTH_RANGE.max"
                        :min="SLAT_WIDTH_RANGE.min"
                        :step="SLAT_WIDTH_RANGE.step"
                    />
                </DemoControl>
                <DemoControl
                    v-if="animationType === ThemeAnimationType.RIPPLE"
                    label="涟漪波长"
                >
                    <DemoSlider
                        v-model="waveWidth"
                        label="涟漪波长"
                        :max="WAVE_WIDTH_RANGE.max"
                        :min="WAVE_WIDTH_RANGE.min"
                        :step="WAVE_WIDTH_RANGE.step"
                    />
                </DemoControl>
                <DemoControl
                    v-if="animationType === ThemeAnimationType.FAN"
                    label="扇叶数"
                >
                    <DemoSlider
                        v-model="bladeCount"
                        label="扇叶数"
                        :max="BLADE_COUNT_RANGE.max"
                        :min="BLADE_COUNT_RANGE.min"
                        :step="BLADE_COUNT_RANGE.step"
                    />
                </DemoControl>
                <DemoControl
                    v-if="REVERSE_CONSUMING_TYPES.includes(animationType)"
                    label="反向揭开"
                >
                    <DemoSegmented
                        v-model="reverse"
                        label="反向揭开"
                        :options="REVERSE_OPTIONS"
                    />
                </DemoControl>
            </template>

            <div class="flex flex-col gap-4">
                <div class="flex flex-col gap-1.5">
                    <span class="text-muted text-xs"> 动画类型 </span>
                    <div class="flex flex-wrap gap-2">
                        <UButton
                            v-for="item in DEMO_ANIMATION_TYPES"
                            :key="item.type"
                            :aria-label="item.type"
                            :label="item.type"
                            :variant="
                                item.type === animationType
                                    ? 'solid'
                                    : 'outline'
                            "
                            class="font-mono text-xs"
                            size="sm"
                            @click="selectAnimationType(item.type)"
                        />
                    </div>
                </div>
                <div ref="paramsTriggerRef" class="flex">
                    <UButton
                        :disabled="paramsAnimating"
                        label="以此动画切换主题"
                        color="neutral"
                        icon="i-lucide-wand-sparkles"
                        variant="soft"
                        @click="toggleParams"
                    />
                </div>
            </div>
        </DemoSection>

        <!-- 区块三：同一动画类型、三个水平位置不同的触发点，验证圆心跟随触发元素中心 -->
        <DemoSection
            description="同一动画类型、三个水平位置不同的触发按钮：新主题自各自按钮中心扩散，位置差异即扩散起点的差异。"
            title="触发点跟随"
        >
            <DemoStage class="flex-col items-stretch justify-between gap-6">
                <AlignedTrigger
                    v-for="(align, position) in TRIGGER_ALIGNS"
                    :key="align"
                    :align="align"
                    :animation-type="animationType"
                    :blur-amount="blurAmount"
                    :blade-count="bladeCount"
                    :direction="direction"
                    :duration="duration"
                    :easing="easing"
                    :index="position + 1"
                    :reverse="reverse"
                    :slat-width="slatWidth"
                    :wave-width="waveWidth"
                />
            </DemoStage>
        </DemoSection>

        <!-- 区块四：运行环境与降级行为，以及「回到跟随系统」的收尾入口 -->
        <DemoSection
            description="本页直接切换全局主题——与页头主题选择器、Logo 深浅色共用同一主题状态源，切换后全站同步；下方徽章是当前运行环境的真实探测结果。"
            title="环境与降级"
        >
            <template #controls>
                <UButton
                    label="回到跟随系统"
                    color="neutral"
                    icon="i-lucide-monitor"
                    size="sm"
                    variant="soft"
                    @click="store.applyThemeModeInstant('system')"
                />
            </template>

            <div class="flex flex-wrap items-center gap-3 text-xs">
                <span
                    class="border-default flex items-center gap-1.5 rounded-full border px-3 py-1"
                >
                    <span
                        :class="[
                            'size-2 rounded-full',
                            env?.supported ? 'bg-success' : 'bg-error',
                        ]"
                    />
                    {{
                        env?.supported
                            ? '支持 View Transitions'
                            : '不支持 View Transitions'
                    }}
                </span>
                <span
                    class="border-default flex items-center gap-1.5 rounded-full border px-3 py-1"
                >
                    <span
                        :class="[
                            'size-2 rounded-full',
                            env?.reduced ? 'bg-warning' : 'bg-accented',
                        ]"
                    />
                    {{
                        env?.reduced
                            ? '已开启「减少动态效果」'
                            : '未开启「减少动态效果」'
                    }}
                </span>
                <span
                    class="border-default flex items-center gap-1.5 rounded-full border px-3 py-1"
                >
                    <UIcon
                        :name="isDark ? 'i-lucide-moon' : 'i-lucide-sun'"
                        class="size-3.5"
                    />
                    {{ isDark ? '当前深色' : '当前浅色' }}
                </span>
            </div>
            <p class="text-muted text-xs">
                浏览器不支持 View Transitions（Safari &lt; 18、Firefox &lt; 144
                等）或系统开启「减少动态效果」时，自动降级为直接切换，主题状态照常正确。
            </p>
        </DemoSection>
    </PlaygroundPage>
</template>
