import { PrismaService } from '@/prisma/prisma.service';
import { Voucher } from './entities/voucher.entity';
import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { VoucherType,VoucherApplyType,VoucherProvider, Prisma } from '@prisma/client';
import type { VoucherListResponse, VoucherCreateResponse, VoucherDeleteResponse, VoucherDetailResponse, VoucherCheckResponse, VoucherListRequest, IVoucherItem } from '@shared/types/voucher';
import { ElasticsearchService } from '@nestjs/elasticsearch';

interface IVoucherService {
  create(createVoucherDto: CreateVoucherDto): Promise<VoucherCreateResponse>;
  findAllByShop(shopId: string, params?: { page?: number; limit?: number }): Promise<VoucherListResponse>;
  findOne(id: string): Promise<VoucherDetailResponse>;
  update(id: string, updateVoucherDto: UpdateVoucherDto): Promise<VoucherDetailResponse>;
  remove(id: string): Promise<void>;
  search(q: string, params: VoucherListRequest): Promise<VoucherListResponse>;
  checkVoucher(code: string): Promise<VoucherCheckResponse>;
  removeVoucherIndex(id: string): Promise<void>;
}



@Injectable()
export class VoucherService implements IVoucherService {
  private readonly voucherIndex = 'vouchers';
  constructor(
    private readonly prisma: PrismaService,
    private readonly elasticsearchService: ElasticsearchService
  ) {}

  async onModuleInit(): Promise<void> {
    /** Tạo Elasticsearch index nếu chưa tồn tại */
    await this.createVoucherIndex();
    /** Đồng bộ tất cả voucher từ DB sang Elasticsearch */
    await this.syncAllVouchersToEs();
  }


  /** Tạo Elasticsearch index nếu chưa tồn tại */
  private async createVoucherIndex(){
    // kiểm tra xem index tồn tại chưa
    const indexExists = await this.elasticsearchService.indices.exists({
      index: this.voucherIndex,
    });

    // nếu chưa tồn tại thì tạo index
    if (!indexExists) {
      // tạo index với mappings cụ thể
      await this.elasticsearchService.indices.create({
        // tên index
        index: this.voucherIndex,
        // mappings cụ thể
        mappings: {
          properties: {
            id: { type: 'keyword' },
            code: { type: 'keyword' },
            name: { type: 'text' },
            type: { type: 'keyword' },
            applyType: { type: 'keyword' },
            provider: { type: 'keyword' },
            value: { type: 'float' },
            maxValue: { type: 'float' },
            minOrderValue: { type: 'float' },
            quantity: { type: 'integer' },
            used: { type: 'integer' },
            usageLimitPerUser: { type: 'integer' },
            shippingDiscount: { type: 'float' },
            isActive: { type: 'boolean' },
            isPublic: { type: 'boolean' },
            startTime: { type: 'date' },
            endTime: { type: 'date' },
            createdAt: { type: 'date' },
            updatedAt: { type: 'date' },
          },
        },
      });
    }
  }


  /** Index voucher vào Elasticsearch */
  private async indexVoucher(voucher: {
    // id của voucher
    id: string; 
    // mã voucher
    code: string; 
    // tên voucher
    name: string; 
    // giá trị voucher
    value: number;
    // loại voucher
    type: string; 
    // loại áp dụng voucher
    applyType: string | null; 
    // nhà cung cấp voucher
    provider: string;
    // số lượng voucher
    quantity: number | null; 
    // số lượng đã sử dụng
    used: number | null;
    // số lượng sử dụng mỗi người
    usageLimitPerUser: number | null;
    // giảm giá vận chuyển
    shippingDiscount: number | null;
    // trạng thái hoạt động
    isActive: boolean; 
    // trạng thái công khai
    isPublic: boolean;
    // thời gian bắt đầu
    startTime: Date; 
    // thời gian kết thúc
    endTime: Date; 
    // thời gian tạo
    createdAt: Date;
    // giá trị đơn hàng tối thiểu
    minOrderValue?: number | null; 
    // giá trị đơn hàng tối đa
    maxValue?: number | null;
  }): Promise<void> {

    // index voucher vào Elasticsearch
    await this.elasticsearchService.index({
      // tên index
      index: this.voucherIndex,
      // id của voucher
      id: voucher.id,
      // document chứa thông tin voucher
      document: {
        id: voucher.id,
        code: voucher.code,
        name: voucher.name,
        value: voucher.value,
        type: voucher.type,
        applyType: voucher.applyType,
        provider: voucher.provider,
        /** Fallback về 0 nếu quantity là null */
        quantity: voucher.quantity ?? 0,
        /** Fallback về 0 nếu used là null */
        used: voucher.used ?? 0,
        minOrderValue: voucher.minOrderValue,
        maxValue: voucher.maxValue,
        shippingDiscount: voucher.shippingDiscount,
        usageLimitPerUser: voucher.usageLimitPerUser,
        isActive: voucher.isActive,
        isPublic: voucher.isPublic,
        startTime: voucher.startTime,
        endTime: voucher.endTime,
        createdAt: voucher.createdAt,
      },
    });
  }

  /** Xoá voucher khỏi Elasticsearch index */
   async removeVoucherIndex(id: string): Promise<void> {
    // xoá voucher khỏi Elasticsearch index
    await this.elasticsearchService.delete({
      // tên index
      index: this.voucherIndex,
      // id của voucher
      id,
    }).catch(() => { /* Bỏ qua nếu document không tồn tại */ });
  }


  async create(createVoucherDto: CreateVoucherDto): Promise<VoucherCreateResponse> {
    try {
      // Validate DTO first
      this.validateCreateVoucherDto(createVoucherDto);

      // convert date string to date
      const start = new Date(createVoucherDto.startDate!);
      const end = new Date(createVoucherDto.endDate!);

      // check if date is valid
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new BadRequestException('Invalid date');
      }

      // check if start date is before end date
      if (start >= end) {
        throw new BadRequestException('Start date must be before end date');
      }

      // check if value is greater than 0
      if (createVoucherDto.value! <= 0) {
        throw new BadRequestException('Value must be greater than 0');
      }

      // check if quantity is greater than 0
      if (createVoucherDto.quantity! <= 0) {
        throw new BadRequestException('Quantity must be greater than 0');
      }

      //check nếu là DISCOUNT_PERCENT thì value phải <= 100
      if (createVoucherDto.type === 'DISCOUNT_PERCENT' && createVoucherDto.value! > 100) {
        throw new BadRequestException('Percent cannot exceed 100');
      }

      //check nếu là FREESHIPPING thì shippingDiscount phải > 0
      if (createVoucherDto.type === 'FREESHIPPING') {
        if (!createVoucherDto.shippingDiscount || createVoucherDto.shippingDiscount <= 0) {
          throw new BadRequestException('Shipping discount must be > 0');
        }
      }



      //tạo mới voucher
      const newVoucher = await this.prisma.voucher.create({
        data: {
          code: createVoucherDto.code!.toUpperCase().trim(),
          name: createVoucherDto.name!.trim(),
          type: createVoucherDto.type!, 
          applyType: createVoucherDto.applyType!,
          provider: createVoucherDto.provider!,
          value: createVoucherDto.value!,
          maxValue: createVoucherDto.maxValue ?? null,
          minOrderValue: createVoucherDto.minOrderValue ?? null,
          quantity: createVoucherDto.quantity!,
          used: createVoucherDto.used ?? 0,
          usageLimitPerUser: createVoucherDto.usageLimitPerUser ?? null,
          shippingDiscount: createVoucherDto.shippingDiscount ?? null,
          isActive: createVoucherDto.isActive ?? true,
          isPublic: createVoucherDto.isPublic ?? true,
          startTime: start,
          endTime: end,
        }
      });

      // index voucher vào Elasticsearch
      await this.indexVoucher(newVoucher);

      return {
        success: true,
        message: 'Voucher created successfully',
        data: {
          id: newVoucher.id,
          code: newVoucher.code,
          name: newVoucher.name,
          type: newVoucher.type,
          applyType: newVoucher.applyType,
          provider: newVoucher.provider,
          value: newVoucher.value || 0,
          maxValue: newVoucher.maxValue || 0,
          minOrderValue: newVoucher.minOrderValue || 0,
          quantity: newVoucher.quantity || 0,
          used: newVoucher.used || 0,
          usageLimitPerUser: newVoucher.usageLimitPerUser || 0,
          shippingDiscount: newVoucher.shippingDiscount || 0,
          isActive: newVoucher.isActive,
          isPublic: newVoucher.isPublic,
          startTime: newVoucher.startTime,
          endTime: newVoucher.endTime,
          createdAt: newVoucher.createdAt.toISOString(),
        }
      };
    } catch (error : any ) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      //check nếu là P2002 thì throw ConflictException
      //lỗi p2002 là lỗi trùng lặp dữ liệu
      if (error.code === 'P2002') {
        throw new ConflictException('Voucher code already exists');
      }
      // throw error
      throw new BadRequestException(`Failed to create voucher: ${error.message}`);
    }
  }


  /**
   * Hàm tạo voucher theo shop
   * @param shopId  - id của shop
   * @param createVoucherDto - thông tin voucher
   * @returns 
   */
  async createByShop(shopId:string,createVoucherDto: CreateVoucherDto): Promise<VoucherCreateResponse> {
    try {
      // Validate DTO first
      this.validateCreateVoucherDto(createVoucherDto);

      // convert date string to date
      const start = new Date(createVoucherDto.startDate!);
      const end = new Date(createVoucherDto.endDate!);

      // check if date is valid
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new BadRequestException('Invalid date');
      }

      // check if shopId is valid
      if(!shopId) {
        throw new BadRequestException("ShopId is not found")
      }

      // check if start date is before end date
      if (start >= end) {
        throw new BadRequestException('Start date must be before end date');
      }

      // check if value is greater than 0
      if (createVoucherDto.value! <= 0) {
        throw new BadRequestException('Value must be greater than 0');
      }

      // check if quantity is greater than 0
      if (createVoucherDto.quantity! <= 0) {
        throw new BadRequestException('Quantity must be greater than 0');
      }

      if (createVoucherDto.type === 'DISCOUNT_PERCENT' && createVoucherDto.value! > 100) {
        throw new BadRequestException('Percent cannot exceed 100');
      }

      if (createVoucherDto.type === 'FREESHIPPING') {
        if (!createVoucherDto.shippingDiscount || createVoucherDto.shippingDiscount <= 0) {
          throw new BadRequestException('Shipping discount must be > 0');
        }
      }

      const newVoucher = await this.prisma.voucher.create({
        data: {
          code: createVoucherDto.code!.toUpperCase().trim(),
          shopId:shopId,
          name: createVoucherDto.name!.trim(),
          type: createVoucherDto.type!,
          applyType: createVoucherDto.applyType!,
          provider: "SHOP",
          value: createVoucherDto.value!,
          maxValue: createVoucherDto.maxValue ?? null,
          minOrderValue: createVoucherDto.minOrderValue ?? null,
          quantity: createVoucherDto.quantity!,
          used: createVoucherDto.used ?? 0,
          usageLimitPerUser: createVoucherDto.usageLimitPerUser ?? null,
          shippingDiscount: createVoucherDto.shippingDiscount ?? null,
          isActive: createVoucherDto.isActive ?? true,
          isPublic: createVoucherDto.isPublic ?? true,
          startTime: start,
          endTime: end,
        }
      });

      /** Index voucher mới vào Elasticsearch */
      await this.indexVoucher(newVoucher);

      return {
        success: true,
        message: 'Voucher created successfully',
        data: {
          id: newVoucher.id,
          code: newVoucher.code,
          name: newVoucher.name,
          shopId:shopId,
          type: newVoucher.type,
          applyType: newVoucher.applyType,
          provider: newVoucher.provider,
          value: newVoucher.value || 0,
          maxValue: newVoucher.maxValue || 0,
          minOrderValue: newVoucher.minOrderValue || 0,
          quantity: newVoucher.quantity || 0,
          used: newVoucher.used || 0,
          usageLimitPerUser: newVoucher.usageLimitPerUser || 0,
          shippingDiscount: newVoucher.shippingDiscount || 0,
          isActive: newVoucher.isActive,
          isPublic: newVoucher.isPublic,
          startTime: newVoucher.startTime,
          endTime: newVoucher.endTime,
          createdAt: newVoucher.createdAt.toISOString(),
        }
      };
    } catch (error : any ) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      if (error.code === 'P2002') {
        throw new ConflictException('Voucher code already exists');
      }
      throw new BadRequestException(`Failed to create voucher: ${error.message}`);
    }
  }

  /**
   * Validates the CreateVoucherDto to ensure all business rules are met
   * @param dto - The DTO to validate
   * @throws BadRequestException if validation fails
   */
  private validateCreateVoucherDto(dto: CreateVoucherDto): void {
    // Validate required fields exist
    if (dto.code === undefined || dto.code === null) {
      throw new BadRequestException('Voucher code is required');
    }
    if (dto.name === undefined || dto.name === null) {
      throw new BadRequestException('Voucher name is required');
    }
    if (dto.type === undefined || dto.type === null) {
      throw new BadRequestException('Voucher type is required');
    }
    if (dto.applyType === undefined || dto.applyType === null) {
      throw new BadRequestException('Voucher applyType is required');
    }
    if (dto.value === undefined || dto.value === null) {
      throw new BadRequestException('Voucher value is required');
    }
    if (dto.quantity === undefined || dto.quantity === null) {
      throw new BadRequestException('Voucher quantity is required');
    }
    if (dto.startDate === undefined || dto.startDate === null) {
      throw new BadRequestException('Start date is required');
    }
    if (dto.endDate === undefined || dto.endDate === null) {
      throw new BadRequestException('End date is required');
    }

    // Validate required string fields are not empty
    if (dto.code.trim().length === 0) {
      throw new BadRequestException('Voucher code is required and cannot be empty');
    }

    if (dto.name.trim().length === 0) {
      throw new BadRequestException('Voucher name is required and cannot be empty');
    }

    // Validate code format (alphanumeric, hyphens, underscores)
    if (!/^[A-Z0-9_-]+$/i.test(dto.code)) {
      throw new BadRequestException('Voucher code must contain only letters, numbers, hyphens, and underscores');
    }

    // Validate numeric values
    if (dto.value <= 0) {
      throw new BadRequestException('Voucher value must be greater than 0');
    }

    if (dto.quantity <= 0) {
      throw new BadRequestException('Voucher quantity must be greater than 0');
    }

    if (dto.usageLimitPerUser !== undefined && dto.usageLimitPerUser !== null && dto.usageLimitPerUser <= 0) {
      throw new BadRequestException('Usage limit per user must be greater than 0');
    }

    if (dto.used !== undefined && dto.used !== null && dto.used !== 0) {
      throw new BadRequestException('Used count must be 0 when creating a new voucher');
    }

    // Validate minOrderValue if provided
    if (dto.minOrderValue !== undefined && dto.minOrderValue !== null && dto.minOrderValue < 0) {
      throw new BadRequestException('Minimum order value cannot be negative');
    }

    // Validate maxValue for DISCOUNT_PERCENT type
    if (dto.type === VoucherType.DISCOUNT_PERCENT) {
      if (dto.value > 100) {
        throw new BadRequestException('Discount percentage cannot exceed 100%');
      }

      if (dto.maxValue && dto.maxValue <= 0) {
        throw new BadRequestException('Max discount value must be greater than 0 for percentage discounts');
      }
    }

    // Validate shippingDiscount
    if (dto.shippingDiscount !== undefined && dto.shippingDiscount !== null && dto.shippingDiscount < 0) {
      throw new BadRequestException('Shipping discount cannot be negative');
    }

    // Validate dates
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    const now = new Date();

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid date format for startDate or endDate');
    }

    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    if (endDate <= now) {
      throw new BadRequestException('Voucher end date must be in the future');
    }
  }

  /**
   * Get all vouchers by shop
   * @param shopId - Shop ID
   * @param params - Pagination parameters
   * @returns List of vouchers
   */
  async findAllByShop(shopId: string,
    params?: { page?: number; limit?: number }): Promise<VoucherListResponse> {
    
    // validate params
    const page = Math.max(params?.page ?? 1, 1);
    // validate limit
    const limit = Math.max(params?.limit ?? 10, 1);
    // calculate skip
    const skip = (page - 1) * limit;

    //nếu shopId không tồn tại thì throw error
    if(!shopId) throw new BadRequestException("Shop id is required")

    //câu điều kiện where
    const where = shopId ? { shopId } : {};


    //tác dụng của promise.all là để lấy dữ liệu và đếm số lượng cùng lúc
    const [voucher, total] = await Promise.all([
      this.prisma.voucher.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.voucher.count({ where }),
    ]);

    return {
      success: true,
      message: 'Get shop voucher successfully',
      data: voucher.map((v) => ({
        id: v.id,
        code: v.code || '',
        name: v.name || '',
        shopId: shopId,
        value: v.value || 0,
        type: v.type  || null,
        applyType: v.applyType || null,
        quantity: v.quantity || 0,
        used: v.used || 0,
        minOrderValue: v.minOrderValue ?? undefined,
        maxValue: v.maxValue ?? undefined,
        shippingDiscount: v.shippingDiscount ?? undefined,
        usageLimitPerUser: v.usageLimitPerUser ?? undefined,
        provider: v.provider,
        isActive: v.isActive,
        isPublic: v.isPublic,
        startTime: v.startTime,
        endTime: v.endTime,
        createdAt: v.createdAt.toISOString(),
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

  }


  /**
   * Get all vouchers
   * @param params - Pagination parameters
   * @returns List of vouchers
   */
  async findAll(params?: { page?: number; limit?: number }): Promise<VoucherListResponse> {
    // validate params
    const page = Math.max(params?.page ?? 1, 1);
    // validate limit
    const limit = Math.max(params?.limit ?? 10, 1);
    // calculate skip
    const skip = (page - 1) * limit;

    // const where = shopId ? { shopId } : {};

    //tác dụng của promise.all là để lấy dữ liệu và đếm số lượng cùng lúc
    const [voucher, total] = await Promise.all([
      this.prisma.voucher.findMany({
        // where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.voucher.count({}),
    ]);

    return {
      success: true,
      message: 'Get shop voucher successfully',
      data: voucher.map((v) => ({
        id: v.id,
        code: v.code || '',
        name: v.name || '',
        value: v.value || 0,
        type: v.type  || null,
        applyType: v.applyType || null,
        quantity: v.quantity || 0,
        used: v.used || 0,
        minOrderValue: v.minOrderValue ?? undefined,
        maxValue: v.maxValue ?? undefined,
        shippingDiscount: v.shippingDiscount ?? undefined,
        usageLimitPerUser: v.usageLimitPerUser ?? undefined,
        provider: v.provider,
        isActive: v.isActive,
        isPublic: v.isPublic,
        startTime: v.startTime,
        endTime: v.endTime,
        createdAt: v.createdAt.toISOString(),
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

  }

  /**
   * Get voucher by id
   * @param id - Voucher ID
   * @returns Voucher detail
   */
  async findOne(id: string): Promise<VoucherDetailResponse> {
    // validate id
    if (!id) return Promise.reject(new NotFoundException('Id not found'));
    // find voucher by id
    const voucer = await this.prisma.voucher.findUnique({ where: { id } });
    // if voucher not found throw error
    if (!voucer) {
      return Promise.reject(new NotFoundException('Voucher not found'));
    }
    return {
      success: true,
      message: 'Get voucher successfully',
      data: {
        id: voucer.id,
        code: voucer.code || '',
        name: voucer.name || '',
        value: voucer.value || 0,
        type: voucer.type  || null,
        applyType: voucer.applyType || null,
        quantity: voucer.quantity || 0,
        used: voucer.used || 0,
        minOrderValue: voucer.minOrderValue ?? undefined,
        maxValue: voucer.maxValue ?? undefined,
        shippingDiscount: voucer.shippingDiscount ?? undefined,
        usageLimitPerUser: voucer.usageLimitPerUser ?? undefined,
        provider: voucer.provider,
        isActive: voucer.isActive,
        isPublic: voucer.isPublic,
        startTime: voucer.startTime,
        endTime: voucer.endTime,
        createdAt: voucer.createdAt.toISOString(),
      },
    };
  }


  /**
   * Update voucher
   * @param id - Voucher ID
   * @param updateVoucherDto - Update voucher DTO
   * @returns Voucher detail
   */
  async update(id: string, updateVoucherDto: UpdateVoucherDto): Promise<VoucherDetailResponse> {
    try {
      // validate id
      if (!id) throw new NotFoundException('Id not found');
      // find voucher by id
      const existingVoucher = await this.prisma.voucher.findUnique({ where: { id } });
      // if voucher not found throw error
      if (!existingVoucher) {
        throw new NotFoundException('Voucher not found');
      }
      // Prepare update data
      const updateData: any = {};
      if (updateVoucherDto.name !== undefined) updateData.name = updateVoucherDto.name.trim();
      if (updateVoucherDto.value !== undefined) updateData.value = updateVoucherDto.value;
      if (updateVoucherDto.type !== undefined) updateData.type = updateVoucherDto.type;
      if (updateVoucherDto.applyType !== undefined) updateData.applyType = updateVoucherDto.applyType;
      if (updateVoucherDto.maxValue !== undefined) updateData.maxValue = updateVoucherDto.maxValue;
      if (updateVoucherDto.minOrderValue !== undefined) updateData.minOrderValue = updateVoucherDto.minOrderValue;
      if (updateVoucherDto.quantity !== undefined) updateData.quantity = updateVoucherDto.quantity;
      if (updateVoucherDto.usageLimitPerUser !== undefined) updateData.usageLimitPerUser = updateVoucherDto.usageLimitPerUser;
      if (updateVoucherDto.shippingDiscount !== undefined) updateData.shippingDiscount = updateVoucherDto.shippingDiscount;
      if (updateVoucherDto.isActive !== undefined) updateData.isActive = updateVoucherDto.isActive;
      if (updateVoucherDto.isPublic !== undefined) updateData.isPublic = updateVoucherDto.isPublic;
      if (updateVoucherDto.startDate !== undefined) updateData.startTime = new Date(updateVoucherDto.startDate);
      if (updateVoucherDto.endDate !== undefined) updateData.endTime = new Date(updateVoucherDto.endDate);

      // update voucher
      const updatedVoucher = await this.prisma.voucher.update({
        where: { id },
        data: updateData,
      });

      return {
        success: true,
        message: 'Voucher updated successfully',
        data: {
          id: updatedVoucher.id,
          code: updatedVoucher.code,
          name: updatedVoucher.name,
          value: updatedVoucher.value,
          type: updatedVoucher.type,
          applyType: updatedVoucher.applyType || null,
          quantity: updatedVoucher.quantity || 0,
          used: updatedVoucher.used || 0,
          minOrderValue: updatedVoucher.minOrderValue ?? undefined,
          maxValue: updatedVoucher.maxValue ?? undefined,
          shippingDiscount: updatedVoucher.shippingDiscount ?? undefined,
          usageLimitPerUser: updatedVoucher.usageLimitPerUser ?? undefined,
          provider: updatedVoucher.provider,
          isActive: updatedVoucher.isActive,
          isPublic: updatedVoucher.isPublic,
          startTime: updatedVoucher.startTime,
          endTime: updatedVoucher.endTime,
          createdAt: updatedVoucher.createdAt.toISOString(),
        },
      };
    } catch (error: any) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update voucher: ${error.message}`);
    }
  }
  /** Xoá voucher theo id, bao gồm cả Elasticsearch index */
  async remove(id: string): Promise<void> {
    /** Kiểm tra id có tồn tại không */
    if(!id) return Promise.reject(new NotFoundException('Id not found'));
    /** Thực hiện transaction xoá voucher trong database */
    await this.prisma.$transaction(async (tx) => {
      /** Tìm voucher theo id */
      const voucher = await tx.voucher.findUnique({ where: { id } });
      /** Nếu không tìm thấy, throw lỗi */
      if (!voucher) {
        throw new NotFoundException('Voucher not found');
      }
      /** Xoá voucher khỏi database */
      await tx.voucher.delete({ where: { id } });
    });
    /** Xoá voucher khỏi Elasticsearch index (ngoài transaction vì không liên quan DB) */
    await this.removeVoucherIndex(id);
  }

  /** Đồng bộ toàn bộ voucher từ DB sang Elasticsearch */
  async syncAllVouchersToEs(): Promise<void> {
    const all_vouchers = await this.prisma.voucher.findMany();
    for (const voucher of all_vouchers) {
      await this.indexVoucher(voucher);
    }
  }

  /** Tìm kiếm voucher bằng Elasticsearch */
  async search(q: string, params?: { page?: number; limit?: number; activeOnly?: boolean }): Promise<VoucherListResponse> {
    const page = Math.max(params?.page ?? 1, 1);
    const limit = Math.min(Math.max(params?.limit ?? 10, 1), 50);
    /** Tính vị trí bắt đầu cho Elasticsearch */
    const from = (page - 1) * limit;

    // lấy thời gian hiện tại
    const now = new Date(Date.now());
    // lấy từ khoá tìm kiếm
    const keyword = q?.trim();

    /** Xây dựng điều kiện must cho bool query */
    const must_conditions = keyword
      ? [{
        bool: {
          should: [
            /** Term query cho code (keyword type, case-sensitive) — uppercase để khớp */
            { term: { code: keyword.toUpperCase() } },
            /** Match query cho name (text type, có phân tích) */
            { match: { name: { query: keyword, fuzziness: 'AUTO' } } },
          ],
          /** Chỉ cần khớp 1 trong 2 điều kiện */
          minimum_should_match: 1,
        },
      }]
      : [];

    /** Xây dựng điều kiện filter — chỉ áp dụng khi cần lọc voucher đang hoạt động */
    const filter_conditions = params?.activeOnly !== false
      ? [
          { term: { isActive: true } },
          { range: { startTime: { lte: now.toISOString() } } },
          { range: { endTime: { gte: now.toISOString() } } },
        ]
      : [];

    /** [DEBUG] Log query gửi đến Elasticsearch */
    const es_query = {
      index: this.voucherIndex,
      from,
      size: limit,
      query: {
        bool: {
          must: must_conditions,
          filter: filter_conditions,
        },
      },
      sort: [{ createdAt: { order: 'desc' } }],
    };
    console.log('[VOUCHER SEARCH] Query:', JSON.stringify(es_query, null, 2));

    /** Thực hiện search trên Elasticsearch */
    const result = await this.elasticsearchService.search(es_query);

    /** Tổng số kết quả tìm được */
    const total = typeof result.hits.total === 'number'
      ? result.hits.total
      : result.hits.total?.value ?? 0;

    /** Map kết quả từ Elasticsearch hits */
    const data = result.hits.hits.map((hit) => {
      const source = hit._source as Record<string, unknown>;
      return {
        id: source.id as string,
        code: source.code as string,
        name: source.name as string,
        value: source.value as number,
        type: (source.type as string) ?? null,
        applyType: (source.applyType as string) ?? null,
        quantity: (source.quantity as number) ?? 0,
        used: (source.used as number) ?? 0,
        minOrderValue: source.minOrderValue as number | undefined,
        maxValue: source.maxValue as number | undefined,
        shippingDiscount: source.shippingDiscount as number | undefined,
        usageLimitPerUser: source.usageLimitPerUser as number | undefined,
        provider: source.provider as string,
        isActive: source.isActive as boolean,
        isPublic: source.isPublic as boolean,
        startTime: new Date(source.startTime as string),
        endTime: new Date(source.endTime as string),
        createdAt: source.createdAt as string,
      };
    });

    return {
      success: true,
      message: 'Search voucher successfully',
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }


  /**
   * Check voucher
   * @param code - Voucher code
   * @returns Voucher check response
   */
  async checkVoucher(code: string): Promise<VoucherCheckResponse> {
    // validate code
    if (!code) {
      return Promise.reject(new BadRequestException('Voucher code is required'));
    }
    // get current time
    const now = new Date();
    // find voucher by code
    return await this.prisma.voucher.findFirst({
      where: {
        code: code.trim().toUpperCase(),
        isActive: true,
        startTime: { lte: now },
        endTime: { gte: now },
      },
    }).then((voucher) => {
      return {
        success: true,
        data: !!voucher,
      };
    }).catch((error) => {      throw new BadRequestException(`Failed to check voucher: ${error.message}`);
    });
  }
}
