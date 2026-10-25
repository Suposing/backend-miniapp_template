import { ThemeAnimationType } from 'theme-switch-animation/vue';

/**
 * 15 种主题切换动画类型（顺序与库 `ThemeAnimationType` 的定义顺序一致）。
 *
 * 每项三个字段：类型值（传给库）、卡片提示文案的 中文文案 键、形状示意图标的 iconify 名
 * （`i-lucide-*`，与菜单图标同图标集）。
 * 类型名（CIRCLE / BLINDS / STAR…）本身是技术专名，卡片上保留英文不译，提示文案走 中文文案。
 * 0.2.0 起四向擦除类型（LTR/RTL/TTB/BTT）移除、并入 `direction` 选项，
 * 由 BLINDS / SCAN / QR_GRID 三种条带/格子类型消费；
 * 0.4.0 起 `CIRCLE_REVERT` 移除，"切暗扩散、切亮收起"由 `CIRCLE + reverse: 'auto'`
 * 承接（演示页参数区的「反向揭开」三档控件，对 CIRCLE / FAN / RIPPLE /
 * CLOCK_SWEEP / CURTAIN 五类生效，其余类型传了静默忽略）。
 *
 * 卡片强调色不入本清单：按数组下标循环取 `DEMO_ACCENTS`（与其它演示页同口径——
 * 演示色板是组件参数值，不是项目 Design Token，不参与 §7.3 的 token 约束）。
 */
export const DEMO_ANIMATION_TYPES = [
    {
        type: ThemeAnimationType.CIRCLE,
        hintText: '圆形扩散 · 圆心为触发元素中心',
        icon: 'i-lucide-circle-dot',
    },
    {
        type: ThemeAnimationType.CIRCLE_BLUR,
        hintText: '圆形模糊扩散 · 边缘高斯模糊',
        icon: 'i-lucide-circle-dashed',
    },
    {
        type: ThemeAnimationType.SQUARE,
        hintText: '正方形扩散',
        icon: 'i-lucide-square',
    },
    {
        type: ThemeAnimationType.DIAMOND,
        hintText: '菱形扩散',
        icon: 'i-lucide-diamond',
    },
    {
        type: ThemeAnimationType.RECTANGLE,
        hintText: '矩形扩散 · 贴合视口比例',
        icon: 'i-lucide-rectangle-horizontal',
    },
    {
        type: ThemeAnimationType.HEXAGON,
        hintText: '六边形扩散 · 尖顶朝上',
        icon: 'i-lucide-hexagon',
    },
    {
        type: ThemeAnimationType.TRIANGLE,
        hintText: '三角形扩散 · 顶点朝上',
        icon: 'i-lucide-triangle',
    },
    {
        type: ThemeAnimationType.STAR,
        hintText: '五角星扩散 · 顶点朝上',
        icon: 'i-lucide-star',
    },
    {
        type: ThemeAnimationType.BLINDS,
        hintText: '百叶窗 · 叶片逐条揭开，方向与叶宽可调',
        icon: 'i-lucide-blinds',
    },
    {
        type: ThemeAnimationType.SCAN,
        hintText: '扫描 · 硬边扫开，前缘带半透明光束',
        icon: 'i-lucide-scan-line',
    },
    {
        type: ThemeAnimationType.QR_GRID,
        hintText: '方块格子 · 逐格生长，末帧融为整屏',
        icon: 'i-lucide-grid-3x3',
    },
    {
        type: ThemeAnimationType.RIPPLE,
        hintText: '水滴涟漪 · 环带前缘外推，波长可调，可反向内收',
        icon: 'i-lucide-waves',
    },
    {
        type: ThemeAnimationType.CLOCK_SWEEP,
        hintText: '时钟扇形 · 自 12 点顺时针扫开，可反向逆时针',
        icon: 'i-lucide-clock',
    },
    {
        type: ThemeAnimationType.FAN,
        hintText: '扇叶旋开 · 扇叶数可调，可反向合拢',
        icon: 'i-lucide-fan',
    },
    {
        type: ThemeAnimationType.CURTAIN,
        hintText: '双开门 · 自中线向两侧推开，可反向合拢',
        icon: 'i-lucide-unfold-horizontal',
    },
] as const;

/**
 * 单条动画类型定义
 */
export type DemoAnimationTypeItem = (typeof DEMO_ANIMATION_TYPES)[number];

/**
 * 动画类型联合。从清单推导而非直接引用库的类型：清单是唯一事实源，
 * 增删类型时二者不会漂移（库新增类型时页面会提示清单未覆盖）。
 */
export type DemoAnimationType = DemoAnimationTypeItem['type'];
