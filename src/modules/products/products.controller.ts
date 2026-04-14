import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ResponseHelper } from '@/helper/response.helper';
import { Roles } from '../auth/roles.decorator';
import { AuthService } from '../auth/auth.service';
import { RolesGuard } from '../auth/roles.guard';
/** Import Public decorator để đánh dấu endpoint không cần auth */
import { Public } from '../auth/public.decorator';
@UseGuards(RolesGuard)

@Controller('products')
export class ProductsController {
  /** Khởi tạo controller với service */
  constructor(
    /** Service xử lý logic sản phẩm */
    private readonly PRODUCTS_SERVICE: ProductsService
  ) {}

  /** Endpoint tạo sản phẩm mới */
  @Post()
  @Roles("admin")
  async Create(@Body() create_product_dto: CreateProductDto) {
    /** Gọi service để tạo sản phẩm */
    const NEW_PRODUCT = await this.PRODUCTS_SERVICE.Create(create_product_dto);
    /** Trả về phản hồi thành công */
    return ResponseHelper.Success(NEW_PRODUCT, 'Tạo sản phẩm thành công', 200)
  }

  /** Endpoint lấy danh sách sản phẩm với các bộ lọc */
  @Public() // Cho phép truy cập công khai không cần đăng nhập
  @Get()
  async FindAll(
    /** Trang hiện tại */
    @Query('page') page?: number,
    /** Số lượng bản ghi mỗi trang */
    @Query('limit') limit?: number,
    /** Từ khóa tìm kiếm */
    @Query('search') search?: string,
    /** Trường sắp xếp */
    @Query('sortBy') sortBy?: string,
    /** Thứ tự sắp xếp */
    @Query('sortOrder') sort_order?: 'asc' | 'desc',
    /** Giá tối thiểu */
    @Query('minPrice') min_price?: number,
    /** Giá tối đa */
    @Query('maxPrice') max_price?: number,
    /** Thương hiệu */
    @Query('brand') brand?: string,
    /** Loại sản phẩm */
    @Query('type') type?: string,
    /** Trạng thái xuất bản */
    @Query('is_published') is_published?: boolean,
    /** ID kho hàng */
    @Query('warehouse_id') warehouse_id?: string
  ) {
    /** Gọi service lấy danh sách với tham số truyền vào */
    const DATA = await this.PRODUCTS_SERVICE.FindAll({ 
      page, limit, search, sortBy, sortOrder: sort_order,
      minPrice: min_price, maxPrice: max_price, brand, type, is_published, warehouse_id
    });
    /** Trả về danh sách sản phẩm */
    return ResponseHelper.Success(DATA, 'Lấy danh sách sản phẩm thành công', 200);
  }

  /** Endpoint lấy chi tiết một sản phẩm theo ID */
  @Public() // Cho phép truy cập công khai không cần đăng nhập
  @Get(':id')
  async FindOne(@Param('id') id: string) {
    /** Gọi service để lấy thông tin chi tiết */
    const PRODUCT = await this.PRODUCTS_SERVICE.FindOne(id);
    /** Trả về sản phẩm tìm thấy */
    return ResponseHelper.Success(PRODUCT, 'Lấy sản phẩm thành công', 200);
  }

  /** Endpoint cập nhật thông tin sản phẩm */
  @Patch(':id')
  @Roles("admin")
  async Update(@Param('id') id: string, @Body() update_product_dto: UpdateProductDto) {
    /** Gọi service cập nhật dữ liệu */
    const PRODUCT = await this.PRODUCTS_SERVICE.Update(id, update_product_dto);
    /** Trả về thông tin sản phẩm sau cập nhật */
    return ResponseHelper.Success(PRODUCT, 'Cập nhật sản phẩm thành công', 200);
  }

  /** Endpoint xóa sản phẩm theo ID */
  @Delete(':id')
  @Roles("admin")
  async Remove(@Param('id') id: string) {
    /** Gọi service thực hiện xóa */
    const PRODUCT = await this.PRODUCTS_SERVICE.Remove(id);
    /** Trả về thông tin sản phẩm đã xóa */
    return ResponseHelper.Success(PRODUCT, 'Xóa sản phẩm thành công', 200);
  }
  
  /** Endpoint lấy tất cả sản phẩm của một shop */
  @Get('shop/:shop_id')
  @Public()
  async GetAllProductByShopId(@Param('shop_id') shop_id: string) {
    /** Lấy danh sách sản phẩm từ service */
    const PRODUCT = await this.PRODUCTS_SERVICE.GetAllProductByShopId(shop_id);
    /** Trả về kết quả thành công */
    return ResponseHelper.Success(PRODUCT, 'Lấy sản phẩm thành công', 200);
  }

  /** Endpoint lấy chi tiết một sản phẩm thuộc shop */
  @Get('shop/:shop_id/:id')
  @Public()
  async GetProductByShopId(
    @Param('shop_id') shop_id: string,
    @Param('id') id: string
  ) {
    /** Lấy chi tiết sản phẩm từ service với kiểm tra shop_id */
    const PRODUCT = await this.PRODUCTS_SERVICE.GetProductByShopId(shop_id, id);
    /** Trả về kết quả thành công */
    return ResponseHelper.Success(PRODUCT, 'Lấy sản phẩm thành công', 200);
  }

  /** Endpoint xóa tất cả sản phẩm của một shop */
  @Delete('shop/:shop_id')
  @Roles("admin")
  async RemoveAllByShop(@Param('shop_id') shop_id: string) {
    /** Gọi service thực hiện xóa hàng loạt */
    const DATA = await this.PRODUCTS_SERVICE.RemoveAllProductsByShopId(shop_id);
    /** Trả về thông báo thành công */
    return ResponseHelper.Success(DATA, 'Xóa tất cả sản phẩm của shop thành công', 200);
  }

  /** Endpoint xóa một sản phẩm cụ thể của shop */
  @Delete('shop/:shop_id/:id')
  @Roles("admin")
  async RemoveByShop(
    @Param('shop_id') shop_id: string,
    @Param('id') id: string
  ) {
    /** Gọi service thực hiện xóa một sản phẩm có kiểm tra shop_id */
    const PRODUCT = await this.PRODUCTS_SERVICE.RemoveProductByShopId(shop_id, id);
    /** Trả về sản phẩm đã xóa */
    return ResponseHelper.Success(PRODUCT, 'Xóa sản phẩm của shop thành công', 200);
  }
}
