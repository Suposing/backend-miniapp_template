import { BadRequestException, Injectable } from '@nestjs/common';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { getPublicApiUrl } from '../../../config/env';
/**
 * 本地头像保存目录，基于 API 进程工作目录解析。
 */
export const UPLOAD_ROOT = resolve(process.cwd(), 'uploads');
/**
 * 管理本地头像文件的校验、写入和清理。
 */
@Injectable()
export class AvatarStorageService {
    /**
     * 校验上传类型与 2 MiB 大小限制；提供 buffer 时额外核对 PNG、JPEG 或 WebP 文件头。
     *
     * @returns 已验证类型对应的文件扩展名
     * @throws {BadRequestException} 类型、大小或文件头不符合要求时抛出
     */
    assertValidFile(file: {
        mimetype?: string;
        /**
         * 上传文件的字节数，必须大于 0 且不超过 2 MiB。
         */
        size?: number;
        buffer?: Buffer;
    }) {
        const ext = (
            {
                'image/png': 'png',
                'image/jpeg': 'jpg',
                'image/webp': 'webp',
            } as Record<string, string>
        )[file.mimetype ?? ''];
        if (!ext || !file.size || file.size > 2 * 1024 * 1024)
            throw new BadRequestException(
                '仅支持 2MB 以内的 PNG、JPEG 或 WebP 图片',
            );
        const bytes = file.buffer;
        if (bytes) {
            const valid =
                ext === 'png'
                    ? bytes
                          .subarray(0, 8)
                          .equals(
                              Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
                          )
                    : ext === 'jpg'
                      ? bytes[0] === 255 && bytes[1] === 216
                      : bytes.toString('ascii', 0, 4) === 'RIFF' &&
                        bytes.toString('ascii', 8, 12) === 'WEBP';
            if (!valid) throw new BadRequestException('图片内容与类型不符');
        }
        return { ext };
    }
    /**
     * 校验头像后以随机文件名写入本地 uploads 目录，并返回公开访问地址。
     */
    async upload(
        _userId: string,
        file: {
            buffer: Buffer;
            mimetype: string;
            /**
             * 上传文件的字节数，必须大于 0 且不超过 2 MiB。
             */
            size: number;
        },
    ) {
        const { ext } = this.assertValidFile(file);
        await mkdir(UPLOAD_ROOT, { recursive: true });
        const name = randomUUID() + '.' + ext;
        await writeFile(resolve(UPLOAD_ROOT, name), file.buffer);
        return getPublicApiUrl() + '/uploads/' + name;
    }
    /**
     * 仅按允许的随机头像文件名清理本地文件；不匹配的地址和删除失败均忽略。
     */
    async removeObject(value: string) {
        const name = basename(value.split('?')[0]);
        if (!/^[a-f0-9-]+\.(png|jpg|webp)$/.test(name)) return;
        await unlink(resolve(UPLOAD_ROOT, name)).catch(() => undefined);
    }
}
