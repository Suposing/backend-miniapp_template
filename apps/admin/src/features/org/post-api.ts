import type {
    DeptStatus,
    DirectoryEntry,
    Post,
    PostCategory,
    PostCreateInput,
    PostUpdateInput,
} from '@/lib/api-types';
import type { ListQueryParams } from '@/lib/api-types';

import { ApiClientError, fetchApi, fetchApiList } from '@/lib/api-client';

/**
 * 岗位管理 API 层（阶段 2，/org/posts*，遵循当前组件的 post-api.ts）。
 *
 * - 岗位仅作组织数据，不参与权限聚合；
 * - 同一组织下岗位名称未删除间唯一（409 POST_NAME_EXISTS）；
 * - 删除校验在职人员（409 POST_HAS_ACTIVE_USERS，message 携带人数）；
 * - deptId 筛选含所选组织的全部下级组织岗位。
 */

/**
 * 岗位列表查询 key 前缀（列表失效用）
 */
export const POSTS_QUERY_KEY = ['org', 'posts', 'list'] as const;

/**
 * 岗位列表查询参数
 */
export interface PostListParams extends ListQueryParams {
    /**
     * 所属或筛选组织的内部 ID。
     */
    deptId?: string;
    /**
     * 查询或确认使用的关键词，具体含义由当前接口决定。
     */
    keyword?: string;
    /**
     * 岗位类别：management 管理、professional 专业、production 生产。
     */
    category?: PostCategory;
    /**
     * 岗位启停状态：enabled 启用、disabled 停用。
     */
    status?: DeptStatus;
    /**
     * 岗位排序字段，由 API 白名单限制。
     */
    sort?: string;
    /**
     * 排序方向或展示顺序，按当前结构约定使用。
     */
    order?: 'asc' | 'desc';
}

/**
 * GET /org/posts — 岗位列表（分页）
 */
export function fetchPosts(params: PostListParams = {}) {
    return fetchApiList<Post>('/org/posts', params);
}

/**
 * POST /org/posts — 新增岗位
 */
export function createPost(input: PostCreateInput) {
    return fetchApi<Post>('/org/posts', { method: 'POST', body: input });
}

/**
 * PUT /org/posts/:id — 编辑岗位
 */
export function updatePost(id: string, input: PostUpdateInput) {
    return fetchApi<Post>(`/org/posts/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: input,
    });
}

/**
 * DELETE /org/posts/:id — 删除岗位（在职人员 409 拦截；软删并清理 user_posts）
 */
export function deletePost(id: string) {
    return fetchApi<null>(`/org/posts/${encodeURIComponent(id)}`, {
        method: 'DELETE',
    });
}

/**
 * GET /org/posts/:id/members — 在职人数穿透（分页；仅在职且未删除用户）
 */
export function fetchPostMembers(id: string, page = 1, pageSize = 10) {
    return fetchApiList<DirectoryEntry>(
        `/org/posts/${encodeURIComponent(id)}/members`,
        { page, pageSize },
    );
}

/**
 * 岗位模块错误文案映射：后端 message 仅有中文，按 code 走前端 中文文案
 * （与错误码一一对应；未知 code 回退后端 message）。
 */
export function getPostErrorMessage(error: unknown): string {
    const code = error instanceof ApiClientError ? error.code : undefined;

    switch (code) {
        case 'POST_NOT_FOUND':
            return '岗位不存在';
        case 'POST_NAME_EXISTS':
            return '该组织下岗位名称已存在';
        case 'POST_HAS_ACTIVE_USERS':
            return '该岗位下存在在职人员，请先调岗或离职处理';
        case 'DEPT_NOT_FOUND':
            return '所属组织不存在或已停用';
        default:
            return error instanceof Error ? error.message : String(error);
    }
}
