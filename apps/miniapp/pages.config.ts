import { defineUniPages } from '@uni-helper/vite-plugin-uni-pages';

export default defineUniPages({
    globalStyle: {
        navigationBarTitleText: '基础模板',
        navigationBarTextStyle: 'black',
        navigationBarBackgroundColor: '#F8F8F8',
        backgroundColor: '#F8F8F8',
    },
    easycom: {
        autoscan: true,
        custom: {},
    },
    subPackages: [
        {
            root: 'bundle',
            pages: [],
        },
    ],
});
