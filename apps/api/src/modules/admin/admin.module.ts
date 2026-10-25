import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { AccountModule } from './account/account.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { MenusModule } from './menus/menus.module';
import { PermissionsModule } from './permissions/permissions.module';
import { DictModule } from './dict/dict.module';
import { LogsModule } from './logs/logs.module';
import { OrgModule } from './org/org.module';
import { NoticeModule } from './notice/notice.module';
import { StatsModule } from './stats/stats.module';
import { DemoReadonlyGuard } from './auth/guards/demo-readonly.guard';
import { LoggingInterceptor } from './interceptors/logging.interceptor';

/**
 * 后台功能模块清单，同时用于模块装配、路由前缀与接口文档范围。
 */
export const ADMIN_FEATURE_MODULES = [
    AuthModule,
    AccountModule,
    UsersModule,
    RolesModule,
    MenusModule,
    PermissionsModule,
    DictModule,
    LogsModule,
    OrgModule,
    NoticeModule,
    StatsModule,
];

/**
 * 内部员工管理入口；全局守卫和审计只处理带 AdminController 标记的接口。
 */
@Module({
    imports: ADMIN_FEATURE_MODULES,
    providers: [
        { provide: APP_GUARD, useClass: DemoReadonlyGuard },
        { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    ],
})
export class AdminModule {}
