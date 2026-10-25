<script setup lang="ts">
    import { computed } from 'vue';

    import type { User } from '@/lib/api-types';
    import { buildProfileLinks, openExternalLink } from '@/lib/profile-links';

    /**
     * 个人链接单元格：网站用 lucide 通用图标；GitHub / X 品牌图形走 Simple Icons。
     */
    const props = defineProps<{
        /**
         * 当前用户的安全资料与授权快照。
         */
        user: User;
    }>();

    const links = computed(() => buildProfileLinks(props.user));

    function iconFor(key: string) {
        if (key === 'website') return 'i-lucide-house';
        if (key === 'github') return 'i-logos-github-icon';

        return 'i-logos-x';
    }

    function linkTitle(key: string, url: string, name: string) {
        return `${name} ${key} · ${url}`;
    }
</script>

<template>
    <span v-if="links.length === 0" class="text-muted text-sm">—</span>
    <div v-else class="flex items-center justify-center gap-1">
        <UTooltip
            v-for="link in links"
            :key="link.key"
            :text="
                linkTitle(
                    link.labelText,
                    link.url,
                    user.displayName || user.username,
                )
            "
        >
            <UButton
                :aria-label="link.labelText"
                :icon="iconFor(link.key)"
                color="neutral"
                size="xs"
                variant="ghost"
                @click="openExternalLink(link.url)"
            />
        </UTooltip>
    </div>
</template>
