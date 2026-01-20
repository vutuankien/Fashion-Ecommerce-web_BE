import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateInventoryDto, InventoryStatus } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { PrismaService } from 'src/prisma/prisma.service';


@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}
  /** tạo tồn kho mới */
  async create(dto: CreateInventoryDto) {
    /** block try catch để bắt lỗi */
    try {
      /** tạo bản ghi inventory mới */
      return await this.prisma.inventory.create({
        data: {
          /** id sản phẩm */
          productId: dto.productId,
          /** id kho */
          warehouseId: dto.warehouseId,
          /** id cửa hàng */
          shopId: dto.shopId,
          /** số lượng ban đầu */
          quantity: 0,
          /** số lượng dự trữ */
          reservedQuantity: 0,
          /** trạng thái tồn kho */
          status: InventoryStatus.ACTIVE,
        },
      });
    } catch (error) {
      /** kiểm tra lỗi trùng lặp từ prisma */
      if (error.code === 'P2002')
        /** ném lỗi conflict nếu đã tồn tại */
        throw new ConflictException('Inventory already exists');

      /** ném các lỗi khác */
      throw error;
    }
  }


  /** Service lấy danh sách inventory với pagination, search, sort, filters */
  async findAll(query?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    productId?: string;
    warehouseId?: string;
    shopId?: string;
    status?: InventoryStatus;
    minQuantity?: number;
    maxQuantity?: number;
  }) {
    /** Destructure và set default values */
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      productId,
      warehouseId,
      shopId,
      status,
      minQuantity,
      maxQuantity
    } = query || {};

    /** Validate và normalize */
    const PAGE_VAL = Math.max(1, page);
    const LIMIT_VAL = Math.max(1, Math.min(limit, 100));
    const OFFSET = (PAGE_VAL - 1) * LIMIT_VAL;

    /** Build where clause */
    const where: Record<string, unknown> = {};

    /** Search conditions - tìm kiếm theo product name */
    if (search) {
      where.product = {
        name: { contains: search, mode: 'insensitive' }
      };
    }

    /** Filter conditions */
    if (productId) where.productId = productId;
    if (warehouseId) where.warehouseId = warehouseId;
    if (shopId) where.shopId = shopId;
    if (status) where.status = status;

    /** Quantity range filter */
    if (minQuantity !== undefined || maxQuantity !== undefined) {
      const quantity_filter: Record<string, number> = {};
      if (minQuantity !== undefined) quantity_filter.gte = minQuantity;
      if (maxQuantity !== undefined) quantity_filter.lte = maxQuantity;
      where.quantity = quantity_filter;
    }

    /** Lấy data và total count song song */
    const [data, total] = await Promise.all([
      this.prisma.inventory.findMany({
        where,
        take: LIMIT_VAL,
        skip: OFFSET,
        orderBy: { [sortBy]: sortOrder }
      }),
      this.prisma.inventory.count({ where })
    ]);

    /** Trả về với pagination info */
    return {
      data,
      total,
      page: PAGE_VAL,
      limit: LIMIT_VAL,
      totalPage: Math.ceil(total / LIMIT_VAL)
    };
  }

  async findOne(id: string) {
    const DATA = await this.prisma.inventory.findUnique({
      where:{id}
    })
    if(!DATA) throw new NotFoundException(`Inventory with id ${id} not found`)
    return DATA
  }

  async update(id: string, updateInventoryDto: UpdateInventoryDto) {
    /** kiểm tra nhân viên có tồn tại không */
    const DATA = await this.prisma.inventory.findUnique({
      where: {
        id
      }
    })
    /** nếu không tìm thấy thì ném lỗi */
    if (!DATA) throw new NotFoundException(`Inventory with id ${id} not found`);

    /** cập nhật dữ liệu */
    const UPDATE_DATA = await this.prisma.inventory.update({
      where: {
        id
      },
      data: updateInventoryDto
    })
    /** trả về dữ liệu sau cập nhật */
    return UPDATE_DATA;

  }

  async remove(id: string) {
    const DATA = await this.prisma.inventory.findUnique({
      where:{id}
    })
    if(!DATA) throw new NotFoundException(`Inventory with id ${id} not found`)
    return this.prisma.inventory.delete({
      where:{id}
    })
  }
}
