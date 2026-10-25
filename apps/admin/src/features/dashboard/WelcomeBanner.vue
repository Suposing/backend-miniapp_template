<script setup lang="ts">
    import type { AuthUser } from '@/lib/api-types';

    import { computed } from 'vue';

    import { useMenus } from '@/composables/use-menus';
    import { collectMenuPaths } from '@/lib/menu-utils';

    /**
     * 欢迎区展示当前日期、问候和当前账号可用的业务入口。
     */

    /**
     * 快捷入口（导航至对应模块页；首个为主操作样式，其余 outline）
     */
    const QUICK_LINKS = [
        {
            icon: 'i-lucide-users',
            labelText: '用户管理',
            to: '/settings/users',
        },
        {
            icon: 'i-lucide-megaphone',
            labelText: '公告管理',
            to: '/org/notices',
        },
        {
            icon: 'i-lucide-scroll-text',
            labelText: '日志管理',
            to: '/settings/logs',
        },
    ] as const;

    /**
     * 按当前小时返回问候 中文文案 键（5 点前凌晨 / 12 点前早安 / 18 点前午安 / 之后晚安）
     */
    function greetingText(hour: number, name: string): string {
        if (hour < 5) return `凌晨好，${name}`;
        if (hour < 12) return `早上好，${name}`;
        if (hour < 18) return `下午好，${name}`;

        return `晚上好，${name}`;
    }

    /**
     * 按时段返回副标题情绪文案 中文文案 键（深夜/清晨/上午/午间/午后/晚间）
     */
    function subtitleText(hour: number): string {
        if (hour < 5) return '夜深了，记得早点休息哟';
        if (hour < 9) return '一日之计在于晨，今天也要元气满满';
        if (hour < 12) return '上午效率正当时，保持专注';
        if (hour < 14) return '午间小憩片刻，下午更有效率';
        if (hour < 18) return '午后时光，劳逸结合';

        return '晚上好，今天辛苦啦';
    }

    defineProps<{
        /**
         * 当前用户的安全资料与授权快照。
         */
        user: AuthUser;
    }>();

    const { data: menus } = useMenus();

    const now = new Date();
    const hour = now.getHours();

    // 与路由守卫同判据：目标路径在用户可见菜单集合内才渲染入口
    const links = computed(() => {
        const visiblePaths = collectMenuPaths(menus.value ?? []);

        return QUICK_LINKS.filter((link) => visiblePaths.has(link.to));
    });

    // 日期与星期分两段取词后按语言习惯连接：zh-CN「9月19日 星期六」、
    // en「Saturday, September 19」，避免默认拼合后的挤压观感
    const dateText = computed(() => {
        const weekdayPart = new Intl.DateTimeFormat('zh-CN', {
            weekday: 'long',
        }).format(now);
        const datePart = new Intl.DateTimeFormat('zh-CN', {
            day: 'numeric',
            month: 'long',
        }).format(now);

        return `${datePart} ${weekdayPart}`;
    });
</script>

<template>
    <UCard class="dashboard-welcome">
        <div
            class="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
        >
            <div class="flex min-w-0 flex-col gap-1">
                <h1
                    class="text-highlighted text-2xl font-semibold tracking-tight"
                >
                    {{ greetingText(hour, user.displayName) }}
                </h1>
                <p class="text-muted text-sm">
                    {{ subtitleText(hour) }}
                </p>
                <div class="mt-2 flex flex-wrap items-center gap-2">
                    <UBadge
                        color="primary"
                        icon="i-lucide-calendar-days"
                        :label="dateText"
                        size="sm"
                        variant="soft"
                    />
                </div>
            </div>
            <nav
                v-if="links.length > 0"
                aria-label="快捷入口"
                class="flex flex-wrap items-center gap-2 lg:justify-end"
            >
                <UButton
                    v-for="(link, index) in links"
                    :key="link.to"
                    :color="index === 0 ? 'primary' : 'neutral'"
                    :icon="link.icon"
                    :label="link.labelText"
                    size="sm"
                    :to="link.to"
                    :variant="index === 0 ? 'solid' : 'outline'"
                />
            </nav>
        </div>
    </UCard>
</template>
