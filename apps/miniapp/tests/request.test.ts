import type { InternalAxiosRequestConfig } from 'axios';
import { AxiosError, CanceledError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { instance } from '@/modules/axios';
import pinia from '@/modules/pinia';
import { useAuthStore } from '@/stores/auth';

const { adapter, showToast, emit } = vi.hoisted(() => ({
    adapter: vi.fn(),
    showToast: vi.fn(),
    emit: vi.fn(),
}));

vi.mock('@uni-helper/axios-adapter', () => ({
    createUniAppAxiosAdapter: () => adapter,
}));

beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('uni', { showToast, hideLoading: vi.fn(), $emit: emit });
    useAuthStore(pinia).logout();
    adapter.mockImplementation(async (config: InternalAxiosRequestConfig) => ({
        config,
        status: 200,
        statusText: 'OK',
        headers: {},
        data: { data: { status: 'ok' } },
    }));
});

/**
 * 构造 axios 错误通路，覆盖 NestJS 的 HTTP 错误结构。
 */
function failWith(
    status: number,
    code = 'UNAUTHORIZED',
    message = '登录已过期',
) {
    adapter.mockImplementation(async (config: InternalAxiosRequestConfig) => {
        throw new AxiosError('Request failed', code, config, undefined, {
            config,
            status,
            statusText: 'Error',
            headers: {},
            data: { code, message },
        });
    });
}

describe('基础模板请求协议', () => {
    it('接受不包含 code 的成功响应', async () => {
        expect((await instance.get('/health')).data).toEqual({
            data: { status: 'ok' },
        });
        expect(showToast).not.toHaveBeenCalled();
    });

    it('保留列表与分页信息', async () => {
        const body = {
            data: [{ id: 'one' }],
            pagination: { total: 1, page: 1 },
        };
        adapter.mockImplementation(
            async (config: InternalAxiosRequestConfig) => ({
                config,
                status: 200,
                statusText: 'OK',
                headers: {},
                data: body,
            }),
        );
        expect((await instance.get('/items')).data).toEqual(body);
    });

    it('token 仅进入 Authorization，GET 和 POST 不附加旧业务参数', async () => {
        useAuthStore(pinia).setAccessToken('customer-token');
        await instance.get('/items', { params: { page: 1 } });
        const getConfig = adapter.mock.calls[0][0];
        expect(getConfig.headers.Authorization).toBe('Bearer customer-token');
        expect(getConfig.params).toEqual({ page: 1 });
        const body = { name: '预约测试' };
        await instance.post('/appointments', body);
        expect(JSON.parse(adapter.mock.calls[1][0].data)).toEqual(body);
        expect(body).toEqual({ name: '预约测试' });
    });

    it('401 清除对应会话，并使用后端 message 提示一次', async () => {
        useAuthStore(pinia).setAccessToken('expired-token');
        failWith(401);
        await expect(instance.get('/profile')).rejects.toBeInstanceOf(
            AxiosError,
        );
        expect(useAuthStore(pinia).isLogin).toBe(false);
        expect(showToast).toHaveBeenCalledExactlyOnceWith({
            title: '登录已过期',
            icon: 'none',
        });
    });

    it('较早请求返回 401 时保留新会话', async () => {
        useAuthStore(pinia).setAccessToken('old-token');
        adapter.mockImplementation(
            async (config: InternalAxiosRequestConfig) => {
                useAuthStore(pinia).setAccessToken('new-token');
                throw new AxiosError(
                    'Expired',
                    'UNAUTHORIZED',
                    config,
                    undefined,
                    {
                        config,
                        status: 401,
                        statusText: 'Unauthorized',
                        headers: {},
                        data: { code: 'UNAUTHORIZED', message: '过期' },
                    },
                );
            },
        );
        await expect(instance.get('/profile')).rejects.toBeInstanceOf(
            AxiosError,
        );
        expect(useAuthStore(pinia).accessToken).toBe('new-token');
    });

    it('403 保留会话，静默请求不弹提示', async () => {
        useAuthStore(pinia).setAccessToken('valid-token');
        failWith(403, 'FORBIDDEN', '无权访问');
        await expect(
            instance.get('/restricted', { silentError: true }),
        ).rejects.toBeInstanceOf(AxiosError);
        expect(useAuthStore(pinia).accessToken).toBe('valid-token');
        expect(showToast).not.toHaveBeenCalled();
    });

    it('错误事件不带查询参数、请求体、认证头或响应内容', async () => {
        useAuthStore(pinia).setAccessToken('private-token');
        failWith(400, 'VALIDATION_ERROR', '输入无效');
        await expect(
            instance.post('/example?secret=private', { password: 'private' }),
        ).rejects.toBeInstanceOf(AxiosError);
        expect(emit).toHaveBeenCalledExactlyOnceWith('axios:error', {
            method: 'POST',
            url: '/example',
            status: 400,
            code: 'VALIDATION_ERROR',
        });
    });

    it('取消请求不弹错误提示', async () => {
        adapter.mockRejectedValue(new CanceledError());
        await expect(instance.get('/canceled')).rejects.toBeInstanceOf(
            CanceledError,
        );
        expect(showToast).not.toHaveBeenCalled();
        expect(emit).not.toHaveBeenCalled();
    });
});
