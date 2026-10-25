<script setup lang="ts">
    import type { Contribution } from './github-activity-types';

    import { computed, ref } from 'vue';

    import DemoControl from '../DemoControl.vue';
    import DemoSection from '../DemoSection.vue';
    import DemoSegmented from '../DemoSegmented.vue';
    import DemoSwitch from '../DemoSwitch.vue';
    import PlaygroundPage from '../PlaygroundPage.vue';
    import { DEMO_ACCENTS } from '../demo-palette';

    import GitHubActivity from './GitHubActivity.vue';
    import {
        DEMO_REPOS,
        GITHUB_SCALE,
        buildContributions,
    } from './github-activity-data';
    import { githubActivityMeta } from './meta';

    type Months = '3' | '6' | '12';
    type CellSize = '9' | '11' | '13';
    type AccentKey = 'green' | 'blue' | 'purple' | 'scale';

    const ACCENTS: Record<AccentKey, string | string[]> = {
        green: '#39d353',
        blue: DEMO_ACCENTS[0],
        purple: DEMO_ACCENTS[3],
        scale: [...GITHUB_SCALE],
    };

    const MONTH_OPTIONS = (['3', '6', '12'] as Months[]).map((id) => ({
        id,
        label: id,
    }));
    const CELL_OPTIONS = (['9', '11', '13'] as CellSize[]).map((id) => ({
        id,
        label: `${id}px`,
    }));

    /**
     * 演示场 › GitHub Activity（贡献热力图 + 仓库榜折叠面板，CSS 动画）。
     * 数据为本地确定性生成（seed 固定）+ 静态仓库榜，经 props 注入，不请求 GitHub API。
     */

    const months = ref<Months>('12');
    const cellSize = ref<CellSize>('11');
    const accent = ref<AccentKey>('green');
    const showMonths = ref(true);
    const contributions = buildContributions();

    const accentOptions = computed(() =>
        (Object.keys(ACCENTS) as AccentKey[]).map((id) => ({
            id,
            label: (
                {
                    blue: '蓝',
                    green: 'GitHub 绿',
                    purple: '紫',
                    scale: '五档色阶',
                } as Record<string, string>
            )[id],
        })),
    );

    const dateFormat = computed(
        () => new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium' }),
    );

    function formatDay(day: Contribution) {
        return `${dateFormat.value.format(new Date(`${day.date}T00:00:00`))} · ${day.count} 次贡献`;
    }

    function formatHeading(total: number, year: number | null) {
        return `${year ?? ''} 年共 ${total} 次贡献`;
    }

    const toggleLabels = computed(() => ({
        show: '展开主要仓库',
        hide: '收起主要仓库',
    }));
</script>

<template>
    <PlaygroundPage :meta="githubActivityMeta">
        <DemoSection
            description="数据为本地确定性生成（固定 seed）+ 静态仓库榜，不请求 GitHub API；单色 accent 按透明度分五档，或直接传色阶数组。"
            title="贡献热力图"
        >
            <template #controls>
                <DemoControl label="月份范围">
                    <DemoSegmented
                        v-model="months"
                        label="月份范围"
                        :options="MONTH_OPTIONS"
                    />
                </DemoControl>
                <DemoControl label="格子尺寸">
                    <DemoSegmented
                        v-model="cellSize"
                        label="格子尺寸"
                        :options="CELL_OPTIONS"
                    />
                </DemoControl>
                <DemoControl label="配色">
                    <DemoSegmented
                        v-model="accent"
                        label="配色"
                        :options="accentOptions"
                    />
                </DemoControl>
                <DemoSwitch v-model="showMonths" label="显示月份" />
            </template>
            <div class="flex justify-center overflow-x-auto py-2">
                <GitHubActivity
                    :accent="ACCENTS[accent]"
                    :cell-size="Number(cellSize)"
                    :contributions="contributions"
                    :format-day="formatDay"
                    :format-heading="formatHeading"
                    label="主要贡献仓库："
                    :months="Number(months)"
                    :repos="DEMO_REPOS"
                    :show-months="showMonths"
                    :toggle-labels="toggleLabels"
                    class="border border-default"
                />
            </div>
        </DemoSection>
    </PlaygroundPage>
</template>
