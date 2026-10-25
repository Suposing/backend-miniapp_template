import {
    ArrayMaxSize,
    IsArray,
    IsEmail,
    IsIn,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
} from 'class-validator';
import { Matches } from 'class-validator';
import { type TransformFnParams, Transform } from 'class-transformer';

/**
 * trim 后入库：与前端 zod .trim() 口径一致
 */
const trimTransform = ({ value }: TransformFnParams): unknown =>
    typeof value === 'string' ? value.trim() : value;

/**
 * PUT /api/admin/users/:id 请求体（与 UserUpdateRequest 对齐，不允许改密码）
 */
export class UpdateUserDto {
    /**
     * 用户邮箱，未删除账号之间唯一。省略表示不修改。
     */
    @IsOptional()
    @IsEmail()
    @MaxLength(100)
    email?: string;

    /**
     * 界面展示的员工姓名或昵称。省略表示不修改。
     */
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(50)
    @Transform(trimTransform)
    displayName?: string;

    /**
     * 头像访问地址。省略表示不修改。
     */
    @IsOptional()
    @IsString()
    avatar?: string;

    /**
     * 账号状态：active 正常，disabled 停用；停用会撤销已有会话。省略表示不修改。
     */
    @IsOptional()
    @IsIn(['active', 'disabled'])
    status?: 'active' | 'disabled';

    /**
     * 角色 ID 全量替换列表，最多 5 个；空数组清空，省略保留原关联。改变角色分配需要超级管理员。
     */
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(5)
    @IsString({ each: true })
    roleIds?: string[];

    /**
     * 所属组织 ID，须存在且未删除。省略表示不修改。
     */
    @IsOptional()
    @IsString()
    deptId?: string | null;

    /**
     * 员工工号；null 表示未设置。省略表示不修改。
     */
    @IsOptional()
    @IsString()
    @MaxLength(50)
    employeeNo?: string | null;

    /**
     * 入职日期，格式为 YYYY-MM-DD；null 表示未设置。省略表示不修改。
     */
    @IsOptional()
    @Matches(/^\d{4}-\d{2}-\d{2}$/)
    entryDate?: string | null;

    /**
     * 性别：male 男，female 女；null 表示未设置。省略表示不修改。
     */
    @IsOptional()
    @IsIn(['male', 'female'])
    gender?: 'male' | 'female' | null;

    /**
     * 在职状态：employed 在职，resigned 离职；null 表示未设置，与账号启停独立。省略表示不修改。
     */
    @IsOptional()
    @IsIn(['employed', 'resigned'])
    employmentStatus?: 'employed' | 'resigned' | null;

    /**
     * 岗位 ID 全量替换列表，最多 20 个；空数组清空，省略保留原关联。岗位须存在且未删除。
     */
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(20)
    @IsString({ each: true })
    postIds?: string[];

    /**
     * 主岗 ID，提供时必须属于同时提交的 postIds；空值表示无主岗。省略表示不修改。
     */
    @IsOptional()
    @IsString()
    mainPostId?: string | null;
}
