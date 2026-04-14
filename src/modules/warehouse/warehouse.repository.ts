import { PrismaService } from "@/prisma/prisma.service";
import { CreateWarehouseDto } from "./dto/create-warehouse.dto";
import { UpdateWarehouseDto } from "./dto/update-warehouse.dto";
import { DeleteWarehouseDto } from "./dto/delete-warehouse.dto";

export class WarehouseRepository {
    constructor(
        /**Khởi tạo PrismaService */
        private readonly PRISMA: PrismaService = new PrismaService()
    ) {}

    /**Hàm tạo warehouse */
    async create(createDto: CreateWarehouseDto) {
        //Gọi prisma tạo warehouse
        const DATA = this.PRISMA.warehouse.create({
            data: createDto
        })

        //Trả về dữ liệu
        return DATA
    }

    /**Hàm tìm kiếm warehouse */
    async findMany(limit: number, skip: number) {
        //Trả về tất cả warehouse
        const DATA = this.PRISMA.warehouse.findMany({
            take: limit,
            skip: skip
        })
        return DATA
    }


    //Đếm tổng số lượng warehouse
    async count() {
        return this.PRISMA.warehouse.count();
    }

    //Hàm tìm kiếm warehouse theo id
    async findOne(id: string) {

        //Trả về warehouse theo id
        const DATA = this.PRISMA.warehouse.findUnique({
            where: {
                id
            }
        })
        return DATA
    }


    //Hàm cập nhật warehouse
    async update(id: string, updateDto: UpdateWarehouseDto) {
        //Cập nhật warehouse theo id
        const DATA = this.PRISMA.warehouse.update({
            where: {
                id
            },
            data: updateDto
        })

        //Trả về dữ liệu
        return DATA
    }

    //Hàm xóa warehouse
    async remove(deleteDto : DeleteWarehouseDto) {
        //Xóa warehouse theo id
        const DATA = this.PRISMA.warehouse.delete({
            where: {
                id: deleteDto.id
            }
        })

        //Trả về dữ liệu
        return DATA
    }

    /** Hàm tìm kiếm warehouse với filters */
    async findManyWithFilters(limit: number, skip: number, where: Record<string, unknown>, sortBy: string, sortOrder: string) {
        return this.PRISMA.warehouse.findMany({
            where,
            take: limit,
            skip,
            orderBy: { [sortBy]: sortOrder }
        });
    }

    /** Đếm số lượng warehouse với filters */
    async countWithFilters(where: Record<string, unknown>) {
        return this.PRISMA.warehouse.count({ where });
    }


}