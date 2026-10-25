/**
 * 密码策略前端预检——与 Nest 端 src/common/validators/password-policy.ts
 * 为同一套规则，任一侧调整须同步；纯函数部分与 API 密码策略保持一致。
 * UForm 直接展示 issue.message，调用方将校验失败原因映射为中文提示。
 *
 * - 长度 8-20；仅 ASCII 可打印字符（0x21-0x7E，天然排除空格及任何空白、非 ASCII）；
 *   必须同时包含字母和数字，可含特殊符号；
 * - 不能包含用户名（用户名 ≥3 位时才检查，不区分大小写）；
 * - 不能与原密码相同：前端拿不到原密码，由后端 400 PASSWORD_SAME_AS_OLD 兜底提示。
 * 登录不套用策略，存量不合规密码静默兼容（下次改密时被强制升级）。
 */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 20;
/**
 * 用户名短于该长度时跳过包含检查（否则单字符用户名几乎无法设置任何密码）
 */
export const PASSWORD_USERNAME_CHECK_MIN_LENGTH = 3;

const PRINTABLE_ASCII_PATTERN = /^[\x21-\x7E]+$/;

/**
 * 校验失败原因，由调用方选择对应的中文提示。
 */
export type PasswordErrorKey =
    | 'tooShort'
    | 'tooLong'
    | 'invalidChars'
    | 'missingLetterOrDigit'
    | 'containsUsername';

/**
 * 用户名 ≥3 位时做不区分大小写的包含检查
 */
export function passwordContainsUsername(
    password: string,
    username?: string | null,
): boolean {
    if (!username || username.length < PASSWORD_USERNAME_CHECK_MIN_LENGTH) {
        return false;
    }

    return password.toLowerCase().includes(username.toLowerCase());
}

/**
 * 返回首个不满足的规则，全部满足返回 null
 */
export function getPasswordError(
    password: string,
    username?: string | null,
): PasswordErrorKey | null {
    if (password.length < PASSWORD_MIN_LENGTH) return 'tooShort';
    if (password.length > PASSWORD_MAX_LENGTH) return 'tooLong';
    if (!PRINTABLE_ASCII_PATTERN.test(password)) return 'invalidChars';
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
        return 'missingLetterOrDigit';
    }
    if (passwordContainsUsername(password, username)) return 'containsUsername';

    return null;
}
