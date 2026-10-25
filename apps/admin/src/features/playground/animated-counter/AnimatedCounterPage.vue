<script setup lang="ts">
    import { ref } from 'vue';

    import DemoControl from '../DemoControl.vue';
    import DemoSection from '../DemoSection.vue';
    import DemoSegmented from '../DemoSegmented.vue';
    import DemoSlider from '../DemoSlider.vue';
    import DemoStage from '../DemoStage.vue';
    import DemoSwitch from '../DemoSwitch.vue';
    import PlaygroundPage from '../PlaygroundPage.vue';

    import AnimatedCounter from './AnimatedCounter.vue';
    import type { Grouping } from './animated-counter-utils';
    import { animatedCounterMeta } from './meta';

    const BASIC_INITIAL = 1_024;
    const PRICE_INITIAL = 12_345.67;
    const ODOMETER_INITIAL = 42;
    const BALANCE_INITIAL = 250;

    /**
     * 演示场 › 数字动画 › Animated Counter（按 rare-ui `animated-counter` 视觉重写，CSS 滚轮）。
     * 基础计数 / 格式化（小数 · 前缀 · 分组）/ 里程表与余额（补零 · 负数 · 方向感知）。
     */

    // 基础计数
    const basic = ref(BASIC_INITIAL);
    const duration = ref(0.6);

    // 格式化
    const price = ref(PRICE_INITIAL);
    const grouping = ref<Grouping>('western');
    const groupingOptions: {
        /**
         * 当前实体或选项的内部标识。
         */
        id: Grouping;
        /**
         * 界面展示的中文名称或控件标签。
         */
        label: string;
    }[] = [
        { id: 'western', label: '1,234,567' },
        { id: 'indian', label: '12,34,567' },
    ];

    // 里程表 / 余额
    const odometer = ref(ODOMETER_INITIAL);
    const balance = ref(BALANCE_INITIAL);
    const padded = ref(true);
</script>

<template>
    <PlaygroundPage :meta="animatedCounterMeta">
        <DemoSection
            description="加减、跳 100 或随机；时长滑块控制滚轮 spring 的视觉时长。"
            title="基础计数"
        >
            <template #controls>
                <UButton
                    aria-label="减少"
                    color="neutral"
                    icon="i-lucide-minus"
                    size="sm"
                    variant="subtle"
                    @click="basic -= 1"
                />
                <UButton
                    aria-label="增加"
                    color="neutral"
                    icon="i-lucide-plus"
                    size="sm"
                    variant="subtle"
                    @click="basic += 1"
                />
                <UButton
                    color="neutral"
                    label="+100"
                    size="sm"
                    variant="subtle"
                    @click="basic += 100"
                />
                <UButton
                    label="随机"
                    color="neutral"
                    icon="i-lucide-shuffle"
                    size="sm"
                    variant="ghost"
                    @click="basic = Math.round(Math.random() * 99_999)"
                />
                <DemoControl label="时长">
                    <DemoSlider
                        v-model="duration"
                        :format-options="{
                            style: 'unit',
                            unit: 'second',
                            maximumFractionDigits: 1,
                        }"
                        label="时长"
                        :max="2"
                        :min="0.2"
                        :step="0.1"
                    />
                </DemoControl>
            </template>
            <DemoStage>
                <AnimatedCounter
                    :duration="duration"
                    :value="basic"
                    class="text-5xl font-bold"
                />
            </DemoStage>
        </DemoSection>

        <DemoSection
            description="两位小数 + 货币前缀；分组在西式（三位）与印度式（3-2-2）间切换，列按「距右位数」键控、不重挂载。"
            title="格式化"
        >
            <template #controls>
                <UButton
                    label="随机"
                    color="neutral"
                    icon="i-lucide-shuffle"
                    size="sm"
                    variant="subtle"
                    @click="
                        price = Math.round(Math.random() * 999_999_999) / 100
                    "
                />
                <DemoControl label="千分位分组">
                    <DemoSegmented
                        v-model="grouping"
                        label="千分位分组"
                        :options="groupingOptions"
                    />
                </DemoControl>
            </template>
            <DemoStage>
                <AnimatedCounter
                    :decimals="2"
                    :grouping="grouping"
                    :value="price"
                    class="text-4xl font-bold"
                >
                    <template #prefix>
                        <span class="mr-1 text-2xl text-muted">¥</span>
                    </template>
                </AnimatedCounter>
            </DemoStage>
        </DemoSection>

        <DemoSection
            description="padStart 补零成 6 位里程表；余额跌破零时显示负号并变红，滚轮方向随涨跌反转。"
            title="里程表与余额"
        >
            <template #controls>
                <UButton
                    label="+1 公里"
                    color="neutral"
                    icon="i-lucide-plus"
                    size="sm"
                    variant="subtle"
                    @click="odometer += 1"
                />
                <DemoSwitch v-model="padded" label="补零到 6 位" />
                <UButton
                    label="消费 175"
                    color="neutral"
                    icon="i-lucide-minus"
                    size="sm"
                    variant="subtle"
                    @click="balance -= 175"
                />
                <UButton
                    label="入账 300"
                    color="neutral"
                    icon="i-lucide-plus"
                    size="sm"
                    variant="subtle"
                    @click="balance += 300"
                />
            </template>
            <DemoStage class="gap-10">
                <div class="flex flex-col items-center gap-1">
                    <AnimatedCounter
                        :pad-start="padded ? 6 : 1"
                        :value="odometer"
                        class="rounded-2xl bg-inverted px-4 py-1 font-mono text-4xl font-bold text-inverted"
                        separator=""
                    />
                    <span class="text-sm text-muted"> 里程表 </span>
                </div>
                <div class="flex flex-col items-center gap-1">
                    <AnimatedCounter
                        :class="
                            balance < 0
                                ? 'text-4xl font-bold text-error'
                                : 'text-4xl font-bold text-success'
                        "
                        :decimals="2"
                        :value="balance"
                        prefix="$"
                    />
                    <span class="text-sm text-muted"> 账户余额 </span>
                </div>
            </DemoStage>
        </DemoSection>
    </PlaygroundPage>
</template>
