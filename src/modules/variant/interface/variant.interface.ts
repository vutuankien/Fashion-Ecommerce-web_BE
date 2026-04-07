import { ProductVariant } from "@prisma/client"
import { CreateVariantDto } from "../dto/create-variant.dto"
import { UpdateVariantDto } from "../dto/update-variant.dto"

export interface IVariantService {
    create(productId: string, dto: CreateVariantDto): Promise<ProductVariant>
    findAll(): Promise<ProductVariant[]>
    findOne(id: string): Promise<ProductVariant>
    update(id: string, dto: UpdateVariantDto): Promise<ProductVariant>
    remove(id: string): Promise<ProductVariant>
    findByProductId(productId: string): Promise<ProductVariant[]>
}