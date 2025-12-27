/** Import Injectable từ NestJS */
import { Injectable, Query } from '@nestjs/common';
/** Import DTO tạo mới provider */
import { CreateProviderDto } from './dto/create-provider.dto';
/** Import DTO cập nhật provider */
import { UpdateProviderDto } from './dto/update-provider.dto';
/** Import PrismaService để tương tác với cơ sở dữ liệu */
import { PrismaService } from 'src/prisma/prisma.service';

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

  /** Hàm lấy danh sách tất cả nhà cung cấp */
  async findAll() {
    /** Lấy danh sách từ DB */
    const DATA = await this.PRISMA_SERVICE.provider.findMany()

    /** Nếu không có dữ liệu thì ném lỗi */
    if(!DATA) throw new Error("Find all provider failed")

    /** Trả về dữ liệu */
    return DATA
  }

  /** Hàm tìm nhà cung cấp theo id */
  async findOne(id: string) {
    /** Tìm nhà cung cấp theo id */
    const DATA = await this.PRISMA_SERVICE.provider.findUnique({where: {id}})

    /** Nếu không tìm thấy thì ném lỗi */
    if(!DATA) throw new Error("Find provider failed")

    /** Trả về dữ liệu */
    return DATA
  }

  /** Hàm cập nhật nhà cung cấp */
  async update(id: string, update_provider_dto: UpdateProviderDto) {
    /** Kiểm tra nếu có cập nhật province_id */
    if (update_provider_dto.province_id) {
      const PROVINCE = await this.PRISMA_SERVICE.provinces.findUnique({
        where: { id: update_provider_dto.province_id }
      });
      if (!PROVINCE) throw new Error("Province not found");
    }

    /** Kiểm tra nếu có cập nhật district_id */
    if (update_provider_dto.district_id) {
      const DISTRICT = await this.PRISMA_SERVICE.districts.findUnique({
        where: { id: update_provider_dto.district_id }
      });
      if (!DISTRICT) throw new Error("District not found");
    }

    /** Kiểm tra nếu có cập nhật commune_id */
    if (update_provider_dto.commune_id) {
      const COMMUNE = await this.PRISMA_SERVICE.communes.findUnique({
        where: { id: update_provider_dto.commune_id }
      });
      if (!COMMUNE) throw new Error("Commune not found");
    }

    /** Cập nhật thông tin nhà cung cấp */
    const DATA = await this.PRISMA_SERVICE.provider.update({where: {id}, data: update_provider_dto})

    /** Nếu cập nhật thất bại thì ném lỗi */
    if(!DATA) throw new Error("Update provider failed")

    /** Trả về dữ liệu */
    return DATA
  }

  /** Hàm xóa nhà cung cấp */
  async remove(id: string) {
    /** Xóa nhà cung cấp */
    const DATA = await this.PRISMA_SERVICE.provider.delete({where: {id}})

    /** Nếu xóa thất bại thì ném lỗi */
    if(!DATA) throw new Error("Delete provider failed")

    /** Trả về dữ liệu */
    return DATA
  }
}
