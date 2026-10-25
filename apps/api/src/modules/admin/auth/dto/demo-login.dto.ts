import { IsIn } from 'class-validator';

/**
 * 模板保留的演示账号类别；当前服务不会据此签发会话。
 */
export const DEMO_LOGIN_KINDS = ['admin', 'random'] as const;
/**
 * 演示入口保留的参数类型；当前服务始终拒绝该入口。
 */
export type DemoLoginKind = (typeof DEMO_LOGIN_KINDS)[number];

/**
 * 模板保留的演示登录请求；当前 API 始终拒绝该入口。
 */
export class DemoLoginDto {
    /**
     * 模板保留的演示账号类别；当前基础模板 API 未启用演示登录。
     */
    @IsIn(DEMO_LOGIN_KINDS)
    kind!: DemoLoginKind;
}
