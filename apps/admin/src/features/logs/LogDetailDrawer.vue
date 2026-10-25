<script setup lang="ts">
    import type { Log } from '@/lib/api-types';

    import { computed } from 'vue';

    import { logOperator } from './log-api';
    import { logTypeColor } from './log-type';

    import UserInfo from '@/components/common/UserInfo.vue';
    import { formatDateTime } from '@/lib/format-date';

    /**
     * 日志详情抽屉：展示单条日志完整字段。
     * 数据直接来自列表行（列表/详情同构），无独立加载态。
     */
    const props = defineProps<{
        /**
         * 由父组件控制的弹窗或抽屉开关。
         */
        open: boolean;
        /**
         * 详情目标日志（列表行数据与详情接口同构，直接复用免二次请求）
         */
        log: Log | null;
        /**
         * 类型显示名（由页面按字典解析后传入）
         */
        typeLabel: string;
    }>();

    const emit = defineEmits<{
        /**
         * 弹窗或抽屉开关变化时回传新值，供父组件同步状态。
         */
        'update:open': [value: boolean];
    }>();

    function close() {
        emit('update:open', false);
    }

    const operator = computed(() =>
        props.log ? logOperator(props.log) : null,
    );
    const createdAt = computed(() =>
        props.log ? formatDateTime(props.log.createdAt) : '',
    );
    const detailJson = computed(() =>
        props.log?.detail == null
            ? null
            : JSON.stringify(props.log.detail, null, 2),
    );
</script>

<template>
    <USlideover
        :open="open"
        :ui="{ content: 'w-104 max-w-[85vw]' }"
        title="日志详情"
        @update:open="(value: boolean) => !value && close()"
    >
        <template #body>
            <div v-if="log" class="flex flex-col gap-4">
                <div class="flex min-w-0 flex-col gap-1">
                    <span class="text-muted text-xs"> 类型 </span>
                    <span class="flex">
                        <UBadge
                            :color="logTypeColor(log.type)"
                            :label="typeLabel"
                            variant="soft"
                        />
                    </span>
                </div>

                <div class="flex min-w-0 flex-col gap-1">
                    <span class="text-muted text-xs"> 操作人 </span>
                    <UserInfo v-if="operator" :user="operator" />
                    <span v-else class="text-muted text-sm">—</span>
                </div>

                <div class="flex min-w-0 flex-col gap-1">
                    <span class="text-muted text-xs"> 动作 </span>
                    <span class="text-sm break-all">{{ log.action }}</span>
                </div>

                <div class="flex min-w-0 flex-col gap-1">
                    <span class="text-muted text-xs"> IP </span>
                    <span class="text-muted text-sm">{{ log.ip ?? '—' }}</span>
                </div>

                <div class="flex min-w-0 flex-col gap-1">
                    <span class="text-muted text-xs"> User-Agent </span>
                    <span class="text-muted text-xs break-all">
                        {{ log.userAgent ?? '—' }}
                    </span>
                </div>

                <div class="flex min-w-0 flex-col gap-1">
                    <span class="text-muted text-xs"> 创建时间 </span>
                    <span class="text-sm">{{ createdAt }}</span>
                </div>

                <div class="flex min-w-0 flex-col gap-1">
                    <span class="text-muted text-xs"> 附加信息 </span>
                    <span v-if="detailJson === null" class="text-muted text-sm"
                        >—</span
                    >
                    <pre
                        v-else
                        class="bg-elevated/60 overflow-x-auto rounded-md p-3 text-xs leading-relaxed"
                        >{{ detailJson }}</pre>
                </div>
            </div>
        </template>

        <template #footer>
            <UButton
                label="关闭"
                class="w-full justify-center"
                @click="close"
            />
        </template>
    </USlideover>
</template>
