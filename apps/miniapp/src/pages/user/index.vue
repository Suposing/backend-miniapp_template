<template>
    <view h-screen flex="~ col">
        <view
            relative
            class="after:content-[''] after:absolute after:top-[-450rpx] after:left-1/2 after:w-[1400rpx] after:h-[900rpx] after:z-[-1] after:rounded-full after:bg-[#2e6083] after:[transform:translateX(-50%)]"
        >
            <wd-navbar
                fixed
                placeholder
                safe-area-inset-top
                left-arrow
                :bordered="false"
                title="个人中心"
                custom-class="!bg-transparent"
                custom-style="--wot-navbar-color:#fff"
                @click-left="backOr"
            />
            <view
                relative
                z="1"
                h="[316rpx]"
                m="[60rpx_30rpx_0]"
                p="[32rpx_0_52rpx_32rpx]"
                shrink="0"
                rounded="[32rpx]"
                border="solid [2rpx] [#ffffffcc]"
                bg="#ffffff4d"
                shadow="[0_6rpx_72rpx_0_#10653333]"
                backdrop-blur="[48rpx]"
            >
                <view class="flex items-center">
                    <wd-avatar
                        src="https://jzcdn.hnkddj.cn/uploads/images/20251024/20251024132556e2d4c3177.jpeg"
                    />
                    <view class="text-base text-white ml-2"> 183333 </view>
                </view>
                <view class="flex justify-between mt-[32rpx]">
                    <view>
                        132
                        <view
                            class="text-base text-white font-medium mt-[10rpx]"
                        >
                            当前余额(元)
                        </view>
                    </view>
                </view>
            </view>
        </view>
    </view>
</template>

<script lang="ts" setup>
    definePage({
        style: {
            navigationStyle: 'custom',
            navigationBarTitleText: '个人中心',
        },
    });

    onShow(() => {});
</script>
