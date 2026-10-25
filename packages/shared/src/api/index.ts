/**
 * 列表接口的分页信息；页码从 1 开始，total 为符合筛选条件的记录总数。
 */
export interface ApiPagination {
    /**
     * 当前页码，从 1 开始。
     */
    page: number;
    /**
     * 每页记录数。
     */
    pageSize: number;
    /**
     * 符合筛选条件的记录总数，不是当前页长度。
     */
    total: number;
}

/**
 * NestJS API 成功响应；分页接口额外提供 pagination。
 */
export interface ApiEnvelope<T = unknown> {
    /**
     * 接口业务数据；无返回内容时由服务端归一为 null。
     */
    data: T;
    /**
     * 服务端分页信息；非分页响应省略。
     */
    pagination?: ApiPagination;
}

/**
 * 分页列表响应，必须同时包含当前页记录和分页信息。
 */
export interface ApiListEnvelope<T> extends ApiEnvelope<T[]> {
    /**
     * 当前页对应的服务端分页信息。
     */
    pagination: ApiPagination;
}

/**
 * API 非 2xx 错误响应；HTTP 状态码由传输层保留。
 */
export interface ApiError {
    /**
     * 稳定的业务错误码，例如 UNAUTHORIZED 或 VALIDATION_ERROR。
     */
    code: string;
    /**
     * 可展示给用户的中文错误说明。
     */
    message: string;
}

/**
 * /permissions 返回的单个操作定义；累计授权位另以十进制字符串传输。
 */
export interface PermissionItem {
    /**
     * 权限操作的稳定名称，例如 SEARCH 或 EDIT。
     */
    value: string;
    /**
     * 操作标签；管理端按现有中文展示规则转换。
     */
    label: string;
    /**
     * 单个操作的位值，当前定义均在安全整数范围内。
     */
    bits: number;
    /**
     * 不带前缀的 Lucide 图标名。
     */
    icon: string;
}
