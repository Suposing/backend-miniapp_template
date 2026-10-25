/**
 * uni-base 模板保留的历史接口类型，当前基础模板 API 不提供这些协议。
 * 金额、时间和距离字段的未注明单位不能推定为新项目业务约定。
 */
/**
 * 用户相关接口入参/出参
 */
/**
 * 登录参数
 */
export interface LoginParams {
    /**
     * 微信登录 code
     */
    code: string;
    /**
     * 解密向量
     */
    iv: string;
    /**
     * 加密的用户信息
     */
    encryptedData: string;
    /**
     * 用户 ID
     */
    id?: string;
    /**
     * 邀请人 ID
     */
    invite_id?: string;
}

/**
 * 用户登录成功返回的用户信息
 */
export interface LoginResult {
    /**
     * 用户昵称
     */
    nickname: string;
    /**
     * 用户头像地址
     */
    avatar_url: string;
    /**
     * 用户 ID
     */
    id: number;
    /**
     * 性别
     * 0：无 1：男 2：女。
     */
    sex: number;
    /**
     * 登录态 Token
     */
    access_token: string;
    /**
     * 用户类型
     * 1 代驾人员；0 普通人员。
     */
    type: number;
    /**
     * 审核状态
     * 0 待审核；1 审核通过；2 审核未通过。
     */
    audit: number;
    /**
     * 账号状态
     * 0 禁止；1 正常。
     */
    status: number;
    /**
     * 是否已绑定（后端约定：0/1）
     */
    is_binding: number;
    /**
     * 手机号（明文）
     */
    phone: string;
    /**
     * 余额
     */
    price: string;
    /**
     * 个性签名
     */
    signature: string;
    /**
     * 资料是否完善  0信息未完善 1信息已完善
     */
    is_complete: number;
    /**
     * 是否已缴纳保证金
     * 0 未交保证金；1 已交保证金。
     */
    is_margin: number;
    /**
     * 是否分销商
     * 0 不是；1 是；2 已禁用分销功能。
     */
    is_distribe: number;
    /**
     * 等级
     */
    level: number;
    /**
     * 积分
     */
    score: string;
    /**
     * 等级图标地址
     */
    level_icon: string;
    /**
     * 脱敏手机号
     */
    sphone: string;
    /**
     * 客服电话
     */
    serverphone: string;
    /**
     * 是否接单/上岗状态
     * 0-休息中;1-接单中.
     */
    hand: number;
}

/**
 * 获取版权信息接口返回数据
 */
export interface GetCopyrightResult {
    /**
     * 版权开关
     * 0-关闭;1-开启
     */
    copyright: number;
    /**
     * 版权规则文案
     */
    copyright_rule: string;
    /**
     * 客服电话
     */
    phone: string;
}

/**
 * 获取用户个人信息接口返回数据
 */
export interface UserPersonResult extends LoginResult {
    /**
     * 等级名称
     */
    level_name: string;
    /**
     * 等级提示文案
     */
    level_tip: string;
    /**
     * 是否会员卡用户
     * 0 非会员卡用户；1 会员卡用户。
     */
    is_card_vip: number;
    /**
     * 会员卡过期时间
     * 格式：YYYY-MM-DD HH:mm:ss
     */
    card_vip_expire_time: string;
    /**
     * 会员卡可用次数
     */
    card_vip_use_times: number;
    /**
     * 会员卡已使用次数
     */
    card_vip_used_times: number;
}

/**
 * 减免信息查询接口入参
 */
export interface ReductionListParams {
    /**
     * 手机号
     */
    phone: number;
}

/**
 * 减免信息查询接口返回数据
 */
export interface ReductionListResult {
    /**
     * 订单数量
     */
    order_count: number;
    /**
     * 是否可减免
     * 0 不可减免；1 可减免。
     */
    is_reduction: number;
    /**
     * 预付款数量
     */
    advance_count: number;
    /**
     * 减免金额
     */
    money: string;
    /**
     * 图片地址
     */
    img: string;
}

/**
 * 获取基础配置接口入参
 */
export interface UserBasisParams {
    /**
     * 行政区划编码
     */
    ad_code: string;
}

/**
 * 基础配置中的规则提示项
 */
export interface UserBasisRuleTip {
    /**
     * 是否开启
     * 0 关闭；1 开启。
     */
    is_open: string;
    /**
     * 规则类型
     */
    type: string;
    /**
     * 金额
     */
    money: string;
    /**
     * 提示文案
     */
    tips: string;
}

/**
 * 获取基础配置接口返回数据
 */
export interface UserBasisResult {
    /**
     * 高德 key
     */
    a_map_key: string;
    /**
     * 百度 key
     */
    b_map_key: string;
    /**
     * 腾讯地图 H5 key
     */
    q_map_h5_key: string;
    /**
     * 腾讯地图小程序 key
     */
    q_map_app_key: string;
    /**
     * 商户 ID
     */
    store_id: number;
    /**
     * 商户名称
     */
    name: string;
    /**
     * 商户账号
     */
    account: string | null;
    /**
     * 商户密码
     */
    password: string | null;
    /**
     * 盐值
     */
    salt: string | null;
    /**
     * 转发图片
     */
    forward: string;
    /**
     * 授权图片
     */
    authorize: string;
    /**
     * 海报图片
     */
    poster: string | null;
    /**
     * 积分抵现
     */
    integral: number;
    /**
     * 积分抵现规则说明
     */
    integral_rule: string;
    /**
     * 是否开启版权说明
     * 0 关闭；1 开启。
     */
    copyright: number;
    /**
     * 版权说明
     */
    copyright_rule: string;
    /**
     * 保单金额（字符串金额）
     */
    secure_price: string;
    /**
     * 客服电话
     */
    phone: string;
    /**
     * 小程序 ID
     */
    acid: number;
    /**
     * 公众号 ID
     */
    uniacid: number;
    /**
     * 是否开启微信支付（后端约定：0/1）
     * 0 关闭；1 开启。
     */
    open_weixin: number;
    /**
     * 现金支付开启系统提成开关
     * 0 关闭；1 开启。
     */
    open_cash_commission: number;
    /**
     * 开启司机下单一口价
     * 0 关闭；1 开启。
     */
    open_one_price: number;
    /**
     * 现金支付系统扣除金额（字符串金额）
     */
    cash_commission: string;
    /**
     * 用户获取积分比例（字符串小数）
     */
    user_integral: string;
    /**
     * 会员获取积分比例（字符串小数）
     */
    vip_integral: string;
    /**
     * 用户登录成长值
     */
    user_login_grow: number;
    /**
     * 会员登录成长值
     */
    vip_login_grow: number;
    /**
     * 用户签到成长值
     */
    user_sign_grow: number;
    /**
     * 会员签到成长值
     */
    vip_sign_grow: number;
    /**
     * 订单金额大于多少可以使用积分（字符串金额）
     */
    integral_max_price: string;
    /**
     * 积分最多抵扣多少元（字符串金额）
     */
    integral_reduce_price: string;
    /**
     * 会员价格
     */
    vip_price: number;
    /**
     * 区域数据（字符串，通常为 JSON 字符串）
     */
    area: string;
    /**
     * 自动确认时间
     */
    confirm_time: number;
    /**
     * 区域限制开关
     * 0 关闭；1 开启。
     */
    area_limit: number;
    /**
     * 会员权益
     */
    vip_rights: string;
    /**
     * 代驾接单范围（字符串）
     */
    scope: string;
    /**
     * 违约金（字符串金额）
     */
    violations: string;
    /**
     * 时间限制（分钟）
     */
    time_limit: number;
    /**
     * 所有者 ID
     */
    belongid: number;
    /**
     * 小程序 logo
     */
    logo: string;
    /**
     * 小程序描述
     */
    desc: string;
    /**
     * 代驾取消设置
     * 0 关闭；1 开启。
     */
    driver_apply_config: number;
    /**
     * 区域限制设置
     * 0 关闭；1 开启。
     */
    area_config: number;
    /**
     * 是否实时计费
     * 0 否；1 是。
     */
    is_online_price: number;
    /**
     * 是否删除
     * 0 未删除；1 已删除。
     */
    is_delete: number;
    /**
     * 现金收款开关
     * 0 关闭；1 开启。
     */
    is_cash: number;
    /**
     * 订单保险金额
     */
    benefits: number;
    /**
     * 开启异常
     * 0 关闭；1 开启。
     */
    open_unusual: number;
    /**
     * 异常金额（字符串金额）
     */
    unusual: string;
    /**
     * 开启异常开关
     * 0 关闭；1 开启。
     */
    open_abnormal: number;
    /**
     * 异常金额（字符串金额）
     */
    abnormal_money: string;
    /**
     * 开启司机处理异常订单功能
     * 0 关闭；1 开启。
     */
    open_driver_abnormal: number;
    /**
     * 是否显示司机列表开关
     * 0 关闭；1 开启。
     */
    open_show_drivers: number;
    /**
     * 订单险开关
     * 0 关闭；1 开启。
     */
    open_benefits: number;
    /**
     * 司机责任险开关
     * 0 关闭；1 开启。
     */
    open_driver_benefits: number;
    /**
     * 司机责任险金额（字符串金额）
     */
    driver_benefits: string;
    /**
     * 发票开关
     * 0 关闭；1 开启。
     */
    open_invoice: number;
    /**
     * 下单目的地限制开关
     * 0 关闭；1 开启。
     */
    open_limit_des: number;
    /**
     * 开启上传图片开关
     * 0 关闭；1 开启。
     */
    open_upload_pic: number;
    /**
     * 显示司机范围
     */
    show_drivers_distance: number;
    /**
     * 是否开启 app 接单
     */
    is_app_order: number;
    /**
     * 是否开启司机专属码下单奖励
     * 0 关闭；1 开启。
     */
    is_open_qr_reward: number;
    /**
     * 奖励金额（字符串金额）
     */
    qr_reward: string;
    /**
     * 是否开启追单
     * 0 关闭；1 开启。
     */
    is_open_append: number;
    /**
     * 是否开启转单
     * 0 关闭；1 开启。
     */
    is_open_switch: number;
    /**
     * 是否显示文章
     * 0 关闭；1 开启。
     */
    is_show_article: number;
    /**
     * 是否开启规定区域内限制下单目的地
     * 0 关闭；1 开启。
     */
    is_end_address_area: number;
    /**
     * 司机注册工号最后数字
     */
    last_worker_number: number;
    /**
     * 是否开启司机修改金额开关
     * 0 关闭；1 开启。
     */
    is_driver_modifyMoney: number;
    /**
     * 是否开启自动取消订单开关
     * 0 关闭；1 开启。
     */
    is_auto_cancelOrder: number;
    /**
     * 自动取消订单超时时间（分钟）
     */
    timeOut_cancelOrder: number;
    /**
     * 是否开启拨打司机电话
     * 0 关闭；1 开启。
     */
    is_call_driver: number;
    /**
     * 是否开启修改司机姓名
     * 0 关闭；1 开启。
     */
    is_update_driver_name: number;
    /**
     * 司机工号前缀
     */
    prefix_worker_number: string;
    /**
     * 上报车辆信息开关
     * 0 关闭；1 开启。
     */
    open_car_info: number;
    /**
     * 取消订单开关
     * 0 关闭；1 开启。
     */
    is_cancel_order: number;
    /**
     * 用户端查看路线
     * 0 关闭；1 开启。
     */
    is_user_check_way: number;
    /**
     * 司机端查看路线
     * 0 关闭；1 开启。
     */
    is_driver_check_way: number;
    /**
     * 是否开启了司机会员卡功能
     * 0 关闭；1 开启。
     */
    is_driver_vip: number;
    /**
     * 普通用户积分兑换比例
     */
    score_ratio: number;
    /**
     * 微信服务号二维码
     */
    wx_image: string | null;
    /**
     * app 上传点位频率
     */
    socket_position_law: number;
    /**
     * 最低充值金额（字符串金额）
     */
    least_recharge: string;
    /**
     * 最低充值开关
     * 0 关闭；1 开启。
     */
    is_open_least_recharge: number;
    /**
     * 是否开启显示预估信息
     * 0 关闭；1 开启。
     */
    is_show_forecast: number;
    /**
     * 是否开启显示司机状态
     * 0 关闭；1 开启。
     */
    is_show_driver_status: number;
    /**
     * 是否开启下单协议
     * 0 关闭；1 开启。
     */
    is_open_order_agreement: number;
    /**
     * 是否开启展示司机收款二维码
     * 0 关闭；1 开启。
     */
    is_open_driver_receive_qr: number;
    /**
     * 是否开启展示司机收到达用户起点预估时间
     * 0 关闭；1 开启。
     */
    is_open_driver_to_start_time: number;
    /**
     * 是否开启抢单
     * 0 关闭；1 开启。
     */
    is_open_order_grabbing: number;
    /**
     * 是否开启公告
     * 0 关闭；1 开启。
     */
    is_open_notice: number;
    /**
     * 公告内容
     */
    notice_content: string | null;
    /**
     * 驶入距离
     */
    entering: number;
    /**
     * 驶出距离
     */
    driver_out: number | null;
    /**
     * 新用户扫码下单奖励开关
     * 0 关闭；1 开启。
     */
    is_open_new_user_rewards: number;
    /**
     * 新用户扫码奖励金额
     */
    new_user_rewards: string;
    /**
     * 规则提示列表
     */
    rule_tips: UserBasisRuleTip[];
    /**
     * 是否首单阅读过协议
     * 0 未阅读；1 已阅读。
     */
    is_order_agreement: number;
    /**
     * 是否开启自动派单
     * 0 关闭；1 开启。
     */
    auto_order: number;
    /**
     * 自动指派订单多少秒不接默认为拒接
     */
    refuse_time: number;
    /**
     * 轮询间隔
     */
    nterval: number;
    /**
     * 轨迹参数
     */
    trajectory: number;
}
