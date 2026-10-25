import { AdminController } from '../decorators/admin-controller.decorator';
import {
    BadRequestException,
    Body,
    Delete,
    Get,
    HttpCode,
    Post,
    Put,
    Req,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { AccountService } from './account.service';
import {
    UpdateAccountEmailDto,
    UpdateAccountPasswordDto,
    UpdateAccountProfileDto,
} from './dto/account.dto';
import { AuthUser } from '../auth/auth.service';

/**
 * 我的账户（自助模块）：仅挂 AuthGuard('admin-jwt')，不走 PermissionsGuard ——
 * 自助操作不依赖权限位（管理端 /users 的类级 guard 对本人操作不适用）。
 */
@AdminController('account')
@UseGuards(AuthGuard('admin-jwt'))
export class AccountController {
    constructor(private readonly accountService: AccountService) {}

    private userId(req: Request): string {
        return (req.user as AuthUser)?.id;
    }

    /**
     * 读取当前登录内部账号的自助资料和有效角色摘要。
     */
    @Get('profile')
    getProfile(@Req() req: Request) {
        return this.accountService.getProfile(this.userId(req));
    }

    /**
     * 修改当前账号姓名、联系方式、标签及个人主页；省略字段保留原值。
     */
    @Put('profile')
    updateProfile(@Req() req: Request, @Body() dto: UpdateAccountProfileDto) {
        return this.accountService.updateProfile(this.userId(req), dto);
    }

    /**
     * 以当前密码确认后修改邮箱；已被其他未删除账号使用时返回校验错误。
     */
    @Put('email')
    updateEmail(@Req() req: Request, @Body() dto: UpdateAccountEmailDto) {
        return this.accountService.updateEmail(this.userId(req), dto);
    }

    /**
     * 校验当前密码后设置新密码并撤销全部会话；成功响应 data 为 null。
     */
    @Put('password')
    @HttpCode(200)
    async updatePassword(
        @Req() req: Request,
        @Body() dto: UpdateAccountPasswordDto,
    ) {
        return this.accountService.updatePassword(this.userId(req), dto);
    }

    /**
     * POST /api/admin/account/avatar（multipart，字段名 file）。
     * multer 默认内存存储，limits.fileSize 在读入内存前拦截超大请求
     * （业务侧 2MB 白名单/大小校验由 AvatarStorageService 兜底），
     * buffer 由 AvatarStorageService 校验图片类型后写入本地持久化目录。
     */
    @Post('avatar')
    @UseInterceptors(
        FileInterceptor('file', { limits: { fileSize: 2 * 1024 * 1024 } }),
    )
    updateAvatar(
        @Req() req: Request,
        @UploadedFile() file?: Express.Multer.File,
    ) {
        if (!file) {
            throw new BadRequestException({
                code: 'AVATAR_FILE_INVALID',
                message: '未提供头像文件',
            });
        }
        return this.accountService.updateAvatar(this.userId(req), file);
    }

    /**
     * 清空当前账号头像地址并尝试清理原本地文件，再返回账号资料。
     */
    @Delete('avatar')
    deleteAvatar(@Req() req: Request) {
        return this.accountService.deleteAvatar(this.userId(req));
    }
}
