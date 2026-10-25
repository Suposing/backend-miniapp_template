import {
    IsBoolean,
    IsInt,
    IsOptional,
    IsString,
    Length,
    Matches,
    Min,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * PUT /api/admin/menus/:id 请求体
 */
export class UpdateMenuDto {
    /**
     * 菜单中文显示名称。省略表示不修改。
     */
    @IsOptional()
    @IsString()
    @Length(1, 20)
    label?: string;

    /**
     * Lucide 图标名，按管理端约定保存不带 i-lucide- 前缀的名称。省略表示不修改。
     */
    @IsOptional()
    @IsString()
    @Length(1, 30)
    icon?: string;

    /**
     * 菜单路由或外部链接；空字符串保存为 null，表示没有直接跳转目标。省略表示不修改。
     */
    @IsOptional()
    @IsString()
    @Length(0, 200)
    to?: string;

    /**
     * 父级 ID；组织中 null 表示顶层，省略字段按创建或更新规则处理。
     */
    @IsOptional()
    @IsString()
    parentId?: string;

    /**
     * 菜单排序值，导航各层按值降序；管理树可按请求选择升序或降序。
     */
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    sort?: number;

    /**
     * 是否缓存页面组件状态，创建默认 false。省略表示不修改。
     */
    @IsOptional()
    @IsBoolean()
    keepAlive?: boolean;

    /**
     * 是否在导航中隐藏，创建默认 false；隐藏不等于撤销接口授权。省略表示不修改。
     */
    @IsOptional()
    @IsBoolean()
    hideInMenu?: boolean;

    /**
     * 是否启用；创建时默认 true。省略表示不修改。
     */
    @IsOptional()
    @IsBoolean()
    enabled?: boolean;

    /**
     * 目录是否默认展开，创建默认 false。省略表示不修改。
     */
    @IsOptional()
    @IsBoolean()
    defaultOpen?: boolean;

    /**
     * 菜单声明的操作权限位十进制字符串，创建默认 0；通过字符串传输避免精度丢失。省略表示不修改。
     */
    @IsOptional()
    @IsString()
    @Matches(/^-?\d+$/, { message: 'permissions 必须为整数位掩码' })
    permissions?: string;
}
