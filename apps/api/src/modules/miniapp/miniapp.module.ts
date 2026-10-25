import { Module } from '@nestjs/common';

/**
 * 微信客户接口入口，预留 /api/miniapp 前缀；客户认证和业务接口尚未实现。
 * 后续功能模块及其路由在此端独立装配，不引入后台员工控制器。
 */
@Module({})
export class MiniappModule {}
