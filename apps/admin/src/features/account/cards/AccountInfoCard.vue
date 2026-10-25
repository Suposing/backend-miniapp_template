<script setup lang="ts">
    import type { AccountProfile } from '@/lib/api-types';

    import { formatDateTime } from '@/lib/format-date';

    /**
     * 只读账号信息卡：角色 / 状态 / 注册时间 / 最近登录
     */
    defineProps<{
        /**
         * 当前账号资料快照，保存成功后由父组件刷新。
         */
        profile: AccountProfile;
    }>();
</script>

<template>
    <UCard>
        <template #header>
            <h3 class="font-bold">账号信息</h3>
            <p class="text-muted text-xs">
                以下信息由系统与管理员维护，仅供查看
            </p>
        </template>

        <div class="flex flex-col gap-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="text-muted text-sm"> 角色 </span>
                <span
                    v-if="profile.roles.length > 0"
                    class="flex flex-wrap items-center gap-1"
                >
                    <UBadge
                        v-for="role in profile.roles"
                        :key="role.id"
                        :label="role.name"
                        color="neutral"
                        variant="subtle"
                    />
                </span>
                <span v-else class="text-muted text-sm"> 未分配角色 </span>
            </div>

            <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="text-muted text-sm"> 状态 </span>
                <UBadge
                    :color="profile.status === 'active' ? 'success' : 'error'"
                    :label="profile.status === 'active' ? '正常' : '已停用'"
                    variant="soft"
                />
            </div>

            <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="text-muted text-sm"> 注册时间 </span>
                <span class="text-sm">
                    {{ formatDateTime(profile.createdAt) }}
                </span>
            </div>

            <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="text-muted text-sm"> 最近登录 </span>
                <span class="text-sm">
                    {{
                        profile.lastLoginAt
                            ? formatDateTime(profile.lastLoginAt)
                            : '从未登录'
                    }}
                </span>
            </div>
        </div>
    </UCard>
</template>
