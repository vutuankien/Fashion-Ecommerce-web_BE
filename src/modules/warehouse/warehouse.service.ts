import { Injectable } from '@nestjs/common';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { WarehouseRepository } from './warehouse.repository';

@Injectable()
export class WarehouseService {
  /**Khởi tạo hàm sử dụng warehouse repository */
  constructor (private readonly warehouseRepository: WarehouseRepository) {}
  create(createWarehouseDto: CreateWarehouseDto) {
    try {

      /**sử dụng warehouse repository để tạo kho mới */
      const DATA = this.warehouseRepository.create(createWarehouseDto);

      /**Nếu ko có dữ liệu trả về thì ném lỗi */
      if (!DATA) {
        throw new Error('Cannot create warehouse');
      }


      /**Trả về dữ liệu */
      return DATA;
    } catch (error) {
      /**Nếu có lỗi thì ném lỗi */
      throw error;
    }
  }


  async findAll(limit :number = 10, page : number = 1) {
    /**Xử lý phân trang */

    /**Lấy giá trị trang và giới hạn */
    const PAGE_VAL = Math.max(page, 1);
    const LIMIT_VAL = Math.max(limit, 1);

    /**Tính toán số bản ghi cần bỏ qua */
    const SKIP = (PAGE_VAL - 1) * LIMIT_VAL;

    /**Sử dụng Promise.all để thực hiện đồng thời hai truy vấn */
    const [DATA,TOTAL] = await Promise.all ([
      this.warehouseRepository.findMany(LIMIT_VAL, SKIP),
      this.warehouseRepository.count()
    ])


    /**Trả về dữ liệu phân trang */
    return {
      data: DATA,
      total: TOTAL,
      page: PAGE_VAL,
      limit: LIMIT_VAL,
      /**Tổng số trang */
      totalPages: Math.ceil(TOTAL / LIMIT_VAL)
    }
  }

  /**Hàm tìm kiếm warehouse theo id */
  findOne(id: string) {
    /**Sử dụng warehouse repository để tìm kiếm warehouse theo id */
    const DATA = this.warehouseRepository.findOne(id);
    /**Nếu ko có dữ liệu trả về thì ném lỗi */
    if (!DATA) {
      throw new Error('Cannot find warehouse');
    }
    /**Trả về dữ liệu */
    return DATA;
  }


  /**hàm update thông tin warehouse */
  update(id: string, updateWarehouseDto: CreateWarehouseDto) {

    /**Sử dụng warehouse repository để cập nhật thông tin warehouse */
    const DATA = this.warehouseRepository.update(id, updateWarehouseDto);

    /**Nếu ko có dữ liệu trả về thì ném lỗi */
    if (!DATA) {
      throw new Error('Cannot update warehouse');
    }

    /**Trả về dữ liệu */
    return DATA;
  }

  /**Hàm xóa warehouse */
  remove(id: string) {
    const DATA = this.warehouseRepository.remove({id});

    /**Nếu ko có dữ liệu trả về thì ném lỗi */
    if (!DATA) {
      throw new Error('Cannot delete warehouse');
    }
    /**Trả về dữ liệu */
    return DATA;
  }
}
