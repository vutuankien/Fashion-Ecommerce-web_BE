import { Attribute, AttributeValue } from '@prisma/client';
import { CreateAttributeDto } from '../dto/create-attribute.dto';
import { UpdateAttributeDto } from '../dto/update-attribute.dto';
import { CreateAttributeValueDto } from '../dto/create-attribute-value.dto';
import { UpdateAttributeValueDto } from '../dto/update-attribute-value.dto';

/** Interface định nghĩa contract cho AttributeService */
export interface IAttributeService {
    /** Tạo mới một Attribute */
    create(dto: CreateAttributeDto): Promise<Attribute>;
    /** Lấy tất cả Attribute */
    findAll(): Promise<Attribute[]>;
    /** Lấy một Attribute theo id */
    findOne(id: string): Promise<Attribute>;
    /** Cập nhật một Attribute theo id */
    update(id: string, dto: UpdateAttributeDto): Promise<Attribute>;
    /** Xóa một Attribute theo id */
    remove(id: string): Promise<Attribute>;

    /** Tạo mới một AttributeValue */
    createValue(dto: CreateAttributeValueDto): Promise<AttributeValue>;
    /** Lấy tất cả AttributeValue theo attributeId */
    findAllValues(attributeId: string): Promise<AttributeValue[]>;
    /** Lấy một AttributeValue theo id */
    findOneValue(id: string): Promise<AttributeValue>;
    /** Cập nhật một AttributeValue theo id */
    updateValue(id: string, dto: UpdateAttributeValueDto): Promise<AttributeValue>;
    /** Xóa một AttributeValue theo id */
    removeValue(id: string): Promise<AttributeValue>;
}
