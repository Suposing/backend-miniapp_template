import { defineConfig } from '@uni-helper/unh';

export default defineConfig({
    platform: {
        default: 'h5',
        alias: {
            'mp-weixin': ['wx'],
        },
    },
});
