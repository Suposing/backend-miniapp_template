import { applyDecorators, Controller, SetMetadata } from '@nestjs/common';

/**
 * 标识内部员工接口，限定后台演示只读规则和员工审计的作用范围。
 */
export const ADMIN_API_KEY = 'admin_api';

/**
 * 声明后台控制器；端前缀由 RouterModule 统一添加，鉴权仍由各接口声明。
 *
 * @param path 后台模块内的资源路径，例如 users 或 org/depts
 */
export function AdminController(path: string): ClassDecorator {
    return applyDecorators(Controller(path), SetMetadata(ADMIN_API_KEY, true));
}
