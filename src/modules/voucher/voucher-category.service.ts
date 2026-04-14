import { PrismaService } from "@/prisma/prisma.service";
import { BadRequestException, Injectable } from "@nestjs/common";


@Injectable()
export class VoucherCategoryService {
    constructor(private prisma: PrismaService) {}

    /**
     * Tạo quan hệ giữa voucher và category
     * @param voucherId 
     * @param categoryId 
     * @returns 
     */
    async createVoucherCategory(voucherId: string, categoryId: string) {
        //nếu không có voucherId hoặc categoryId thì ném lỗi
        if (!voucherId || !categoryId) {
            throw new BadRequestException("Voucher ID and Category ID are required");
        }

        try {
            //kiểm tra xem voucherId và categoryId có tồn tại không
            const [voucher, category] = await Promise.all([
                this.prisma.voucher.findUnique({
                    where: {
                        id: voucherId,
                    },
                }),
                this.prisma.categories.findUnique({
                    where: {
                        id: categoryId,
                    },
                }),
            ]);

            if (!voucher || !category) {
                throw new BadRequestException("Voucher or Category not found");
            }

            const voucherCategory = await this.prisma.voucherCategory.create({
                data: { voucherId, categoryId },
                include: {
                    voucher: true,
                    category: true, // nhớ sửa relation name đúng schema
                },
            });

            return {
                success: true,
                message: "Voucher Category created successfully",
                data: voucherCategory,
            };
        } catch (error: any) {
            // duplicate
            if (error.code === 'P2002') {
                throw new BadRequestException("Voucher Category already exists");
            }

            // foreign key fail
            if (error.code === 'P2003') {
                throw new BadRequestException("Voucher or Category not found");
            }

            throw error;
        }
    }


    /**
     * Tìm tất cả các quan hệ giữa voucher và category
     * @param categoryId 
     * @param params 
     * @returns 
     */
    async findAllVoucherCategories(categoryId:string,params: { page?: number; limit?: number }) {
        if (!categoryId) {
            throw new BadRequestException("Category ID is required");
        }
        // validate params
        const page = Math.max(params?.page ?? 1, 1);
        // validate limit
        const limit = Math.max(params?.limit ?? 10, 1);
        // calculate skip
        const skip = (page - 1) * limit;



        //kiểm tra xem categoryId có tồn tại không
        const category = await this.prisma.categories.findUnique({
            where: {
                id: categoryId,
            },
        });

        if (!category) {
            throw new BadRequestException("Category not found");
        }

        //lấy danh sách voucher categories
        const [voucherCategories, total] = await Promise.all([
            this.prisma.voucherCategory.findMany({
                where: {
                    categoryId,
                },
                take: limit,
                skip,
                include: {
                    voucher: true,
                    category: true,
                },
            }),

            //đếm tổng số voucher categories
            this.prisma.voucherCategory.count({
                where: {
                    categoryId,
                },
            }),
        ]);


        return {
            success: true,
            message: "Voucher Categories fetched successfully",
            data: voucherCategories,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Lấy ra voucherCategory theo id
     * @param id 
     * @returns 
     */
    async findOneVoucherCategory(id: string) {
        //nếu không có id thì ném lỗi
        if (!id) {
            throw new BadRequestException("Voucher Category ID is required");
        }

        //kiểm tra xem voucherCategory có tồn tại không
        const voucherCategory = await this.prisma.voucherCategory.findUnique({
            where: {
                id,
            },
            include: {
                voucher: true,
                category: true,
            },
        });

        if (!voucherCategory) {
            throw new BadRequestException("Voucher Category not found");
        }

        return {
            success: true,
            message: "Voucher Category fetched successfully",
            data: voucherCategory,
        };
    }


    

    async deleteVoucherCategory(id: string) {
        //nếu không có id thì ném lỗi
        if (!id) {
            throw new BadRequestException("Voucher Category ID is required");
        }

        //kiểm tra xem voucherCategory có tồn tại không
        const voucherCategory = await this.prisma.voucherCategory.findUnique({
            where: {
                id,
            },
        });

        if (!voucherCategory) {
            throw new BadRequestException("Voucher Category not found");
        }

        //xóa voucherCategory
        const deletedVoucherCategory = await this.prisma.voucherCategory.delete({
            where: {
                id,
            },
        });

        return {
            success: true,
            message: "Voucher Category deleted successfully",
            data: deletedVoucherCategory,
        };
    }
}