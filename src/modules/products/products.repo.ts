import { PrismaService } from "src/prisma/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { UpdateProductDto } from "./dto/update-product.dto";

interface DynamicSearchDto {
    name?: string;
    categoryId?: string;
    providerId?: string;
    minPrice?: number;
    maxPrice?: number;
}


export class ProductsRepo {
    constructor(private readonly prismaService: PrismaService) {}


    async create(data: CreateProductDto) {
        try {
            const EXISTS = await this.prismaService.products.findFirst({
                where: {
                    name: data.name
                }
            })

            if (EXISTS) {
                throw new BadRequestException('Product already exists')
            }

            const PRODUCT = await this.prismaService.products.create({
                data
            })

            return PRODUCT
        } catch (error) {
            throw new BadRequestException(error)
        }
    }

    async findAll(limit: number = 10, page: number = 1) {
        // Validate and sanitize inputs
        const VALID_LIMIT = Math.min(Math.max(1, limit), 100); // Cap between 1-100
        const VALID_PAGE = Math.max(1, page);
        const SKIP = (VALID_PAGE - 1) * VALID_LIMIT;

        // Get data and total count in parallel
        const [data, total] = await Promise.all([
            this.prismaService.products.findMany({
                take: VALID_LIMIT,
                skip: SKIP,
                // Add select to only fetch needed fields (example)
                // select: { id: true, name: true, price: true },
                // Add orderBy for consistent pagination
                orderBy: { createdAt: 'desc' }
            }),
            this.prismaService.products.count()
        ]);

        return {
            data,
            meta: {
                total,
                page: VALID_PAGE,
                limit: VALID_LIMIT,
                totalPages: Math.ceil(total / VALID_LIMIT),
                hasNextPage: SKIP + VALID_LIMIT < total,
                hasPreviousPage: VALID_PAGE > 1
            }
        };
    }

    async findOne(id: string) {
        const PRODUCT = await this.prismaService.products.findUnique({
            where: { id }
        });

        if (!PRODUCT) {
            throw new NotFoundException(`Product with ID "${id}" not found`);
        }

        return PRODUCT;
    }

    async update(id: string, data: UpdateProductDto) {
        const PRODUCT = await this.prismaService.products.update({
            where: { id },
            data
        });

        if (!PRODUCT) {
            throw new NotFoundException(`Product with ID "${id}" not found`);
        }

        return PRODUCT;
    }

    async remove(id: string) {
        const PRODUCT = await this.prismaService.products.delete({
            where: { id }
        });

        if (!PRODUCT) {
            throw new NotFoundException(`Product with ID "${id}" not found`);
        }

        return PRODUCT;
    }

    

    async dynamic_search(
        filters: DynamicSearchDto,
        limit: number = 10,
        page: number = 1
    ) {
        const validLimit = Math.min(Math.max(1, limit), 100);
        const validPage = Math.max(1, page);
        const skip = (validPage - 1) * validLimit;

        // Build where clause with proper type safety
        const where: any = {};
        
        if (filters.name) {
            where.name = { contains: filters.name, mode: 'insensitive' };
        }
        if (filters.categoryId) {
            where.categoryId = filters.categoryId;
        }
        if (filters.minPrice || filters.maxPrice) {
            where.price = {
                ...(filters.minPrice && { gte: filters.minPrice }),
                ...(filters.maxPrice && { lte: filters.maxPrice })
            };
        }

        const [products, total] = await Promise.all([
            this.prismaService.products.findMany({
                where,
                take: validLimit,
                skip,
                orderBy: { createdAt: 'desc' }
            }),
            this.prismaService.products.count({ where })
        ]);

        return {
            data: products,
            meta: {
                total,
                page: validPage,
                limit: validLimit,
                totalPages: Math.ceil(total / validLimit),
                hasNextPage: skip + validLimit < total,
                hasPreviousPage: validPage > 1
            }
        };
    }
}