/**
 * 把裁剪组件已完成旋转合成的画布缩放并导出为 256×256 像素头像。
 * 优先使用 WebP；浏览器不支持时遵循原生 toBlob 的回退行为。
 */

/**
 * 输出尺寸（正方形，与契约「每用户一张头像」的小图定位一致）
 */
const OUTPUT_SIZE = 256;

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('图片导出失败'));
                }
            },
            'image/webp',
            0.9,
        );
    });
}

/**
 * 将已裁剪并旋转合成的画布缩放为 256×256 像素头像，优先导出 WebP。
 * 浏览器不支持 WebP 时按原生 toBlob 行为回退。
 *
 * @throws {Error} Canvas 上下文不可用或无法导出图片时抛出
 */
export async function toAvatarWebpBlob(
    cropped: HTMLCanvasElement,
): Promise<Blob> {
    const output = document.createElement('canvas');

    output.width = OUTPUT_SIZE;
    output.height = OUTPUT_SIZE;

    const ctx = output.getContext('2d');

    if (!ctx) throw new Error('Canvas 2D 上下文不可用');

    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(cropped, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    return canvasToBlob(output);
}
