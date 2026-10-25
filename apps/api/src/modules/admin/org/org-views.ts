import { db } from '../../../db/client';
import { invalid } from '../../../db/helpers';
/**
 * 读取未删除组织，为各组织构造从顶层到当前节点的名称路径；异常断链或循环处停止。
 */
export async function buildDeptPathMap() {
    const rows = await db.depts.findMany({ where: { deletedAt: null } }),
        byId = new Map(rows.map((r) => [r.id, r]));
    const result = new Map<string, string>();
    for (const row of rows) {
        const names = [row.name],
            seen = new Set([row.id]);
        let cur = row;
        while (cur.parentId) {
            const next = byId.get(cur.parentId);
            if (!next || seen.has(next.id)) break;
            names.unshift(next.name);
            seen.add(next.id);
            cur = next;
        }
        result.set(row.id, names.join(' / '));
    }
    return result;
}
/**
 * 返回指定组织 ID 及未删除后代组织 ID，供包含下级的人员和岗位筛选使用。
 */
export async function collectDeptSubtreeIds(id: string) {
    const rows = await db.depts.findMany({ where: { deletedAt: null } });
    const ids = new Set([id]);
    let changed = true;
    while (changed) {
        changed = false;
        for (const row of rows)
            if (row.parentId && ids.has(row.parentId) && !ids.has(row.id)) {
                ids.add(row.id);
                changed = true;
            }
    }
    return [...ids];
}
/**
 * 校验组织存在且未软删除；不检查启停状态。
 *
 * @throws {BadRequestException} 组织不存在时抛出统一校验错误
 */
export async function assertValidDeptId(id: string) {
    if (!(await db.depts.findFirst({ where: { id, deletedAt: null } })))
        invalid('组织不存在');
}
/**
 * 校验去重后的全部岗位 ID 存在且未软删除；不检查启停状态。
 */
export async function assertValidPostIds(ids: string[]) {
    if (
        (await db.posts.count({
            where: { id: { in: ids }, deletedAt: null },
        })) !== new Set(ids).size
    )
        invalid('岗位不存在');
}
/**
 * 按人员、组织含下级、岗位范围合并收件人并去重。
 * 仅包含启用、未删除且在职或未设置在职状态的内部账号。
 */
export async function resolveScopeUserIds(
    targets: { scopeType: string; targetId: string }[],
) {
    const result = new Set<string>();
    for (const scope of targets) {
        if (scope.scopeType === 'user') {
            const user = await db.users.findFirst({
                where: {
                    id: scope.targetId,
                    deletedAt: null,
                    status: 'active',
                    OR: [
                        { employmentStatus: null },
                        { employmentStatus: 'employed' },
                    ],
                },
            });
            if (user) result.add(user.id);
        } else if (scope.scopeType === 'dept') {
            const ids = await collectDeptSubtreeIds(scope.targetId);
            const rows = await db.users.findMany({
                where: {
                    deptId: { in: ids },
                    deletedAt: null,
                    status: 'active',
                    OR: [
                        { employmentStatus: null },
                        { employmentStatus: 'employed' },
                    ],
                },
                select: { id: true },
            });
            rows.forEach((r) => result.add(r.id));
        } else if (scope.scopeType === 'post') {
            const rows = await db.userPosts.findMany({
                where: {
                    postId: scope.targetId,
                    userRef: {
                        deletedAt: null,
                        status: 'active',
                        OR: [
                            { employmentStatus: null },
                            { employmentStatus: 'employed' },
                        ],
                    },
                },
                select: { userId: true },
            });
            rows.forEach((r) => result.add(r.userId));
        }
    }
    return [...result];
}
/**
 * 检查公告范围引用的组织、岗位或人员存在且未软删除；实际可接收性由收件人解析决定。
 */
export async function assertScopeTargets(
    targets: { scopeType: string; targetId: string }[],
) {
    for (const scope of targets) {
        if (scope.scopeType === 'dept') await assertValidDeptId(scope.targetId);
        else if (scope.scopeType === 'post')
            await assertValidPostIds([scope.targetId]);
        else if (
            !(await db.users.findFirst({
                where: { id: scope.targetId, deletedAt: null },
            }))
        )
            invalid('收件人不存在');
    }
}
