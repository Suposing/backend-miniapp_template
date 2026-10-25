import { IsIn } from 'class-validator';

/**
 * PUT /api/admin/users/:id/status 请求体
 */
export class StatusUpdateDto {
    /**
     * 账号状态：active 正常，disabled 停用；停用会撤销已有会话。
     */
    @IsIn(['active', 'disabled'])
    status!: 'active' | 'disabled';
}
