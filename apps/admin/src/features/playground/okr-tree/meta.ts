import type { DemoMeta } from '../types';

import { packageVersion } from '../constants';

import { githubUrl } from '@/lib/env';

export const okrTreeMeta: DemoMeta = {
    titleText: '组织架构树',
    descriptionText:
        'react-okr-tree：React 组织架构树 / OKR 树组件，支持根节点左右双向展开（飞书 OKR 布局），连接线由纯 CSS 绘制；本页外观经 --okr-* 变量挂接站点 Design Token，随深浅色切换联动。',
    scenarioText:
        '组织架构图、部门层级展示、OKR 目标拆解、汇报关系图谱等树形结构场景。',
    packages: [
        {
            name: 'vue3-okr-tree',
            version: packageVersion('vue3-okr-tree'),
            github: githubUrl('vue3-okr-tree'),
            docs: 'https://vue3-okr-tree.baiwumm.com',
        },
    ],
    source: 'apps/vue/src/features/playground/okr-tree',
};
