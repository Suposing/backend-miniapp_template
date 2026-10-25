<script setup lang="ts">
    import NumberFlow, { NumberFlowGroup } from '@number-flow/vue';
    import { computed, ref, watch } from 'vue';

    import DemoControl from '../DemoControl.vue';
    import DemoSection from '../DemoSection.vue';
    import DemoSlider from '../DemoSlider.vue';
    import DemoStage from '../DemoStage.vue';
    import PlaygroundPage from '../PlaygroundPage.vue';
    import { useDemoActive } from '../use-demo-active';

    import { numberFlowMeta } from './meta';

    const LIVE_INTERVAL_MS = 1500;
    const COUNTDOWN_SECONDS = 90;
    const STEPPER_MIN = 0;
    const STEPPER_MAX = 999_999;
    const LIVE_INITIAL = 1_284;
    const STEPPER_INITIAL = 1_250;

    /**
     * 有界随机游走：模拟在线人数等实时指标的自然波动。
     */
    function nextLiveValue(current: number) {
        const delta = Math.round((Math.random() - 0.45) * 60);

        return Math.max(120, Math.min(9_999, current + delta));
    }

    /**
     * 演示场 › 数字动画 › Number Flow：官方 `@number-flow/vue`。
     * 实时数字 / 倒计时（Group 同步）/ 计数输入（货币 + 后缀）/ 滑块联动（百分比）。
     * Dashboard（Phase C）KPI 数字滚动直接复用本依赖。定时器随 `useDemoActive` 停摆 / 重启。
     */

    const active = useDemoActive();

    // ---------------- 实时数字 ----------------
    const liveRunning = ref(true);
    const liveValue = ref(LIVE_INITIAL);

    watch(
        [active, liveRunning],
        ([on, running], _prev, onCleanup) => {
            if (!on || !running) return;
            const timer = setInterval(() => {
                liveValue.value = nextLiveValue(liveValue.value);
            }, LIVE_INTERVAL_MS);

            onCleanup(() => clearInterval(timer));
        },
        { immediate: true },
    );

    // ---------------- 倒计时 ----------------
    const seconds = ref(COUNTDOWN_SECONDS);
    const countdownRunning = ref(false);
    const countdownActive = computed(
        () => countdownRunning.value && seconds.value > 0,
    );
    const minutes = computed(() => Math.floor(seconds.value / 60));
    const remainder = computed(() => seconds.value % 60);

    // 每 tick 重排一次 setTimeout（依赖 seconds）：归零自然停摆
    watch(
        [active, countdownActive, seconds],
        ([on, running], _prev, onCleanup) => {
            if (!on || !running) return;
            const timer = setTimeout(() => {
                seconds.value -= 1;
            }, 1000);

            onCleanup(() => clearTimeout(timer));
        },
        { immediate: true },
    );

    function resetCountdown() {
        countdownRunning.value = false;
        seconds.value = COUNTDOWN_SECONDS;
    }

    // ---------------- 计数输入 ----------------
    const stepper = ref(STEPPER_INITIAL);

    function adjust(delta: number) {
        stepper.value = Math.max(
            STEPPER_MIN,
            Math.min(STEPPER_MAX, stepper.value + delta),
        );
    }

    function randomize() {
        stepper.value = Math.round(Math.random() * STEPPER_MAX * 0.2);
    }

    // ---------------- 滑块联动 ----------------
    const percent = ref(42);
</script>

<template>
    <PlaygroundPage :meta="numberFlowMeta">
        <DemoSection
            description="每 1.5 秒随机游走一次，模拟在线人数波动；切到其他标签页时定时器随 keepAlive 暂停。"
            title="实时数字"
        >
            <template #controls>
                <UButton
                    :icon="liveRunning ? 'i-lucide-pause' : 'i-lucide-play'"
                    :label="liveRunning ? '暂停' : '开始'"
                    color="neutral"
                    size="sm"
                    variant="subtle"
                    @click="liveRunning = !liveRunning"
                />
            </template>
            <DemoStage>
                <div class="flex flex-col items-center gap-1">
                    <NumberFlow
                        :value="liveValue"
                        class="text-5xl font-bold tabular-nums"
                    />
                    <span class="text-sm text-muted"> 当前在线 </span>
                </div>
            </DemoStage>
        </DemoSection>

        <DemoSection
            description="NumberFlowGroup 让分与秒同步动画，digits 限制秒的十位最大为 5，趋势固定向下。"
            title="倒计时"
        >
            <template #controls>
                <UButton
                    :disabled="seconds === 0"
                    :icon="countdownActive ? 'i-lucide-pause' : 'i-lucide-play'"
                    :label="countdownActive ? '暂停' : '开始'"
                    color="neutral"
                    size="sm"
                    variant="subtle"
                    @click="countdownRunning = !countdownRunning"
                />
                <UButton
                    label="重置"
                    color="neutral"
                    icon="i-lucide-rotate-ccw"
                    size="sm"
                    variant="ghost"
                    @click="resetCountdown"
                />
            </template>
            <DemoStage>
                <NumberFlowGroup>
                    <div
                        class="flex items-baseline text-5xl font-bold tabular-nums"
                    >
                        <NumberFlow
                            :format="{ minimumIntegerDigits: 2 }"
                            :trend="-1"
                            :value="minutes"
                        />
                        <span class="mx-1 text-muted">:</span>
                        <NumberFlow
                            :digits="{ 1: { max: 5 } }"
                            :format="{ minimumIntegerDigits: 2 }"
                            :trend="-1"
                            :value="remainder"
                        />
                    </div>
                </NumberFlowGroup>
            </DemoStage>
        </DemoSection>

        <DemoSection
            description="加减与随机按钮驱动同一数值：左侧货币格式跟随当前语言，右侧带单位后缀。"
            title="计数输入"
        >
            <template #controls>
                <UButton
                    aria-label="减少"
                    color="neutral"
                    icon="i-lucide-minus"
                    size="sm"
                    variant="subtle"
                    @click="adjust(-100)"
                />
                <UButton
                    aria-label="增加"
                    color="neutral"
                    icon="i-lucide-plus"
                    size="sm"
                    variant="subtle"
                    @click="adjust(100)"
                />
                <UButton
                    label="随机"
                    color="neutral"
                    icon="i-lucide-shuffle"
                    size="sm"
                    variant="ghost"
                    @click="randomize"
                />
            </template>
            <DemoStage class="gap-10">
                <div class="flex flex-col items-center gap-1">
                    <NumberFlow
                        :format="{ style: 'currency', currency: 'CNY' }"
                        locales="zh-CN"
                        :value="stepper"
                        class="text-4xl font-bold tabular-nums"
                    />
                    <span class="text-sm text-muted">
                        货币格式（跟随语言）
                    </span>
                </div>
                <div class="flex flex-col items-center gap-1">
                    <NumberFlow
                        locales="zh-CN"
                        suffix=" 件"
                        :value="stepper"
                        class="text-4xl font-bold tabular-nums"
                    />
                    <span class="text-sm text-muted"> 带单位后缀 </span>
                </div>
            </DemoStage>
        </DemoSection>

        <DemoSection
            description="拖动滑块，百分比与换算后的容量实时滚动。"
            title="滑块联动"
        >
            <template #controls>
                <DemoControl label="进度">
                    <DemoSlider
                        v-model="percent"
                        label="进度"
                        :max="100"
                        :min="0"
                        class="w-64"
                    />
                </DemoControl>
            </template>
            <DemoStage class="gap-10">
                <NumberFlow
                    :format="{ style: 'percent', maximumFractionDigits: 0 }"
                    :value="percent / 100"
                    class="text-4xl font-bold tabular-nums"
                />
                <NumberFlow
                    :format="{
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                    }"
                    :value="(percent / 100) * 512"
                    class="text-4xl font-bold tabular-nums"
                    suffix=" GB"
                />
            </DemoStage>
        </DemoSection>
    </PlaygroundPage>
</template>
