/** Import các decorator từ NestJS */
import { Controller, Get, Param, Query } from '@nestjs/common';
/** Import AddressService để xử lý nghiệp vụ địa chỉ */
import { AddressService } from './address.service';
/** Import ResponseHelper để định dạng phản hồi API */
import { ResponseHelper } from 'src/helper/response.helper';
/** Import Cron từ NestJS Schedule */
import { Cron } from '@nestjs/schedule';

/** Định nghĩa Controller cho Address */
@Controller('address')
/** Lớp AddressController */
export class AddressController {
  /** Hàm khởi tạo với AddressService */
  constructor(
    /** Inject AddressService */
    private readonly ADDRESS_SERVICE: AddressService
  ) { }

  /** Endpoint sync tỉnh thành từ API - Chạy mỗi 2 tháng vào ngày 15 lúc 12:00 PM */
  @Get('provinces/sync')
  /** Thiết lập Cron job */
  @Cron('0 12 15 */2 *')
  /** Hàm xử lý đồng bộ tỉnh thành */
  async fetchProvinces() {
    /** Khối try để bắt lỗi */
    try {
      /** Thực hiện đồng bộ qua service */
      const DATA = await this.ADDRESS_SERVICE.fetchProvinces();
      /** Trả về kết quả thành công */
      return ResponseHelper.Success(DATA, 'Fetch provinces successfully', 201);
    } /** Khối catch để xử lý lỗi */ catch (error) {
      /** Trả về lỗi nếu có */
      return ResponseHelper.Error(error.message, 500);
    }
  }

  /** Endpoint lấy tỉnh thành theo id */
  @Get('provinces/:id')
  /** Hàm xử lý lấy một tỉnh thành */
  async getProvinceById(
    /** Nhận id từ param */
    @Param('id') id: string
  ) {
    /** Khối try để bắt lỗi */
    const DATA = await this.ADDRESS_SERVICE.getProvinceById(id);
    /** Trả về kết quả thành công */
    return ResponseHelper.Success(DATA, 'Fetch province by id successfully', 200);
  }

  /** Endpoint lấy danh sách tỉnh thành phân trang */
  @Get('provinces')
  /** Hàm xử lý lấy danh sách */
  async getAllProvinces(
    /** Nhận limit từ query */
    @Query('limit') limit: string = '10',
    /** Nhận page từ query */
    @Query('page') page: string = '1'
  ) {
    /** Khối try để bắt lỗi */
    try {
      /** Chuyển đổi limit sang số */
      const LIMIT_NUM = parseInt(limit) || 10;
      /** Chuyển đổi page sang số */
      const PAGE_NUM = parseInt(page) || 1;

      /** Lấy dữ liệu từ service */
      const DATA = await this.ADDRESS_SERVICE.getAllProvinces(LIMIT_NUM, PAGE_NUM);
      /** Trả về kết quả thành công */
      return ResponseHelper.Success(DATA, 'Fetch all provinces successfully', 200);
    } /** Khối catch để xử lý lỗi */ catch (error) {
      /** Trả về lỗi nếu có */
      return ResponseHelper.Error(error.message, 500);
    }
  }

  /** Endpoint sync quận huyện từ API - Chạy mỗi 2 tháng vào ngày 15 lúc 12:00 PM */
  @Get('districts/sync')
  /** Thiết lập Cron job */
  @Cron('0 12 15 */2 *')
  /** Hàm xử lý đồng bộ quận huyện */
  async fetchDistricts() {
    /** Khối try để bắt lỗi */
    try {
      /** Thực hiện đồng bộ qua service */
      const DATA = await this.ADDRESS_SERVICE.fetchDistricts();
      /** Trả về kết quả thành công */
      return ResponseHelper.Success(DATA, 'Fetch districts successfully', 201);
    } /** Khối catch để xử lý lỗi */ catch (error) {
      /** Trả về lỗi nếu có */
      return ResponseHelper.Error(error.message, 500);
    }
  }

  /** Endpoint lấy quận huyện theo id */
  @Get('districts/:id')
  /** Hàm xử lý lấy một quận huyện */
  async getDistrictById(
    /** Nhận id từ param */
    @Param('id') id: string
  ) {
    /** Lấy dữ liệu từ service */
    const DATA = await this.ADDRESS_SERVICE.getDistrictById(id);
    /** Trả về kết quả thành công */
    return ResponseHelper.Success(DATA, 'Fetch district by id successfully', 200);
  }

  /** Endpoint lấy danh sách quận huyện phân trang */
  @Get('districts')
  /** Hàm xử lý lấy danh sách */
  async getAllDistricts(
    /** Nhận limit từ query */
    @Query('limit') limit: string = '10',
    /** Nhận page từ query */
    @Query('page') page: string = '1'
  ) {
    /** Khối try để bắt lỗi */
    try {
      /** Chuyển đổi limit sang số */
      const LIMIT_NUM = parseInt(limit) || 10;
      /** Chuyển đổi page sang số */
      const PAGE_NUM = parseInt(page) || 1;

      /** Lấy dữ liệu từ service */
      const DATA = await this.ADDRESS_SERVICE.getAllDistricts(LIMIT_NUM, PAGE_NUM);
      /** Trả về kết quả thành công */
      return ResponseHelper.Success(DATA, 'Fetch all districts successfully', 200);
    } /** Khối catch để xử lý lỗi */ catch (error) {
      /** Trả về lỗi nếu có */
      return ResponseHelper.Error(error.message, 500);
    }
  }

  /** Endpoint sync xã phường từ API - Chạy mỗi 2 tháng vào ngày 15 lúc 12:00 PM */
  @Get('communes/sync')
  /** Thiết lập Cron job */
  @Cron('0 12 15 */2 *')
  /** Hàm xử lý đồng bộ xã phường */
  async fetchAllCommunesByDistricts() {
    /** Khối try để bắt lỗi */
    try {
      /** Thực hiện đồng bộ qua service */
      const DATA = await this.ADDRESS_SERVICE.fetchAllCommunesByDistricts();
      /** Trả về kết quả thành công */
      return ResponseHelper.Success(DATA, 'Fetch all communes successfully', 200);
    } /** Khối catch để xử lý lỗi */ catch (error) {
      /** Trả về lỗi nếu có */
      return ResponseHelper.Error(error.message, 500);
    }
  }

  /** Endpoint lấy xã phường theo id */
  @Get('communes/:id')
  /** Hàm xử lý lấy một xã phường */
  async getCommuneById(
    /** Nhận id từ param */
    @Param('id') id: string
  ) {
    /** Lấy dữ liệu từ service */
    const DATA = await this.ADDRESS_SERVICE.getCommuneById(id);
    /** Trả về kết quả thành công */
    return ResponseHelper.Success(DATA, 'Fetch commune by id successfully', 200);
    
  }

  /** Endpoint lấy danh sách xã phường theo quận huyện */
  @Get('communes')
  /** Hàm xử lý lấy danh sách */
  async getCommunes(
    /** Nhận district_id từ query */
    @Query('district_id') district_id?: string,
    /** Nhận province_id từ query */
    @Query('province_id') province_id?: string,
    /** Nhận limit từ query */
    @Query('limit') limit: string = '10',
    /** Nhận page từ query */
    @Query('page') page: string = '1'
  ) {
    /** Khối try để bắt lỗi */
    try {
      /** Chuyển đổi limit sang số */
      const LIMIT_NUM = parseInt(limit) || 10;
      /** Chuyển đổi page sang số */
      const PAGE_NUM = parseInt(page) || 1;

      /** Nếu có district_id thì filter theo district */
      if (district_id) {
        /** Kiểm tra có province_id không */
        const DATA = province_id
          ? /** Lấy theo cả district và province */ await this.ADDRESS_SERVICE.getCommunesByDistrictIdAndProvinceId(district_id, province_id, LIMIT_NUM, PAGE_NUM)
          : /** Lấy theo district */ await this.ADDRESS_SERVICE.getCommunesByDistrictId(district_id, LIMIT_NUM, PAGE_NUM);

        /** Trả về kết quả thành công */
        return ResponseHelper.Success(DATA, 'Fetch communes by district successfully', 200);
      }

      /** Không có district_id thì lấy tất cả */
      const DATA = await this.ADDRESS_SERVICE.getAllCommunes(LIMIT_NUM, PAGE_NUM);
      /** Trả về kết quả thành công */
      return ResponseHelper.Success(DATA, 'Fetch all communes successfully', 200);
    } /** Khối catch để xử lý lỗi */ catch (error) {
      /** Trả về lỗi nếu có */
      return ResponseHelper.Error(error.message, 500);
    }
  }
}
