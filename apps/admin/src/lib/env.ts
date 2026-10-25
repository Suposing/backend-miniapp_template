/**
 * 管理端公开配置；构建时写入页面，不能包含服务端密钥。
 */
export const ENV = {
    appName: import.meta.env.VITE_APP_NAME ?? '基础模板',
    appDesc: import.meta.env.VITE_APP_DESC ?? '通用业务管理平台',
    apiBaseUrl:
        import.meta.env.VITE_API_BASE_URL?.trim() ||
        'http://localhost:3000/api/admin',
    repoUrl: '',
    ownerUrl: '',
    ownerName: '基础模板',
    docsUrl: import.meta.env.VITE_DOCS_URL ?? '',
    blogUrl: import.meta.env.VITE_BLOG_URL ?? '',
} as const;
// 上游演示页资料链接，业务功能不依赖外部站点。
/**
 * 构造上游演示组件资料链接，仅供演示页展示使用。
 */
export function githubUrl(slug: string) {
    return 'https://github.com/baiwumm/' + slug;
}
