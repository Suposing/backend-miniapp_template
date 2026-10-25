<template>
    <button size="mini" @click="toLogin">登录</button>
</template>

<script lang="ts" setup>
    definePage({
        type: 'home',
        style: {
            navigationStyle: 'custom',
            navigationBarTitleText: '首页',
        },
    });

    /**
     * 跳转到登录页
     */
    function toLogin() {
        nav.push('/pages/user/index');
    }
</script>
