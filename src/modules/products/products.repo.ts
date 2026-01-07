import { PrismaService } from "src/prisma/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { BadRequestException, NotFoundException, Injectable } from "@nestjs/common";
import { UpdateProductDto } from "./dto/update-product.dto";

interface DynamicSearchDto {
    name?: string;
    categoryId?: string;
    providerId?: string;
    minPrice?: number;
    maxPrice?: number;
}


@Injectable()
export class ProductsRepo {
    constructor(private readonly prismaService: PrismaService) {}


    async create(data: CreateProductDto) {
        const {
            provider_id,
            category_ids,
            tag_ids,
            // keyword is auto-generated from name
            product_attributes,
            ...rest
        } = data;

        // Validate uniqueness and related entities in parallel
        const [existingProduct, validProviders, validCategories, validTags] = await Promise.all([
            this.prismaService.products.findFirst({
                where: { name: data.name },
                select: { id: true }
            }),
            this.prismaService.provider.findMany({
                where: { id: { in: provider_id } },
                select: { id: true }
            }),
            this.prismaService.categories.findMany({
                where: { id: { in: category_ids } },
                select: { id: true }
            }),
            tag_ids?.length ? this.prismaService.tags.findMany({
                where: { id: { in: tag_ids } },
                select: { id: true }
            }) : Promise.resolve([])
        ]);

        // Validate existence
        if (existingProduct) {
            throw new BadRequestException('Product already exists');
        }

        // Validate all providers exist
        if (validProviders.length !== provider_id.length) {
            throw new BadRequestException('One or more provider IDs are invalid');
        }

        // Validate all categories exist
        if (validCategories.length !== category_ids.length) {
            throw new BadRequestException('One or more category IDs are invalid');
        }

        // Validate all tags exist (if provided)
        if (tag_ids?.length && validTags.length !== tag_ids.length) {
            throw new BadRequestException('One or more tag IDs are invalid');
        }

        // Generate keyword from name equivalent to slug (words joined by -)
        const keyword = data.name
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '-');

        // Create product with transaction for data integrity
        try {
            const product = await this.prismaService.products.create({
                data: {
                    ...rest,
                    product_attributes: product_attributes as any,
                    providers: {
                    },
                    keyword,
                    categories: {
                        connect: category_ids.map(id => ({ id }))
                    },
                    ...(tag_ids?.length && {
                        tags: {
                            connect: tag_ids.map(id => ({ id }))
                        }
                    })
                },
                include: {
                    providers: true,
                    categories: true,
                    tags: true,
                    // keyword: true // keyword is scalar
                }
            });

            return product;
        } catch (error) {
            // Handle specific Prisma errors
            if (error.code === 'P2002') {
                throw new BadRequestException('A product with this name already exists');
            }
            if (error.code === 'P2025') {
                throw new BadRequestException('One or more related records not found');
            }

            // Log unexpected errors for debugging
            console.error('Error creating product:', error);
            throw new BadRequestException('Failed to create product. Please try again.');
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