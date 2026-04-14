import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Attribute, AttributeValue } from '@prisma/client';
import { IAttributeService } from './interface/attribute.interface';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';
import { CreateAttributeValueDto } from './dto/create-attribute-value.dto';
import { UpdateAttributeValueDto } from './dto/update-attribute-value.dto';

/** Service xử lý nghiệp vụ cho Attribute và AttributeValue */
@Injectable()
export class AttributeService implements IAttributeService {
    /** Inject PrismaService */
    constructor(private readonly PRISMA: PrismaService) {}

    // ─────────────────────────── ATTRIBUTE ────────────────────────────

    /** Tạo mới một Attribute, kiểm tra code không bị trùng */
    async create(dto: CreateAttributeDto): Promise<Attribute> {
        /** Kiểm tra code đã tồn tại chưa */
        const existing = await this.PRISMA.attribute.findUnique({
            where: { code: dto.code },
        });

        /** Nếu trùng thì ném lỗi 400 */
        if (existing) throw new BadRequestException(`Attribute với code "${dto.code}" đã tồn tại`);

        /** Tạo mới và trả về */
        return this.PRISMA.attribute.create({ data: dto });
    }

    /** Lấy tất cả Attribute, kèm danh sách values */
    async findAll(): Promise<Attribute[]> {
        /** Trả về tất cả attribute kèm values */
        return this.PRISMA.attribute.findMany({
            include: { values: true },
            orderBy: { code: 'asc' },
        });
    }

    /** Lấy một Attribute theo id, kèm danh sách values */
    async findOne(id: string): Promise<Attribute> {
        /** Tìm attribute theo id */
        const data = await this.PRISMA.attribute.findUnique({
            where: { id },
            include: { values: true },
        });

        /** Ném lỗi nếu không tìm thấy */
        if (!data) throw new NotFoundException(`Attribute #${id} không tồn tại`);

        /** Trả về dữ liệu */
        return data;
    }

    /** Cập nhật type hoặc code của Attribute */
    async update(id: string, dto: UpdateAttributeDto): Promise<Attribute> {
        /** Kiểm tra attribute tồn tại */
        await this.findOne(id);

        /** Nếu đổi code, kiểm tra code mới không trùng */
        if (dto.code) {
            const existing = await this.PRISMA.attribute.findUnique({
                where: { code: dto.code },
            });
            /** Trùng code với attribute khác → lỗi */
            if (existing && existing.id !== id)
                throw new BadRequestException(`Attribute với code "${dto.code}" đã tồn tại`);
        }

        /** Cập nhật và trả về */
        return this.PRISMA.attribute.update({ where: { id }, data: dto });
    }

    /** Xóa một Attribute theo id (cascade xóa values và variantAttributes) */
    async remove(id: string): Promise<Attribute> {
        /** Kiểm tra attribute tồn tại */
        await this.findOne(id);

        /** Lấy tất cả valueId thuộc attribute này */
        const values = await this.PRISMA.attributeValue.findMany({
            where: { attributeId: id },
            select: { id: true },
        });
        const value_ids = values.map((v) => v.id);

        /** Xóa tất cả VariantAttribute liên quan đến các values này */
        if (value_ids.length > 0) {
            await this.PRISMA.variantAttribute.deleteMany({
                where: { attributeValueId: { in: value_ids } },
            });
        }

        /** Xóa tất cả AttributeValue thuộc attribute này */
        await this.PRISMA.attributeValue.deleteMany({ where: { attributeId: id } });

        /** Xóa attribute */
        return this.PRISMA.attribute.delete({ where: { id } });
    }

    // ──────────────────────── ATTRIBUTE VALUE ─────────────────────────

    /** Tạo mới một AttributeValue, kiểm tra code không trùng trong cùng attribute */
    async createValue(dto: CreateAttributeValueDto): Promise<AttributeValue> {
        /** Kiểm tra attribute cha tồn tại */
        const attribute = await this.PRISMA.attribute.findUnique({
            where: { id: dto.attributeId },
        });
        if (!attribute) throw new NotFoundException(`Attribute #${dto.attributeId} không tồn tại`);

        /** Kiểm tra code đã tồn tại trong cùng attribute chưa */
        const existing = await this.PRISMA.attributeValue.findFirst({
            where: { attributeId: dto.attributeId, code: dto.code },
        });
        if (existing)
            throw new BadRequestException(
                `AttributeValue với code "${dto.code}" đã tồn tại trong Attribute này`,
            );

        /** Tạo mới và trả về */
        return this.PRISMA.attributeValue.create({ data: dto });
    }

    /** Lấy tất cả AttributeValue theo attributeId */
    async findAllValues(attributeId: string): Promise<AttributeValue[]> {
        /** Kiểm tra attribute cha tồn tại */
        await this.findOne(attributeId);

        /** Trả về danh sách values */
        return this.PRISMA.attributeValue.findMany({
            where: { attributeId },
            orderBy: { code: 'asc' },
        });
    }

    /** Lấy một AttributeValue theo id */
    async findOneValue(id: string): Promise<AttributeValue> {
        /** Tìm value theo id */
        const data = await this.PRISMA.attributeValue.findUnique({ where: { id } });

        /** Ném lỗi nếu không tìm thấy */
        if (!data) throw new NotFoundException(`AttributeValue #${id} không tồn tại`);

        /** Trả về dữ liệu */
        return data;
    }

    /** Cập nhật code hoặc label của AttributeValue */
    async updateValue(id: string, dto: UpdateAttributeValueDto): Promise<AttributeValue> {
        /** Kiểm tra value tồn tại và lấy thông tin hiện tại */
        const current = await this.findOneValue(id);

        /** Nếu đổi code, kiểm tra không trùng trong cùng attribute */
        if (dto.code) {
            const existing = await this.PRISMA.attributeValue.findFirst({
                where: { attributeId: current.attributeId, code: dto.code },
            });
            /** Trùng với value khác → lỗi */
            if (existing && existing.id !== id)
                throw new BadRequestException(
                    `AttributeValue với code "${dto.code}" đã tồn tại trong Attribute này`,
                );
        }

        /** Cập nhật và trả về */
        return this.PRISMA.attributeValue.update({ where: { id }, data: dto });
    }

    /** Xóa một AttributeValue theo id */
    async removeValue(id: string): Promise<AttributeValue> {
        /** Kiểm tra value tồn tại */
        await this.findOneValue(id);

        /** Xóa tất cả VariantAttribute liên quan trước */
        await this.PRISMA.variantAttribute.deleteMany({ where: { attributeValueId: id } });

        /** Xóa value */
        return this.PRISMA.attributeValue.delete({ where: { id } });
    }
}
