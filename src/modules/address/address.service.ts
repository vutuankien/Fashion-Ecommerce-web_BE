import { Injectable, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '@/prisma/prisma.service';
import { firstValueFrom, NotFoundError } from 'rxjs';



@Injectable()
export class AddressService {
  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService 
  ) { }

  /**Lấy danh sách tỉnh thành từ API và lưu vào database */
  async fetchProvinces() {
    try {
      /**Gọi API để lấy danh sách tỉnh thành */
      const RESPONSE$ = this.httpService.get(
        `${process.env.PANCAKE_DOMAIN}/provinces`,
        {
          params: {
            country_code: '84',
            is_new: 'false',
            all: 'false',
            api_key: process.env.PANCAKE_API_KEY
          }
        }
      );

      /**Chuyển đổi Observable thành Promise */
      const RESPONSE = await firstValueFrom(RESPONSE$);

      /**Lấy danh sách tỉnh thành từ response */
      const PROVINCES_DATA = RESPONSE.data?.data || RESPONSE.data;

      /**Kiểm tra xem có data không */
      if (!PROVINCES_DATA || !Array.isArray(PROVINCES_DATA)) {
        throw new Error('Invalid response format from API');
      }

      /**Map data từ API sang định dạng Prisma schema */
      const MAPPED_PROVINCES = PROVINCES_DATA.map((province) => ({
        id: province.id,
        name: province.name,
        name_en: province.name_en,
        new_id: province.new_id,
        region_type: province.region_type,
        country_code: province.country_code
      }));

      /**Xóa tất cả provinces cũ trước khi insert mới */
      await this.prisma.provinces.deleteMany({});

      /**Insert danh sách tỉnh thành vào database */
      const NEW_PROVINCES = await this.prisma.provinces.createMany({
        data: MAPPED_PROVINCES,
        skipDuplicates: true, /**Bỏ qua các bản ghi trùng lặp */
      });

      return NEW_PROVINCES;
    } catch (error) {
      /**Xử lý lỗi và ném ra ngoài */
      throw new Error(`Failed to fetch provinces: ${error.message}`);
    }
  }


  //Lấy mã tỉnh thành theo id
  async getProvinceById(id: string) {
    const DATA = await this.prisma.provinces.findUnique({ where: { id } });

    if (!DATA) throw new NotFoundException(`Province with id ${id} not found`);
    //Trả về response thành công
    return DATA;
  }


  /**Lấy danh sách tỉnh thành phân trang */
  async getAllProvinces(limit: number = 10, page: number = 1) {
    try {
      /**Xử lý pagination */
      /**Giá trị mặc định là 1 */
      const PAGE_VAL = Math.max(1, page);
      /**Giá trị mặc định là 10 */
      const LIMIT_VAL = Math.max(1, limit);
      /**Bỏ qua số lượng bản ghi */
      const SKIP = (PAGE_VAL - 1) * LIMIT_VAL;

      /**Chạy song song để nhanh hơn */
      const [data, total] = await Promise.all([
        this.prisma.provinces.findMany({
          take: LIMIT_VAL,
          skip: SKIP,
          /**Sắp xếp theo id tăng dần */
          orderBy: { id: 'asc' }
        }),
        /**Lấy tổng số provinces */
        this.prisma.provinces.count()
      ]);

      /**Trả về response thành công */
      return {
        data,
        total,
        page: PAGE_VAL,
        limit: LIMIT_VAL,
        totalPages: Math.ceil(total / LIMIT_VAL)
      };
    } catch (error) {
      throw new Error(`Failed to get all provinces: ${error.message}`);
    }
  }

  /**Lấy danh sách quận huyện từ API và lưu vào database */
  async fetchDistricts() {
    try {
      /**Gọi API để lấy danh sách quận huyện */
      const RESPONSE$ = this.httpService.get(
        `${process.env.PANCAKE_DOMAIN}/districts`,
        {
          params: {
            api_key: process.env.PANCAKE_API_KEY
          }
        }
      );

      /**Chuyển đổi Observable thành Promise */
      const RESPONSE = await firstValueFrom(RESPONSE$);

      /**Lấy danh sách quận huyện từ response */
      const DISTRICTS_DATA = RESPONSE.data?.data || RESPONSE.data;

      /**Kiểm tra xem có data không */
      if (!DISTRICTS_DATA || !Array.isArray(DISTRICTS_DATA)) {
        throw new Error('Invalid response format from API');
      }

      /**Map data từ API sang định dạng Prisma schema */
      const MAPPED_DISTRICTS = DISTRICTS_DATA.map((district) => ({
        id: district.id,
        name: district.name,
        name_en: district.name_en,
        province_id: district.province_id,
      }));

      /**Xóa tất cả provinces cũ trước khi insert mới */
      await this.prisma.districts.deleteMany({});

      /**Insert danh sách tỉnh thành vào database */
      const NEW_DISTRICTS = await this.prisma.districts.createMany({
        data: MAPPED_DISTRICTS,
        skipDuplicates: true, /**Bỏ qua các bản ghi trùng lặp */
      });

      return NEW_DISTRICTS;
    } catch (error) {
      /**Xử lý lỗi và ném ra ngoài */
      throw new Error(`Failed to fetch districts: ${error.message}`);
    }
  }

  /**Lấy danh sách quận huyện phân trang */
  async getAllDistricts(limit: number = 10, page: number = 1) {
    try {
      /**Xử lý pagination */
      /**Giá trị mặc định là 1 */
      const PAGE_VAL = Math.max(1, page);
      /**Giá trị mặc định là 10 */
      const LIMIT_VAL = Math.max(1, limit);
      /**Bỏ qua số lượng bản ghi */
      const SKIP = (PAGE_VAL - 1) * LIMIT_VAL;

      /**Chạy song song để nhanh hơn */
      const [data, total] = await Promise.all([
        this.prisma.districts.findMany({
          take: LIMIT_VAL,
          skip: SKIP,
          /**Sắp xếp theo id tăng dần */
          orderBy: { id: 'asc' }
        }),
        /**Lấy tổng số provinces */
        this.prisma.districts.count()
      ]);

      /**Trả về response thành công */
      return {
        data,
        total,
        page: PAGE_VAL,
        limit: LIMIT_VAL,
        totalPages: Math.ceil(total / LIMIT_VAL)
      };
    } catch (error) {
      throw new Error(`Failed to get all districts: ${error.message}`);
    }
  }

  /**Lấy quận huyện theo id */
  async getDistrictById(id: string) {
    //tìm tỉnh thành theo id  trong db
    const DATA = await this.prisma.districts.findUnique({ where: { id } });

    if (!DATA) throw new NotFoundException(`District with id ${id} not found`);
    //Trả về response thành công
    return DATA;
  }

  /**Lấy quận huyện theo id tỉnh */
  async getDistrictsByProvinceId(province_id: string) {
    //tìm tỉnh thành theo id  trong db
    const DATA = await this.prisma.districts.findMany({ where: { province_id } });

    if(!DATA) throw new NotFoundException(`Districts with province id ${province_id} not found`);
    //Trả về response thành công
    return DATA;
  }

  /**Lấy danh sách xã phường phân trang */
  async getAllCommunes(limit: number = 10, page: number = 1) {
    try {
      /**Xử lý pagination */
      /**Giá trị mặc định là 1 */
      const PAGE_VAL = Math.max(1, page);
      /**Giá trị mặc định là 10 */
      const LIMIT_VAL = Math.max(1, limit);
      /**Bỏ qua số lượng bản ghi */
      const SKIP = (PAGE_VAL - 1) * LIMIT_VAL;

      /**Chạy song song để nhanh hơn */
      const [data, total] = await Promise.all([
        this.prisma.communes.findMany({
          take: LIMIT_VAL,
          skip: SKIP,
          /**Sắp xếp theo id tăng dần */
          orderBy: { id: 'asc' }
        }),
        /**Lấy tổng số provinces */
        this.prisma.communes.count()
      ]);

      /**Trả về response thành công */
      return {
        data,
        total,
        page: PAGE_VAL,
        limit: LIMIT_VAL,
        totalPages: Math.ceil(total / LIMIT_VAL)
      };
    } catch (error) {
      throw new Error(`Failed to get all communes: ${error.message}`);
    }
  }

  /**Lấy xã phường theo id */
  async getCommuneById(id: string) {
    const DATA = await this.prisma.communes.findUnique({ where: { id } });

    if (!DATA) throw new NotFoundException(`Commune with id ${id} not found`);
    //Trả về response thành công
    return DATA;
  }

  /**Lấy danh sách xã phường theo quận huyện và phân trang */
  async getCommunesByDistrictId(district_id: string, limit: number = 10, page: number = 1) {
    const PAGE_VAL = Math.max(1, page);
    const LIMIT_VAL = Math.max(1, limit);
    const SKIP = (PAGE_VAL - 1) * LIMIT_VAL;

    //tìm tỉnh thành theo district id  trong db
    const DATA = await this.prisma.communes.findMany({ where: { district_id }, take: LIMIT_VAL, skip: SKIP, orderBy: { id: 'asc' } });

    /**Lấy tổng số provinces */
    const TOTAL = await this.prisma.communes.count({ where: { district_id } });

    if (!DATA) throw new NotFoundException(`Commune with district id ${district_id} not found`);


    //Trả về response thành công
    return {
      data: DATA,
      total: TOTAL,
      page: PAGE_VAL,
      limit: LIMIT_VAL,
      totalPages: Math.ceil(TOTAL / LIMIT_VAL)
    };
  }

  async getCommunesByDistrictIdAndProvinceId(
    district_id: string,
    province_id: string,
    limit: number = 10,
    page: number = 1
  ) {

    /**Kiểm tra tham số */
    if (!district_id || !province_id) {
      throw new NotFoundException('district_id and province_id are required');
    }

    const PAGE_VAL = Math.max(1, page);
    const LIMIT_VAL = Math.max(1, limit);
    const SKIP = (PAGE_VAL - 1) * LIMIT_VAL;

    /**Chạy song song để lấy data và tổng số records */
    const [data, total] = await Promise.all([
      this.prisma.communes.findMany({
        where: { district_id, province_id },
        take: LIMIT_VAL,
        skip: SKIP,
        orderBy: { id: 'asc' }
      }),
      this.prisma.communes.count({
        where: { district_id, province_id }
      })
    ]);

    if (!data) throw new NotFoundException(`Commune with district id ${district_id} and province id ${province_id} not found`);

    /**Trả về response thành công */
    return {
      data,
      total, // Tổng số records thực sự
      page: PAGE_VAL,
      limit: LIMIT_VAL,
      totalPages: Math.ceil(total / LIMIT_VAL) // Dùng total, không phải data.length
    };
  }

 /**--------------------------------------------------- */

 /**Hàm này thực hiện fetch lại tất cả các thông tin của xã phường  */
  async fetchAllCommunesByDistricts() {
    try {
      /**1. Lấy tất cả provinces và districts từ DB */
      const districts = await this.prisma.districts.findMany({
        select: {
          id: true,
          province_id: true
        }
      });

      /**2. Tạo array các promises để fetch song song */
      const fetchPromises = districts.map(district =>
        this.fetchCommunesForDistrict(district.id, district.province_id)
      );

      /**3. Fetch song song với Promise.allSettled để không fail nếu 1 request lỗi */
      const results = await Promise.allSettled(fetchPromises);

      /**4. Lọc các kết quả thành công và gộp data */
      const allCommunes = results
        .filter((result) =>
          result.status === 'fulfilled'
        )
        .flatMap(result => result.value);

      /**5. Xóa và insert lại */
      await this.prisma.communes.deleteMany({});


      /**6. Insert danh sách tỉnh thành vào database */
      const NEW_COMMUNES = await this.prisma.communes.createMany({
        data: allCommunes,
        //Bỏ qua các bản ghi trùng lặp
        skipDuplicates: true,
      });

      /**7. Trả về response thành công */
      return NEW_COMMUNES;
    } catch (error) {
      /**8. Xử lý lỗi và ném ra ngoài */
      throw new Error(`Failed to fetch all communes: ${error.message}`);
    }
  }

  /**Helper function để fetch communes cho 1 district */
  private async fetchCommunesForDistrict(
    district_id: string,
    province_id: string
  ){
    try {
      /**Gọi API để lấy danh sách xã phường */
      const RESPONSE$ = this.httpService.get(
        `${process.env.PANCAKE_DOMAIN}/communes`,
        {
          params: {
            district_id,
            province_id,
            api_key: process.env.PANCAKE_API_KEY
          }
        }
      );

      /**Chuyển đổi Observable thành Promise */
      const RESPONSE = await firstValueFrom(RESPONSE$);

      /**Lấy danh sách xã phường từ response */
      const COMMUNES_DATA = RESPONSE.data?.data || RESPONSE.data;

      /**Kiểm tra xem có data không */
      if (!COMMUNES_DATA || !Array.isArray(COMMUNES_DATA)) {
        return []; // Return empty nếu không có data
      }

      /**Map data từ API sang định dạng Prisma schema */
      return COMMUNES_DATA.map((commune) => ({
        id: commune.id,
        name: commune.name,
        name_en: commune.name_en,
        new_id: commune.new_id || commune.id, // Fallback về id nếu new_id không có
        province_id: commune.province_id,
        district_id: commune.district_id
      }));
    } catch (error) {
      /**Xử lý lỗi và ném ra ngoài */
      return []; // Return empty nếu lỗi
    }
  }
}