<script setup lang="ts">
    import { ref } from 'vue';

    import DemoColorSwatches from '../DemoColorSwatches.vue';
    import DemoControl from '../DemoControl.vue';
    import DemoSection from '../DemoSection.vue';
    import DemoSegmented from '../DemoSegmented.vue';
    import DemoStage from '../DemoStage.vue';
    import PlaygroundPage from '../PlaygroundPage.vue';
    import { DEMO_ACCENTS } from '../demo-palette';

    import FluidOrb from './FluidOrb.vue';
    import { fluidOrbMeta } from './meta';

    type OrbSize = 'sm' | 'md' | 'lg';

    /**
     * 尺寸用分段而非滑块：size 变更会重建着色器程序，拖拽连续触发没有意义。
     */
    const ORB_SIZES: Record<OrbSize, number> = { sm: 160, md: 240, lg: 320 };
    const SIZE_OPTIONS: {
        /**
         * 当前实体或选项的内部标识。
         */
        id: OrbSize;
        /**
         * 界面展示的中文名称或控件标签。
         */
        label: string;
    }[] = [
        { id: 'sm', label: 'S' },
        { id: 'md', label: 'M' },
        { id: 'lg', label: 'L' },
    ];

    /**
     * 多色组合区固定展示的三枚小球。
     */
    const ORB_TRIO = [
        DEMO_ACCENTS[0],
        DEMO_ACCENTS[1],
        DEMO_ACCENTS[3],
    ] as const;

    /**
     * 演示场 › Ai Kit › Fluid Orb（原生 WebGL 片元着色器 fbm 噪声流体，零依赖）。
     * RAF 循环随 `useDemoActive` 暂停 / 重建。
     */

    const color = ref<string>(DEMO_ACCENTS[0]);
    const size = ref<OrbSize>('md');
</script>

<template>
    <PlaygroundPage :meta="fluidOrbMeta">
        <DemoSection
            description="切换颜色与尺寸；渲染循环在 effect 内，切走页面即暂停。"
            title="流体光球"
        >
            <template #controls>
                <DemoControl label="颜色">
                    <DemoColorSwatches
                        v-model="color"
                        :colors="DEMO_ACCENTS"
                        label="颜色"
                    />
                </DemoControl>
                <DemoControl label="尺寸">
                    <DemoSegmented
                        v-model="size"
                        label="尺寸"
                        :options="SIZE_OPTIONS"
                    />
                </DemoControl>
            </template>
            <DemoStage class="min-h-96">
                <FluidOrb :color="color" :size="ORB_SIZES[size]" />
            </DemoStage>
            <p class="text-xs text-muted">
                需要浏览器支持 WebGL；不支持时该区域为空白。
            </p>
        </DemoSection>

        <DemoSection
            description="同一着色器、三个 u_color 输入，并排展示。"
            title="多色组合"
        >
            <DemoStage class="gap-10">
                <FluidOrb
                    v-for="hex in ORB_TRIO"
                    :key="hex"
                    :color="hex"
                    :size="128"
                />
            </DemoStage>
        </DemoSection>
    </PlaygroundPage>
</template>
