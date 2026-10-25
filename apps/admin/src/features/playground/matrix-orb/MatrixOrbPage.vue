<script setup lang="ts">
    import { computed, ref } from 'vue';

    import DemoColorSwatches from '../DemoColorSwatches.vue';
    import DemoControl from '../DemoControl.vue';
    import DemoSection from '../DemoSection.vue';
    import DemoSegmented from '../DemoSegmented.vue';
    import DemoSlider from '../DemoSlider.vue';
    import DemoStage from '../DemoStage.vue';
    import DemoSwitch from '../DemoSwitch.vue';
    import PlaygroundPage from '../PlaygroundPage.vue';
    import { DEMO_ACCENTS } from '../demo-palette';

    import MatrixOrb from './MatrixOrb.vue';
    import type { MatrixOrbState } from './matrix-orb-types';
    import { matrixOrbMeta } from './meta';

    const ORB_STATES: MatrixOrbState[] = ['idle', 'listening', 'thinking'];

    /**
     * 演示场 › Ai Kit › Matrix Orb（Canvas 2D 点阵光球，零依赖）。
     * idle / listening / thinking 三态平滑混合；listening 振幅可自动包络或手动驱动（对应真实语音电平）。
     */

    const state = ref<MatrixOrbState>('idle');
    const autoLevel = ref(true);
    const level = ref(0.6);
    const dots = ref(11);
    const color = ref<string>(DEMO_ACCENTS[1]);

    const labels = computed<Record<MatrixOrbState, string>>(() => ({
        idle: '待机',
        listening: '聆听',
        thinking: '思考',
    }));
    const stateOptions = computed(() =>
        ORB_STATES.map((id) => ({ id, label: labels.value[id] })),
    );
</script>

<template>
    <PlaygroundPage :meta="matrixOrbMeta">
        <DemoSection
            description="切换状态时按各态权重平滑混合而非硬切；聆听态振幅默认自动包络，关闭后可手动拖动模拟音量。"
            title="状态切换"
        >
            <template #controls>
                <DemoControl label="状态">
                    <DemoSegmented
                        v-model="state"
                        label="状态"
                        :options="stateOptions"
                    />
                </DemoControl>
                <DemoSwitch v-model="autoLevel" label="自动包络" />
                <DemoControl v-if="!autoLevel" label="音量">
                    <DemoSlider
                        v-model="level"
                        :format-options="{ style: 'percent' }"
                        label="音量"
                        :max="1"
                        :min="0"
                        :step="0.05"
                    />
                </DemoControl>
                <DemoControl label="点阵密度">
                    <DemoSlider
                        v-model="dots"
                        label="点阵密度"
                        :max="17"
                        :min="5"
                        :step="2"
                        class="w-36"
                    />
                </DemoControl>
                <DemoControl label="颜色">
                    <DemoColorSwatches
                        v-model="color"
                        :colors="DEMO_ACCENTS"
                        label="颜色"
                    />
                </DemoControl>
            </template>
            <DemoStage class="min-h-80">
                <MatrixOrb
                    :color="color"
                    :dots="dots"
                    :labels="labels"
                    :level="autoLevel ? undefined : level"
                    :size="240"
                    :state="state"
                />
            </DemoStage>
        </DemoSection>

        <DemoSection
            description="同一颜色下三种状态的并排对照。"
            title="三态并列"
        >
            <DemoStage class="gap-10">
                <MatrixOrb
                    v-for="orbState in ORB_STATES"
                    :key="orbState"
                    :color="color"
                    :labels="labels"
                    :size="140"
                    :state="orbState"
                />
            </DemoStage>
        </DemoSection>
    </PlaygroundPage>
</template>
