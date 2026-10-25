<script setup lang="ts">
    defineProps<{
        /**
         * 包 #toolbar 插槽作用域（zoom / zoomIn / zoomOut / reset / fit）
         */
        scope: {
            /**
             * 当前画布缩放比例。
             */
            zoom: number;
            /**
             * 放大画布的回调。
             */
            zoomIn: () => void;
            /**
             * 缩小画布的回调。
             */
            zoomOut: () => void;
            /**
             * 图谱包提供的回到原点回调；本工具栏重置按钮通过事件交由页面处理。
             */
            reset: () => void;
            /**
             * 将完整节点树适配到可视区域的回调。
             */
            fit: () => void;
        };
    }>();

    const emit = defineEmits<{
        /**
         * 工具栏重置请求，交由页面恢复居中适配视图。
         */
        reset: [];
    }>();
</script>

<template>
    <!--
    画布工具栏（#toolbar 插槽自绘 Pill，替换包默认中文按钮）：缩放 / 百分比 / 适应 / 重置。
    重置不接 scope.reset——包的 reset 是回到原点(0,0)（画布模式即左上角），
    本页初始态是页面 fit 的居中适配，重置即向页面回抛 reset 事件。
  -->
    <div
        class="flex items-center gap-1 rounded-full border border-default bg-elevated/90 px-1.5 py-0.5 shadow-sm backdrop-blur"
    >
        <UButton
            aria-label="缩小"
            icon="i-lucide-zoom-out"
            size="sm"
            variant="outline"
            @click="scope.zoomOut()"
        />
        <span class="text-muted w-10 text-center text-xs tabular-nums">
            {{ Math.round(scope.zoom * 100) }}%
        </span>
        <UButton
            aria-label="放大"
            icon="i-lucide-zoom-in"
            size="sm"
            variant="outline"
            @click="scope.zoomIn()"
        />
        <UButton
            aria-label="适应窗口"
            icon="i-lucide-maximize-2"
            size="sm"
            variant="outline"
            @click="scope.fit()"
        />
        <UButton
            aria-label="重置视图"
            icon="i-lucide-rotate-ccw"
            size="sm"
            variant="outline"
            @click="emit('reset')"
        />
    </div>
</template>
