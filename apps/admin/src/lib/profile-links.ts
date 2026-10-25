/**
 * 个人链接（/1.5.3）展示工具：AuthUser / User 的三个裸值字段
 * 拼接为可访问 URL。前缀规则集中此处，变更只改这一处。
 */

export type ProfileLinkKey = 'website' | 'github' | 'x';

/**
 * 账户资料中的社交主页展示项。
 */
export interface ProfileLinkItem {
    /**
     * 用于识别当前项的稳定键。
     */
    key: ProfileLinkKey;
    /**
     * 拼接后的完整 https URL
     */
    url: string;
    /**
     * 菜单/悬浮提示的 中文文案 key（layout.user.link*）
     */
    labelText: string;
}

/**
 * 个人链接最小形状（AuthUser / User 均满足）
 */
export interface ProfileLinksSource {
    /**
     * 个人网站裸域名或路径；展示时由前端补充协议，null 表示未设置。
     */
    website?: string | null;
    /**
     * GitHub 用户名裸值；null 表示未设置。
     */
    githubUsername?: string | null;
    /**
     * X 用户名裸值；null 表示未设置。
     */
    xUsername?: string | null;
}

/**
 * 按固定顺序（主页 → GitHub → X）拼出已填写的链接列表，全空返回空数组
 */
export function buildProfileLinks(user: ProfileLinksSource): ProfileLinkItem[] {
    const items: ProfileLinkItem[] = [];

    if (user.website) {
        items.push({
            key: 'website',
            url: `https://${user.website}`,
            labelText: '个人主页',
        });
    }
    if (user.githubUsername) {
        items.push({
            key: 'github',
            url: `https://github.com/${user.githubUsername}`,
            labelText: 'GitHub',
        });
    }
    if (user.xUsername) {
        items.push({
            key: 'x',
            url: `https://x.com/${user.xUsername}`,
            labelText: 'X',
        });
    }

    return items;
}

/**
 * 新窗口打开外部链接（noopener 防反向标签劫持）
 */
export function openExternalLink(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer');
}
