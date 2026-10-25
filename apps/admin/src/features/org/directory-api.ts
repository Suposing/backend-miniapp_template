import type { DirectoryEntry } from '@/lib/api-types';
import type { ListQueryParams } from '@/lib/api-types';

import { fetchApiList } from '@/lib/api-client';

/**
 * 人员通讯录 API 层（阶段 2，GET /org/directory，
 * 遵循当前组件的 directory-api.ts）。
 *
 * - 全员视图实时联查（users × depts × user_posts × posts），无缓存延迟；
 * - deptId 筛选含所选组织的全部下级组织人员；
 * - employmentStatus 缺省 employed（离职人员默认不展示，可显式传 resigned / all）。
 */

/**
 * 通讯录列表查询 key 前缀（列表失效用）
 */
export const DIRECTORY_QUERY_KEY = ['org', 'directory', 'list'] as const;

/**
 * 通讯录查询参数
 */
export interface DirectoryListParams extends ListQueryParams {
    /**
     * 所属或筛选组织的内部 ID。
     */
    deptId?: string;
    /**
     * 查询或确认使用的关键词，具体含义由当前接口决定。
     */
    keyword?: string;
    /**
     * 在职状态：employed 在职、resigned 离职，与账号启停独立；空值处理由具体接口决定。
     */
    employmentStatus?: 'employed' | 'resigned' | 'all';
    /**
     * 保留的排序字段；当前 API 通讯录固定按姓名升序。
     */
    sort?: string;
    /**
     * 排序方向或展示顺序，按当前结构约定使用。
     */
    order?: 'asc' | 'desc';
}

/**
 * GET /org/directory — 人员通讯录（分页）
 */
export function fetchDirectory(params: DirectoryListParams = {}) {
    return fetchApiList<DirectoryEntry>('/org/directory', params);
}
