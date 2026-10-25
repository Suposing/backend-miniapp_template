import { Injectable } from '@nestjs/common';
import { db } from '../../../db/client';
import { audit } from '../../../db/helpers';
import { DictTypeCreateDto } from './dto/dict-type-create.dto';
import { DictTypeUpdateDto } from './dto/dict-type-update.dto';
import { DictItemCreateDto } from './dto/dict-item-create.dto';
import { DictItemUpdateDto } from './dto/dict-item-update.dto';
/**
 * 业务字典类型和字典项的维护及操作审计。
 */
@Injectable()
export class DictService {
    /**
     * 按创建时间升序返回全部字典类型，不分页。
     */
    listTypes() {
        return db.dictTypes.findMany({ orderBy: { createdAt: 'asc' } });
    }
    /**
     * 按不可变的字典编码读取类型；不存在时由 Prisma 抛出记录缺失错误。
     */
    getType(code: string) {
        return db.dictTypes.findUniqueOrThrow({ where: { code } });
    }
    /**
     * 创建唯一编码的字典类型并记录操作审计。
     */
    async createType(dto: DictTypeCreateDto, op: string | null) {
        const row = await db.dictTypes.create({ data: dto });
        await audit('dict.type.create', op, { id: row.id });
        return row;
    }
    /**
     * 按字典编码更新名称和说明，编码保持不变。
     */
    async updateType(code: string, dto: DictTypeUpdateDto, op: string | null) {
        const row = await db.dictTypes.update({ where: { code }, data: dto });
        await audit('dict.type.update', op, { code });
        return row;
    }
    /**
     * 删除字典类型及由外键级联删除的字典项，并记录审计。
     */
    async deleteType(code: string, op: string | null) {
        await db.dictTypes.delete({ where: { code } });
        await audit('dict.type.delete', op, { code });
        return null;
    }
    /**
     * 读取指定类型的全部字典项，按排序值升序返回，包含停用项。
     */
    listItems(code: string) {
        return db.dictItems.findMany({
            where: { typeCode: code },
            orderBy: { sort: 'asc' },
        });
    }
    /**
     * 在指定字典类型下创建业务键值和显示名唯一的字典项，并记录审计。
     */
    async createItem(code: string, dto: DictItemCreateDto, op: string | null) {
        const row = await db.dictItems.create({
            data: { ...dto, typeCode: code },
        });
        await audit('dict.item.create', op, { id: row.id });
        return row;
    }
    /**
     * 更新字典项的键值、中文名称、排序或启停状态；省略字段保留原值。
     */
    async updateItem(id: string, dto: DictItemUpdateDto, op: string | null) {
        const row = await db.dictItems.update({ where: { id }, data: dto });
        await audit('dict.item.update', op, { id });
        return row;
    }
    /**
     * 删除指定字典项并记录操作审计。
     */
    async deleteItem(id: string, op: string | null) {
        await db.dictItems.delete({ where: { id } });
        await audit('dict.item.delete', op, { id });
        return null;
    }
}
