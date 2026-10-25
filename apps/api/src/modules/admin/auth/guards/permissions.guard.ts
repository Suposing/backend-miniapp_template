import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permissions } from '../../../../db/schema/permissions.enum';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import type { AuthUser } from '../auth.service';
/**
 * 接口业务资源标识的元数据键。
 */
export const RESOURCE_KEY = 'permission-resource';
/**
 * 声明接口所属的业务资源路由，供 PermissionsGuard 查询对应的实际授权位。
 */
export const PermissionResource = (resource: string) =>
    SetMetadata(RESOURCE_KEY, resource);
/**
 * 按接口业务资源逐项校验操作权限的守卫。
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}
    /**
     * 逐个校验接口要求的操作位与其业务资源授权；超级管理员直接通过。
     * 未声明操作权限的接口由其他鉴权机制控制；缺少资源配置时拒绝授权。
     */
    canActivate(context: ExecutionContext) {
        const required =
            this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
                context.getHandler(),
                context.getClass(),
            ]) ?? [];
        if (!required.length) return true;
        const user = context
            .switchToHttp()
            .getRequest<{ user?: AuthUser }>().user;
        if (!user) throw new ForbiddenException('无权访问');
        if (user.roles.includes('super_admin')) return true;
        const resource = this.reflector.getAllAndOverride<string>(
            RESOURCE_KEY,
            [context.getHandler(), context.getClass()],
        );
        if (!resource) throw new ForbiddenException('接口未配置业务资源权限');
        const bits = BigInt(user.resourcePermissions[resource] ?? '0');
        for (const name of required) {
            const action = Permissions[name as keyof typeof Permissions];
            if (!action || (bits & action.bits) !== action.bits)
                throw new ForbiddenException({
                    code: 'FORBIDDEN',
                    message: '无该业务模块的操作权限',
                });
        }
        return true;
    }
}
