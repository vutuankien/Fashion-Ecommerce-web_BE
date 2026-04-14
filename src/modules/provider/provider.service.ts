/** Import Injectable từ NestJS */
import { Injectable, NotFoundException, Query } from '@nestjs/common';
/** Import DTO tạo mới provider */
import { CreateProviderDto } from './dto/create-provider.dto';
/** Import DTO cập nhật provider */
import { UpdateProviderDto } from './dto/update-provider.dto';
/** Import PrismaService để tương tác với cơ sở dữ liệu */
import { PrismaService } from '@/prisma/prisma.service';

/** Service quản lý nhà cung cấp */
@Injectable()
export class ProviderService {
  /** Khởi tạo constructor */
  constructor (
    /** Inject PrismaService */
    private readonly PRISMA_SERVICE : PrismaService
  ) {}

  /** Hàm tạo mới nhà cung cấp */
  async create(create_provider_dto: CreateProviderDto) {
    /** Kiểm tra nhà cung cấp đã tồn tại chưa */
    const EXISTING_PROVIDER = await this.PRISMA_SERVICE.provider.findFirst({
      where: { name: create_provider_dto.name }
    });

    /** Nếu tồn tại thì ném lỗi */
    if (EXISTING_PROVIDER) throw new Error("Provider already exists");

    /** Kiểm tra tỉnh thành có tồn tại không */
    const PROVINCE = await this.PRISMA_SERVICE.provinces.findUnique({
      where: { id: create_provider_dto.province_id }
    });
    if (!PROVINCE) throw new Error("Province not found");

    /** Kiểm tra quận huyện có tồn tại không */
    const DISTRICT = await this.PRISMA_SERVICE.districts.findUnique({
      where: { id: create_provider_dto.district_id }
    });
    if (!DISTRICT) throw new Error("District not found");

    /** Kiểm tra xã phường có tồn tại không */
    const COMMUNE = await this.PRISMA_SERVICE.communes.findUnique({
      where: { id: create_provider_dto.commune_id }
    });
    if (!COMMUNE) throw new Error("Commune not found");

    /** Tạo mới nhà cung cấp */
    const DATA = await this.PRISMA_SERVICE.provider.create({
      data: create_provider_dto
    });

    /** Trả về dữ liệu */
    return DATA;
  }

  /** Hàm lấy danh sách tất cả nhà cung cấp với pagination, search, sort, filters */
  async findAll(query?: { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: 'asc' | 'desc'; typeProvider?: string; province_id?: string }) {
    /** Destructure và set default values */
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      typeProvider,
      province_id
    } = query || {};

    /** Validate và normalize */
    const MAX_LIMIT = Math.max(1, Math.min(limit, 100));
    const CURRENT_PAGE = Math.max(page, 1);
    const OFFSET = (CURRENT_PAGE - 1) * MAX_LIMIT;

    /** Build where clause */
    const where: Record<string, unknown> = {};

    /** Search conditions - tìm kiếm theo name, phone */
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }

    /** Filter conditions */
    if (typeProvider) where.typeProvider = typeProvider;
    if (province_id) where.province_id = province_id;

    /** Đếm tổng số records */
    const TOTAL = await this.PRISMA_SERVICE.provider.count({ where });
    const TOTAL_PAGE = Math.max(1, Math.ceil(TOTAL / MAX_LIMIT));

    /** Lấy danh sách từ DB */
    const DATA = await this.PRISMA_SERVICE.provider.findMany({
      where,
      take: MAX_LIMIT,
      skip: OFFSET,
      orderBy: { [sortBy]: sortOrder }
    });

    /** Nếu không có dữ liệu thì ném lỗi */
    if(!DATA) throw new Error("Find all provider failed")

    /** Trả về với pagination info */
    return {
      data: DATA,
      total: TOTAL,
      page: CURRENT_PAGE,
      limit: MAX_LIMIT,
      totalPage: TOTAL_PAGE
    };
  }

  /** Hàm tìm nhà cung cấp theo id */
  async findOne(id: string) {
    /** Tìm nhà cung cấp theo id */
    const DATA = await this.PRISMA_SERVICE.provider.findUnique({where: {id}})

    /** Nếu không tìm thấy thì ném lỗi */
    if(!DATA) throw new NotFoundException("Find provider failed")

    /** Trả về dữ liệu */
    return DATA
  }

  /** Hàm cập nhật nhà cung cấp */
  async update(id: string, update_provider_dto: UpdateProviderDto) {
    /** Kiểm tra provider tồn tại */
    const EXIST_PROVIDER = await this.PRISMA_SERVICE.provider.findUnique({
      where: { id },
    });

    if (!EXIST_PROVIDER) {
      throw new NotFoundException('Provider not found');
    }

    /** Validate foreign keys */
    if (update_provider_dto.province_id) {
      const PROVINCE = await this.PRISMA_SERVICE.provinces.findUnique({
        where: { id: update_provider_dto.province_id },
      });
      if (!PROVINCE) throw new NotFoundException('Province not found');
    }

    if (update_provider_dto.district_id) {
      const DISTRICT = await this.PRISMA_SERVICE.districts.findUnique({
        where: { id: update_provider_dto.district_id },
      });
      if (!DISTRICT) throw new NotFoundException('District not found');
    }

    if (update_provider_dto.commune_id) {
      const COMMUNE = await this.PRISMA_SERVICE.communes.findUnique({
        where: { id: update_provider_dto.commune_id },
      });
      if (!COMMUNE) throw new NotFoundException('Commune not found');
    }

    /**Update */
    return this.PRISMA_SERVICE.provider.update({
      where: { id },
      data: update_provider_dto,
    });
  }


  /** Hàm xóa nhà cung cấp */
  async remove(id: string) {
    const EXIST = await this.PRISMA_SERVICE.provider.findUnique({
      where: { id },
    });

    if (!EXIST) {
      throw new NotFoundException('Provider not found');
    }

    const DATA = await this.PRISMA_SERVICE.provider.delete({
      where: { id },
    });

    return DATA;
  }

}
