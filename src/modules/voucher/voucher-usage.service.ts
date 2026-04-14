import { PrismaService } from "@/prisma/prisma.service";
import { BadRequestException, Injectable } from "@nestjs/common";

@Injectable()
export class VoucherUsageService {
    constructor(
        private readonly prisma: PrismaService,
    ) {}

    /**
     * Tạo mới voucher usage
     * @param voucherId - Voucher ID
     * @param userId - User ID
     */
    async createVoucherUsage(voucherId: string, userId: number) {
        //kiểm tra voucherid và userid có tồn tại không
        if (!voucherId) throw new BadRequestException("Voucher Id is required");
        if (!userId) throw new BadRequestException("User Id is required");

        //sử dụng transaction để đảm bảo tính toàn vẹn dữ liệu
        return await this.prisma.$transaction(async (tx) => {
            //kiểm tra voucher có tồn tại không
            const voucher = await tx.voucher.findUnique({
                where: { id: voucherId },
            });
            //nếu không tồn tại thì ném lỗi
            if (!voucher) throw new BadRequestException("Voucher not found");

            //kiểm tra user có tồn tại không
            const user = await tx.user.findUnique({
                where: { id: userId },
            });
            //nếu không tồn tại thì ném lỗi
            if (!user) throw new BadRequestException("User not found");

            //kiểm tra số lượng voucher còn không
            if (voucher.quantity! <= 0) {
                throw new BadRequestException("Voucher is out of stock");
            }

            //kiểm tra số lần sử dụng voucher của user
            const usageCount = await tx.voucherUsage.count({
                where: { voucherId, userId },
            });

            //nếu số lần sử dụng voucher của user >= số lần sử dụng voucher thì ném lỗi
            if (
                voucher.usageLimitPerUser &&
                usageCount >= voucher.usageLimitPerUser
            ) {
                throw new BadRequestException("Voucher usage limit per user reached");
            }

            //tạo mới voucher usage
            const newVoucherUsage = await tx.voucherUsage.create({
                data: { voucherId, userId },
            });

            //cập nhật số lần sử dụng voucher và số lượng voucher
            await tx.voucher.update({
                where: { id: voucherId },
                data: {
                    used: { increment: 1 },
                    quantity: { decrement: 1 },
                },
            });

            return newVoucherUsage;
        });
    }

    /**
     * Lấy lịch sử sử dụng voucher của user
     * @param userId - User ID
     * @returns Lịch sử sử dụng voucher của user
     */
    async getUserVoucherHistory(userId: number) {
        //kiểm tra userid có tồn tại không
        if (!userId) throw new BadRequestException("User Id is required");
        //sử dụng transaction để đảm bảo tính toàn vẹn dữ liệu
        return await this.prisma.$transaction(async (tx) => {
            //kiểm tra user có tồn tại không
            const user = await tx.user.findUnique({
                where: { id: userId },
            });
            //nếu không tồn tại thì ném lỗi
            if (!user) throw new BadRequestException("User not found");

            //lấy lịch sử sử dụng voucher của user
            return await tx.voucherUsage.findMany({
                where: { userId },
                include: { voucher: true },
            });
        });
    }

    /**
     * Lấy lịch sử sử dụng voucher
     * @param voucherId - Voucher ID
     * @returns Lịch sử sử dụng voucher
     */
    async getVoucherUsageHistory(voucherId: string) {
        //kiểm tra voucherid có tồn tại không
        if (!voucherId) throw new BadRequestException("Voucher Id is required");
        //sử dụng transaction để đảm bảo tính toàn vẹn dữ liệu
        return await this.prisma.$transaction(async (tx) => {
            //kiểm tra voucher có tồn tại không
            const voucher = await tx.voucher.findUnique({
                where: { id: voucherId },
            });
            //nếu không tồn tại thì ném lỗi
            if (!voucher) throw new BadRequestException("Voucher not found");

            //lấy lịch sử sử dụng voucher của user
            return await tx.voucherUsage.findMany({
                where: { voucherId },
                include: { user: true },
            });
        });
    }

    /**
     * Lấy số lần sử dụng voucher
     * @param voucherId - Voucher ID
     * @returns Số lần sử dụng voucher
     */
    async getVoucherUsageStats(voucherId: string) {
        //kiểm tra voucherid có tồn tại không
        if (!voucherId) throw new BadRequestException("Voucher Id is required");
        //sử dụng transaction để đảm bảo tính toàn vẹn dữ liệu
        return await this.prisma.$transaction(async (tx) => {
            //kiểm tra voucher có tồn tại không
            const voucher = await tx.voucher.findUnique({
                where: { id: voucherId },
            });
            //nếu không tồn tại thì ném lỗi
            if (!voucher) throw new BadRequestException("Voucher not found");

            //lấy số lần sử dụng voucher
            return await tx.voucherUsage.count({
                where: { voucherId },
            });
        });
    }

    /**
     * Lấy số lần sử dụng voucher của user
     * @param voucherId - Voucher ID
     * @param userId - User ID
     * @returns Số lần sử dụng voucher của user
     */
    async getUsageByUserAndVoucher(voucherId: string, userId: number) {
        //kiểm tra voucherid có tồn tại không
        if (!voucherId) throw new BadRequestException("Voucher Id is required");
        //kiểm tra userid có tồn tại không
        if (!userId) throw new BadRequestException("User Id is required");
        //sử dụng transaction để đảm bảo tính toàn vẹn dữ liệu
        return await this.prisma.$transaction(async (tx) => {
            //kiểm tra voucher có tồn tại không
            const voucher = await tx.voucher.findUnique({
                where: { id: voucherId },
            });
            //nếu không tồn tại thì ném lỗi
            if (!voucher) throw new BadRequestException("Voucher not found");

            //kiểm tra user có tồn tại không
            const user = await tx.user.findUnique({
                where: { id: userId },
            });
            //nếu không tồn tại thì ném lỗi
            if (!user) throw new BadRequestException("User not found");

            //lấy số lần sử dụng voucher của user
            return await tx.voucherUsage.count({
                where: { voucherId, userId },
            });
        });
    }


}