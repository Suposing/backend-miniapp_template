import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { db } from './client';
import type { Prisma } from '../generated/prisma/client';
/**
 * 将分页入参归一为页码、每页条数和 Prisma 偏移量。
 *
 * @param query 页码从 1 开始；默认第 1 页，每页 20 条，每页上限 200
 * @returns 分页参数及 skip、take
 */
export function paging(query: { page?: number; pageSize?: number } = {}) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(200, Math.max(1, Number(query.pageSize) || 20));
    return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}
/**
 * 将当前页结果和匹配总数组装为统一分页响应。
 *
 * @param data 当前页记录
 * @param total 匹配条件的全部记录数
 * @param query 用于还原页码和每页条数的查询参数
 */
export function paged<T>(
    data: T[],
    total: number,
    query: { page?: number; pageSize?: number },
) {
    const { page, pageSize } = paging(query);
    return {
        data,
        pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
        },
    };
}
/**
 * 检查账号启用、未删除且关联了启用的超级管理员角色；空用户 ID 返回 false。
 */
export async function isSuperAdmin(userId: string | null) {
    if (!userId) return false;
    return Boolean(
        await db.userRoles.findFirst({
            where: {
                userId,
                roleRef: { code: 'super_admin', enabled: true },
                userRef: { deletedAt: null, status: 'active' },
            },
        }),
    );
}
/**
 * 对敏感授权操作执行实时超级管理员校验。
 *
 * @throws {ForbiddenException} 账号不具备有效超级管理员身份时抛出
 */
export async function requireSuperAdmin(userId: string | null) {
    if (!(await isSuperAdmin(userId)))
        throw new ForbiddenException({
            code: 'FORBIDDEN',
            message: '该授权操作需要超级管理员权限',
        });
}
/**
 * 将可 JSON 序列化的业务上下文转为 Prisma JSON 入参，bigint 转成十进制字符串。
 * 不负责脱敏；调用方应事先排除密码、令牌和密钥。
 */
export function jsonValue(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(
        JSON.stringify(value, (_, v: unknown) =>
            typeof v === 'bigint' ? v.toString() : v,
        ),
    ) as Prisma.InputJsonValue;
}
/**
 * 记录一条操作审计，必要详情先转为 JSON；该写入不自动加入调用方业务事务。
 *
 * @param action 稳定的业务动作标识
 * @param userId 操作人内部用户 ID；null 用于系统动作
 * @param detail 已排除敏感值的业务上下文；省略时不写详情
 */
export async function audit(
    action: string,
    userId: string | null,
    detail?: unknown,
) {
    await db.logs.create({
        data: {
            type: 'operation',
            action,
            userId,
            detail: detail === undefined ? undefined : jsonValue(detail),
        },
    });
}
/**
 * 以统一 VALIDATION_ERROR 错误码终止不符合业务约束的请求。
 */
export function invalid(message: string): never {
    throw new BadRequestException({ code: 'VALIDATION_ERROR', message });
}
/**
 * 为非空关键词构造 Prisma 不区分大小写的包含查询；空值表示不增加该条件。
 */
export function contains(value?: string) {
    return value
        ? { contains: value, mode: 'insensitive' as const }
        : undefined;
}

/**
 * 限制排序字段为白名单中的字段，其余使用默认字段；仅 asc 使用升序，其余降序。
 */
export function sortBy(
    sort: string | undefined,
    order: string | undefined,
    allowed: string[],
    fallback: string,
) {
    return {
        [sort && allowed.includes(sort) ? sort : fallback]:
            order === 'asc' ? ('asc' as const) : ('desc' as const),
    };
}
