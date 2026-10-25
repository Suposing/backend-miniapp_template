/**
 * uni-base 模板保留的用户接口示例，当前基础模板 API 未实现这些路径。
 * 不代表微信客户登录、预约、订单或支付已经接入。
 */
import type {
    GetCopyrightResult,
    LoginParams,
    LoginResult,
    ReductionListParams,
    ReductionListResult,
    UserBasisParams,
    UserBasisResult,
    UserPersonResult,
} from '@/apis/types/user';
import type { ResponseData } from '@/types';
import { request } from '@/utils/request';

/**
 * 用户登录接口
 * @param params 登录参数
 * @returns 登录结果
 */
export function Login(params: LoginParams) {
    return request
        .post<ResponseData<LoginResult>>('user/login', params)
        .then((res) => res.data);
}

/**
 * 获取版权信息接口
 * @returns 版权信息
 */
export function GetCopyright() {
    return request
        .post<ResponseData<GetCopyrightResult>>('user/getcopyright', {})
        .then((res) => res.data);
}

/**
 * 获取用户个人信息接口
 * @returns 用户个人信息
 */
export function GetUserPerson() {
    return request
        .post<ResponseData<UserPersonResult>>('user/userperson', {})
        .then((res) => res.data);
}

/**
 * 获取减免信息接口
 * @param params 查询参数
 * @returns 减免信息
 */
export function GetReductionList(params: ReductionListParams) {
    return request
        .post<ResponseData<ReductionListResult>>('user/reductionlist', params)
        .then((res) => res.data);
}

/**
 * 获取基础配置信息接口
 * @param params 查询参数
 * @returns 基础配置信息
 */
export function GetUserBasis(params: UserBasisParams) {
    return request
        .post<ResponseData<UserBasisResult>>('user/basis', params)
        .then((res) => res.data);
}
