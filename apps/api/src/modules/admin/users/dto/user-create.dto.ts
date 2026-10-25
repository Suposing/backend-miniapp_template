import {
    ArrayMaxSize,
    IsArray,
    IsEmail,
    IsIn,
    IsOptional,
    IsString,
    Matches,
    MaxLength,
    MinLength,
} from 'class-validator';
import { type TransformFnParams, Transform } from 'class-transformer';
import { IsPolicyPassword } from '../../../../common/validators/password-policy';

/**
 * trim 后入库：与前端 zod .trim() 口径一致，空格参与唯一索引/保护比较属于脏数据
 */
const trimTransform = ({ value }: TransformFnParams): unknown =>
    typeof value === 'string' ? value.trim() : value;

/**
 * POST /api/admin/users 请求体（与 UserCreateRequest 对齐）
 */
export class CreateUserDto {
    /**
     * 内部账号登录用户名，创建后不能修改；未删除账号之间唯一。
     */
    @IsString()
    @MinLength(1)
    @MaxLength(50)
    @Transform(trimTransform)
    username!: string;

    /**
     * 用户邮箱，未删除账号之间唯一。
     */
    @IsEmail()
    @MaxLength(100)
    email!: string;

    /**
     * 初始密码，按密码策略校验并保存为 bcrypt 哈希；不能包含用户名。
     */
    @IsString()
    @IsPolicyPassword()
    password!: string;

    /**
     * 界面展示的员工姓名或昵称。
     */
    @IsString()
    @MinLength(1)
    @MaxLength(50)
    @Transform(trimTransform)
    displayName!: string;

    /**
     * 头像访问地址。
     */
    @IsOptional()
    @IsString()
    avatar?: string;

    /**
     * 账号状态：active 正常，disabled 停用；停用会撤销已有会话。默认 'active'。
     */
    @IsOptional()
    @IsIn(['active', 'disabled'])
    status?: 'active' | 'disabled' = 'active';

    /**
     * 初始角色 ID 列表，最多 5 个；省略或空数组表示无角色，分配角色需要超级管理员。
     */
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(5)
    @IsString({ each: true })
    roleIds?: string[];

    /**
     * 所属组织 ID，须存在且未删除。
     */
    @IsOptional()
    @IsString()
    deptId?: string | null;

    /**
     * 员工工号；null 表示未设置。
     */
    @IsOptional()
    @IsString()
    @MaxLength(50)
    employeeNo?: string | null;

    /**
     * 入职日期，格式为 YYYY-MM-DD；null 表示未设置。
     */
    @IsOptional()
    @Matches(/^\d{4}-\d{2}-\d{2}$/)
    entryDate?: string | null;

    /**
     * 性别：male 男，female 女；null 表示未设置。
     */
    @IsOptional()
    @IsIn(['male', 'female'])
    gender?: 'male' | 'female' | null;

    /**
     * 在职状态：employed 在职，resigned 离职；null 表示未设置，与账号启停独立。
     */
    @IsOptional()
    @IsIn(['employed', 'resigned'])
    employmentStatus?: 'employed' | 'resigned' | null;

    /**
     * 初始岗位 ID 列表，最多 20 个；省略或空数组表示无岗位，岗位须存在且未删除。
     */
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(20)
    @IsString({ each: true })
    postIds?: string[];

    /**
     * 主岗 ID，提供时必须属于同时提交的 postIds；空值表示无主岗。
     */
    @IsOptional()
    @IsString()
    mainPostId?: string | null;
}
