import { PrismaService } from "@/prisma/prisma.service";
import { BadRequestException, Injectable } from "@nestjs/common";

@Injectable()
export class VoucherProductService {
    constructor(
        private readonly prisma: PrismaService,
    ) {}


    /**
     * Create voucher product
     * @param voucherId - Voucher ID
     * @param productId - Product ID
     */
    async createVoucherProduct(voucherId: string, productId: string) {
        if(!voucherId) throw new BadRequestException("Voucher Id is reuqired")
        if(!productId) throw new BadRequestException("Product Id is reuqired")

        const voucher = await this.prisma.voucher.findUnique({
            where: {
                id: voucherId,
            },
        });
        if(!voucher) throw new BadRequestException("Voucher not found")

        const product = await this.prisma.products.findUnique({
            where: {
                id: productId,
            },
        });
        if(!product) throw new BadRequestException("Product not found")

        const newVoucherProduct = await this.prisma.voucherProduct.create({
            data: {
                voucherId,
                productId,
            },
        });

        return {
            success: true,
            message: "Voucher product created successfully",
            data: {
                newVoucherProduct,
                product,
                voucher,
            },
        };
    }

    /**
     * Delete voucher product
     * @param voucherId - Voucher ID
     * @param productId - Product ID
     */
    async deleteVoucherProduct(voucherId: string, productId: string) {
       if(!voucherId) throw new BadRequestException("Voucher Id is required")
        if(!productId) throw new BadRequestException("Product Id is required")

        const voucherProduct = await this.prisma.voucherProduct.findUnique({
            where: {
                voucherId_productId: {
                    voucherId,
                    productId,
                },
            },
        });
        if(!voucherProduct) throw new BadRequestException("Voucher product not found")

        await this.prisma.voucherProduct.delete({
            where: {
                voucherId_productId: {
                    voucherId,
                    productId,
                },
            },
        });

        return {
            success: true,
            message: "Voucher product deleted successfully",
        };
    }

    /**
     * Lấy danh sách sản phẩm được áp dụng voucher
     * @param voucherId - ID của voucher
     * @returns Mảng các ID sản phẩm
     */
    async getVoucherProducts(voucherId: string,params:{
        page?:number,
        limit?:number,
    }) {

        // validate params
        const page = Math.max(params?.page ?? 1, 1);
        // validate limit
        const limit = Math.max(params?.limit ?? 10, 1);
        // calculate skip
        const skip = (page - 1) * limit;

        //validate
        if(!voucherId) throw new BadRequestException("Voucher Id is required")

        const [voucherProducts, total] = await Promise.all([
        this.prisma.voucherProduct.findMany({
            where: {
                voucherId,
            },
            select: {
                productId: true,
            },
            skip,
            take: limit,
            
        }),
        this.prisma.voucherProduct.count({
            where: {
                voucherId,
            },
        }),
       ])
        return {

            success:true,
            message:"Voucher products fetched successfully",
            data:voucherProducts,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Lấy danh sách voucher áp dụng cho sản phẩm
     * @param productId - ID của sản phẩm
     * @returns Mảng các ID voucher
     */
    async getVouchersByProduct(productId: string,params:{
        page?:number,
        limit?:number,
    }) {
        // validate params
        const page = Math.max(params?.page ?? 1, 1);
        // validate limit
        const limit = Math.max(params?.limit ?? 10, 1);
        // calculate skip
        const skip = (page - 1) * limit;

        if(!productId) throw new BadRequestException("Product Id is required")
        const [voucherProducts, total] = await Promise.all([
            this.prisma.voucherProduct.findMany({
                where: {
                    productId,
                },
                select: {
                    voucherId: true,
                },
                skip,
                take: limit,
            }),
            this.prisma.voucherProduct.count({
                where: {
                    productId,
                },
            }),
        ]);
        return {
            success: true,
            message: "Vouchers by product fetched successfully",
            data: voucherProducts,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Xoá danh sách voucher áp dụng cho sản phẩm
     * @param productId - ID của sản phẩm
     */
    async deleteVouchersByProduct(productId: string){
        if(!productId) throw new BadRequestException("ProductId is required")
        const existVoucherProduct = await this.prisma.voucherProduct.findMany({
            where: {
                productId,
            },
        });
        if(existVoucherProduct.length === 0) throw new BadRequestException("Voucher product not found")
        await this.prisma.voucherProduct.deleteMany({
            where: {
                productId,
            },
        });
        return {
            success: true,
            message: "Vouchers by product deleted successfully",
        };
    }

    /**
     * Xoá danh sách voucher áp dụng cho voucher
     * @param voucherId - ID của voucher
     */
    async deleteVouchersByVoucher(voucherId: string) {
        if(!voucherId) throw new BadRequestException("VoucherId is required")
        const existVoucherProduct = await this.prisma.voucherProduct.findMany({
            where: {
                voucherId,
            },
        });
        if(existVoucherProduct.length === 0) throw new BadRequestException("Voucher product not found")
        await this.prisma.voucherProduct.deleteMany({
            where: {
                voucherId,
            },
        });
        return {
            success: true,
            message: "Vouchers by voucher deleted successfully",
        };
    }
}