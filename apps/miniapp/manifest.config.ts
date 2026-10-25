import process from 'node:process';
import { defineManifestConfig } from '@uni-helper/vite-plugin-uni-manifest';
import { loadEnv } from 'vite';

const env = loadEnv(
    process.env.UNI_NODE_ENV ?? process.env.NODE_ENV ?? 'development',
    process.cwd(),
    'APP_',
);

export default defineManifestConfig({
    name: '基础模板',
    appid: '',
    description: '通用微信小程序基础工程',
    versionName: '1.0.0',
    versionCode: '100',
    transformPx: false,
    'app-plus': {
        usingComponents: true,
        nvueStyleCompiler: 'uni-app',
        compilerVersion: 3,
        splashscreen: {
            alwaysShowBeforeRender: true,
            waiting: true,
            autoclose: true,
            delay: 0,
        },
        modules: {},
        distribute: {
            android: {
                permissions: [
                    '<uses-permission android:name="android.permission.CHANGE_NETWORK_STATE"/>',
                    '<uses-permission android:name="android.permission.MOUNT_UNMOUNT_FILESYSTEMS"/>',
                    '<uses-permission android:name="android.permission.VIBRATE"/>',
                    '<uses-permission android:name="android.permission.READ_LOGS"/>',
                    '<uses-permission android:name="android.permission.ACCESS_WIFI_STATE"/>',
                    '<uses-feature android:name="android.hardware.camera.autofocus"/>',
                    '<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>',
                    '<uses-permission android:name="android.permission.CAMERA"/>',
                    '<uses-permission android:name="android.permission.GET_ACCOUNTS"/>',
                    '<uses-permission android:name="android.permission.READ_PHONE_STATE"/>',
                    '<uses-permission android:name="android.permission.CHANGE_WIFI_STATE"/>',
                    '<uses-permission android:name="android.permission.WAKE_LOCK"/>',
                    '<uses-permission android:name="android.permission.FLASHLIGHT"/>',
                    '<uses-feature android:name="android.hardware.camera"/>',
                    '<uses-permission android:name="android.permission.WRITE_SETTINGS"/>',
                ],
                abiFilters: ['arm64-v8a', 'x86'],
            },
            ios: {
                dSYMs: false,
            },
            sdkConfigs: {
                ad: {},
            },
        },
    },
    'mp-weixin': {
        appid:
            process.env.APP_MP_WEIXIN_APPID ||
            env.APP_MP_WEIXIN_APPID ||
            'touristappid',
        setting: {
            urlCheck: false,
        },
        usingComponents: true,
    },
    uniStatistics: {
        enable: false,
    },
    vueVersion: 3,
});
