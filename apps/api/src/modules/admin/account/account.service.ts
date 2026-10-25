import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { db } from '../../../db/client';
import { audit, invalid } from '../../../db/helpers';
import { AvatarStorageService } from './avatar-storage.service';
import {
    UpdateAccountEmailDto,
    UpdateAccountPasswordDto,
    UpdateAccountProfileDto,
} from './dto/account.dto';
import {
    assertPasswordNotContainingUsername,
    assertPasswordNotSameAsCurrent,
} from '../../../common/validators/password-policy';
/**
 * 当前登录账号的自助资料、改密和头像维护服务。
 */
@Injectable()
export class AccountService {
    constructor(private readonly avatars: AvatarStorageService) {}
    /**
     * 读取当前账号资料和启用角色摘要，返回值排除密码哈希。
     */
    async getProfile(id: string) {
        const { passwordHash: _passwordHash, ...user } =
            await db.users.findFirstOrThrow({ where: { id, deletedAt: null } });
        const memberships = await db.userRoles.findMany({
            where: { userId: id, roleRef: { enabled: true } },
            include: { roleRef: true },
        });
        return {
            ...user,
            roles: memberships.map((x) => ({
                id: x.roleId,
                name: x.roleRef.name,
                code: x.roleRef.code,
            })),
        };
    }
    /**
     * 更新当前账号的自助资料；标签去空、去重，提供数组时全量替换。
     */
    async updateProfile(id: string, dto: UpdateAccountProfileDto) {
        const tags = dto.tags
            ? [...new Set(dto.tags.map((t) => t.trim()).filter(Boolean))]
            : undefined;
        if (tags?.some((t) => t.length > 20)) invalid('标签不能超过20字');
        await db.users.update({ where: { id }, data: { ...dto, tags } });
        await audit('account.profile', id);
        return this.getProfile(id);
    }
    private async password(id: string, password: string) {
        const user = await db.users.findUniqueOrThrow({ where: { id } });
        if (!(await bcrypt.compare(password, user.passwordHash)))
            throw new UnauthorizedException('当前密码错误');
        return user;
    }
    /**
     * 校验当前密码及未删除账号间邮箱唯一后修改邮箱，并记录审计。
     */
    async updateEmail(id: string, dto: UpdateAccountEmailDto) {
        await this.password(id, dto.currentPassword);
        if (
            await db.users.findFirst({
                where: { id: { not: id }, email: dto.email, deletedAt: null },
            })
        )
            invalid('邮箱已使用');
        await db.users.update({ where: { id }, data: { email: dto.email } });
        await audit('account.email', id);
        return this.getProfile(id);
    }
    /**
     * 校验当前密码和新密码策略，事务内更新哈希、递增版本并删除全部刷新会话。
     * 成功后旧令牌失效，需要重新登录。
     */
    async updatePassword(id: string, dto: UpdateAccountPasswordDto) {
        const user = await this.password(id, dto.currentPassword);
        assertPasswordNotContainingUsername(dto.newPassword, user.username);
        await assertPasswordNotSameAsCurrent(
            dto.newPassword,
            user.passwordHash,
        );
        await db.$transaction([
            db.users.update({
                where: { id },
                data: {
                    passwordHash: await bcrypt.hash(dto.newPassword, 10),
                    tokenVersion: { increment: 1 },
                },
            }),
            db.refreshTokens.deleteMany({ where: { userId: id } }),
        ]);
        await audit('account.password', id);
        return null;
    }
    /**
     * 上传并保存新头像地址后尝试删除旧文件，再返回账号资料。
     * 文件写入、数据库更新和旧文件清理分别执行，不构成单一事务。
     */
    async updateAvatar(
        id: string,
        file: { buffer: Buffer; mimetype: string; size: number },
    ) {
        if (!file) invalid('请选择头像');
        const old = await db.users.findUniqueOrThrow({ where: { id } });
        const avatar = await this.avatars.upload(id, file);
        await db.users.update({ where: { id }, data: { avatar } });
        if (old.avatar) await this.avatars.removeObject(old.avatar);
        return this.getProfile(id);
    }
    /**
     * 清空账号头像地址后尝试删除旧文件；文件清理失败会被忽略。
     */
    async deleteAvatar(id: string) {
        const old = await db.users.findUniqueOrThrow({ where: { id } });
        await db.users.update({ where: { id }, data: { avatar: null } });
        if (old.avatar) await this.avatars.removeObject(old.avatar);
        return this.getProfile(id);
    }
}
