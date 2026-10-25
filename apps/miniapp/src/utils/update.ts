/**
 * 注册小程序更新提示
 * 仅小程序平台会监听新版本更新；新版本准备就绪后提示用户重启应用。
 */
export function setupMiniProgramUpdatePrompt() {
    // #ifdef MP
    const updateManager = uni.getUpdateManager();

    updateManager.onUpdateReady(() => {
        uni.showModal({
            title: '更新提示',
            content: '新版本已经准备好，是否重启应用？',
            success: ({ confirm }) => {
                if (confirm) updateManager.applyUpdate();
            },
        });
    });
    // #endif
}
