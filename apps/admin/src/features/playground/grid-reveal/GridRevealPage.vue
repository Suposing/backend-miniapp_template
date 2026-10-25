<script setup lang="ts">
    import { computed, ref, watch } from 'vue';

    import DemoControl from '../DemoControl.vue';
    import DemoSection from '../DemoSection.vue';
    import DemoSegmented from '../DemoSegmented.vue';
    import DemoSlider from '../DemoSlider.vue';
    import PlaygroundPage from '../PlaygroundPage.vue';
    import { useDemoActive } from '../use-demo-active';

    import { generateArtworkDataUrl } from './artwork';
    import GridReveal from './GridReveal.vue';
    import { gridRevealMeta } from './meta';

    type AspectKey = '1:1' | '4:3' | '16:9';
    type Phase = 'idle' | 'generating' | 'done';

    const ASPECTS: Record<AspectKey, number> = {
        '1:1': 1,
        '4:3': 4 / 3,
        '16:9': 16 / 9,
    };
    const ASPECT_OPTIONS = (Object.keys(ASPECTS) as AspectKey[]).map((id) => ({
        id,
        label: id,
    }));

    /**
     * 模拟生成的进度步长（ms）。
     */
    const TICK_MS = 80;

    /**
     * 演示场 › Ai Kit › Grid Reveal（canvas 二分网格 + 图片均色揭示，CSS 说明条动画）。
     * 模拟生成（进度驱动 + 本地 canvas 出图）/ 受控进度（滑块）。演示图完全本地生成，无外链依赖。
     */

    const active = useDemoActive();

    // ---------------- 模拟 AI 出图 ----------------
    const phase = ref<Phase>('idle');
    const seed = ref(1);
    const progress = ref(0);
    const src = ref<string | null>(null);
    const revealed = ref(false);
    const aspect = ref<AspectKey>('4:3');
    const durationSec = ref(4);

    // 每 tick 重排 setTimeout（依赖 progress）：进度满时在回调内一次性切换到 done
    watch(
        [active, phase, progress],
        ([on, currentPhase], _prev, onCleanup) => {
            if (!on || currentPhase !== 'generating') return;
            const timer = setTimeout(() => {
                const next = Math.min(
                    1,
                    progress.value + TICK_MS / (durationSec.value * 1000),
                );

                progress.value = next;
                if (next >= 1) {
                    src.value = generateArtworkDataUrl(seed.value);
                    phase.value = 'done';
                }
            }, TICK_MS);

            onCleanup(() => clearTimeout(timer));
        },
        { immediate: true },
    );

    function generate() {
        seed.value += 1;
        src.value = null;
        revealed.value = false;
        progress.value = 0;
        phase.value = 'generating';
    }

    const generating = computed(() => phase.value === 'generating');
    const caption = computed(() =>
        generating.value
            ? `AI 正在生成 ${Math.round(progress.value * 100)}%`
            : phase.value === 'done'
              ? '生成完成'
              : '等待生成…',
    );

    // ---------------- 受控进度 ----------------
    const percent = ref(30);
</script>

<template>
    <PlaygroundPage :meta="gridRevealMeta">
        <DemoSection
            description="点击后进度 0→100% 驱动网格拆分，进度满即「图片到达」（本地 canvas 生成、无外链），组件以图片落地为完成信号。"
            title="模拟生成"
        >
            <template #controls>
                <UButton
                    :disabled="generating"
                    :icon="
                        phase === 'idle'
                            ? 'i-lucide-sparkles'
                            : 'i-lucide-rotate-ccw'
                    "
                    :label="phase === 'idle' ? '生成图像' : '重新生成'"
                    size="sm"
                    @click="generate"
                />
                <DemoControl label="宽高比">
                    <DemoSegmented
                        v-model="aspect"
                        label="宽高比"
                        :options="ASPECT_OPTIONS"
                    />
                </DemoControl>
                <DemoControl label="时长">
                    <DemoSlider
                        v-model="durationSec"
                        :format-options="{ style: 'unit', unit: 'second' }"
                        label="时长"
                        :max="10"
                        :min="2"
                    />
                </DemoControl>
                <UBadge
                    v-if="revealed"
                    label="已揭示"
                    color="success"
                    size="sm"
                    variant="soft"
                />
            </template>
            <div class="mx-auto w-full max-w-xl">
                <GridReveal
                    alt="本地生成的渐变光斑演示图"
                    :aspect="ASPECTS[aspect]"
                    :caption="caption"
                    :estimated-duration="durationSec * 1000"
                    :progress="generating ? progress : undefined"
                    :src="src"
                    @reveal-complete="revealed = true"
                />
            </div>
        </DemoSection>

        <DemoSection
            description="不传图片、只用滑块驱动 progress，观察网格拆分节奏；上限 0.9 留给图片落地。"
            title="受控进度"
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
            <div class="mx-auto w-full max-w-md">
                <GridReveal
                    :aspect="16 / 9"
                    :progress="percent / 100"
                    :src="null"
                />
            </div>
        </DemoSection>
    </PlaygroundPage>
</template>
