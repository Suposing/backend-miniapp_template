/**
 * GitHub 贡献热力图的数据类型。
 */

export type ContributionLevel = 0 | 1 | 2 | 3 | 4;

/**
 * GitHub 活跃度演示中的每日贡献数据。
 */
export type Contribution = {
    /**
     * 当前统计日期，按接口或数据源的日界约定解释。
     */
    date: string;
    /**
     * 当前统计项的数量。
     */
    count: number;
    /**
     * 贡献数量对应的展示强度等级。
     */
    level: ContributionLevel;
};

/**
 * 活跃度演示中的仓库贡献摘要。
 */
export type RepoContribution = {
    /**
     * 记录或选项的展示名称。
     */
    name: string;
    /**
     * 当前统计项的数量。
     */
    count: number;
    /**
     * 仓库 logo 图片地址；缺省显示名称首字母
     */
    logo?: string;
    /**
     * 点击后访问的链接目标。
     */
    href?: string;
};

/**
 * 将贡献日期格式化为悬停提示文案的回调。
 */
export type FormatDay = (day: Contribution) => string;
/**
 * 将活跃度统计值格式化为标题的回调。
 */
export type FormatHeading = (total: number, year: number | null) => string;
/**
 * 活跃度演示视图切换按钮的中文标签。
 */
export type ToggleLabels = {
    /**
     * 展开内容时使用的按钮文案。
     */
    show: string;
    /**
     * 收起内容时使用的按钮文案。
     */
    hide: string;
};
