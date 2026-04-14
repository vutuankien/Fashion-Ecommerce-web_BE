import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { ProductVariant } from '@prisma/client';
import { IVariantService } from './interface/variant.interface';

/** Service xử lý nghiệp vụ cho ProductVariant */
@Injectable()
export class VariantService implements IVariantService {
    /** Inject PrismaService để thao tác với DB */
    constructor(private readonly prisma: PrismaService) {}

    /** Kiểm tra tất cả attributeValueIds có tồn tại trong DB không */
    private async validateAttributeValueIds(ids: string[]): Promise<void> {
        /** Tìm tất cả AttributeValue có id nằm trong danh sách */
        const found = await this.prisma.attributeValue.findMany({
            where: { id: { in: ids } },
            select: { id: true },
        });

        /** Nếu số lượng tìm được khác số lượng truyền vào thì có ID không hợp lệ */
        if (found.length !== ids.length) {
            /** Tìm ra các ID không tồn tại */
            const found_ids = found.map((v) => v.id);
            const invalid_ids = ids.filter((id) => !found_ids.includes(id));

            /** Ném lỗi 400 với danh sách ID không hợp lệ */
            throw new BadRequestException(
                `Không tìm thấy AttributeValue với ID: [${invalid_ids.join(', ')}]. Vui lòng kiểm tra lại.`,
            );
        }
    }

    /** Tạo mới một ProductVariant, liên kết các AttributeValue qua bảng VariantAttribute */
    async create(productId: string, dto: CreateVariantDto): Promise<ProductVariant> {
        /** Validate tất cả attributeValueIds tồn tại trước khi tạo */
        await this.validateAttributeValueIds(dto.attributeValueIds);

        /** Tạo variant trong transaction */
        return this.prisma.$transaction(async (tx) => {
            /** Tạo variant cùng với nested write cho VariantAttribute */
            return tx.productVariant.create({
                data: {
                    sku: dto.sku,
                    price: dto.price,
                    stock: dto.stock,
                    /** Liên kết với product cha */
                    product: { connect: { id: productId } },
                    /** Tạo các bản ghi VariantAttribute tương ứng */
                    attrs: {
                        create: dto.attributeValueIds.map((id) => ({
                            attributeValue: { connect: { id } },
                        })),
                    },
                },
                /** Bao gồm attrs trong kết quả trả về */
                include: {
                    attrs: { include: { attributeValue: true } },
                },
            });
        });
    }

    /** Lấy tất cả ProductVariant */
    async findAll(): Promise<ProductVariant[]> {
        /** Trả về danh sách variant kèm thông tin attributes */
        return this.prisma.productVariant.findMany({
            include: { attrs: { include: { attributeValue: true } } },
        });
    }

    /** Lấy một ProductVariant theo id */
    async findOne(id: string): Promise<ProductVariant> {
        /** Tìm variant theo id */
        const variant = await this.prisma.productVariant.findUnique({
            where: { id },
            include: { attrs: { include: { attributeValue: true } } },
        });

        /** Ném lỗi nếu không tìm thấy */
        if (!variant) throw new NotFoundException(`Variant #${id} không tồn tại`);

        /** Trả về variant */
        return variant;
    }

    /** Lấy tất cả ProductVariant theo productId */
    async findByProductId(productId: string): Promise<ProductVariant[]> {
        /** Trả về danh sách variant kèm thông tin attributes và Attribute cha để phân loại size/color */
        return this.prisma.productVariant.findMany({
            where: { productId },
            include: {
                attrs: {
                    include: {
                        attributeValue: {
                            include: {
                                /** Include Attribute cha để lấy type (size, color...) */
                                Attribute: true,
                            },
                        },
                    },
                },
            },
        });
    }

    /** Cập nhật price hoặc stock của một ProductVariant */
    async update(id: string, dto: UpdateVariantDto): Promise<ProductVariant> {
        /** Cập nhật variant theo id */
        return this.prisma.productVariant.update({
            where: { id },
            data: {
                /** Chỉ cập nhật các field được cung cấp */
                ...(dto.price !== undefined && { price: dto.price }),
                ...(dto.stock !== undefined && { stock: dto.stock }),
            },
        });
    }

    /** Xóa một ProductVariant theo id */
    async remove(id: string): Promise<ProductVariant> {
        /** Xóa tất cả VariantAttribute liên quan trước */
        await this.prisma.variantAttribute.deleteMany({ where: { variantId: id } });

        /** Xóa variant */
        return this.prisma.productVariant.delete({ where: { id } });
    }
}
