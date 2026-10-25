<template>
    <view h-screen flex="~ col">
        <view class="flex-none">
            <wd-navbar
                fixed
                placeholder
                safe-area-inset-top
                left-arrow
                :bordered="false"
                @click-left="backOr"
            />
        </view>
    </view>
</template>

<script lang="ts" setup>
    definePage({
        style: {
            navigationStyle: 'custom',
            navigationBarTitleText: '登录',
        },
    });

    onShow(() => {});
</script>

<style lang="scss" scoped></style>
