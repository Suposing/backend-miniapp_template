import type { PermissionItem } from '@app/shared/api';
import { Injectable } from '@nestjs/common';
import { Permissions as PermissionsEnum } from '../../../db/schema/permissions.enum';

export type { PermissionItem } from '@app/shared/api';

/**
 * 从项目权限枚举提供操作名称、位值和图标，不查询数据库。
 */
@Injectable()
export class PermissionsService {
    /**
     * 返回 PERMISSIONS 全量枚举列表。
     * 直接从 permissions.enum.ts 读取（编译期常量），不查询数据库。
     * bits 为 bigint，转换为 number 返回（当前所有位 ≤ 512，在安全整数范围内）。
     */
    list(): PermissionItem[] {
        return (
            Object.values(PermissionsEnum) as {
                value: string;
                label: string;
                bits: bigint;
                icon: string;
            }[]
        ).map((p) => ({
            value: p.value,
            label: p.label,
            bits: Number(p.bits),
            icon: p.icon,
        }));
    }
}
