import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ResponseHelper } from 'src/helper/response.helper';
import { Roles } from '../auth/roles.decorator';
import { AuthService } from '../auth/auth.service';
import { RolesGuard } from '../auth/roles.guard';
@UseGuards(RolesGuard)

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles("admin")
  async create(@Body() createProductDto: CreateProductDto) {
    const NEW_PRODUCT = await this.productsService.create(createProductDto);
    return ResponseHelper.Success(NEW_PRODUCT, 'Tạo sản phẩm thành công', 200)
  }

  /** Controller lấy danh sách sản phẩm */
  @Get()
  @Roles("admin", "user")
  async findAll(
    /** Nhận page từ query */
    @Query('page') page?: number,
    /** Nhận limit từ query */
    @Query('limit') limit?: number,
    /** Nhận search từ query */
    @Query('search') search?: string,
    /** Nhận sortBy từ query */
    @Query('sortBy') sortBy?: string,
    /** Nhận sortOrder từ query */
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    /** Nhận minPrice từ query */
    @Query('minPrice') minPrice?: number,
    /** Nhận maxPrice từ query */
    @Query('maxPrice') maxPrice?: number,
    /** Nhận brand từ query */
    @Query('brand') brand?: string,
    /** Nhận type từ query */
    @Query('type') type?: string,
    /** Nhận is_published từ query */
    @Query('is_published') is_published?: boolean,
    /** Nhận warehouse_id từ query */
    @Query('warehouse_id') warehouse_id?: string
  ) {
    const DATA = await this.productsService.findAll({ 
      page, limit, search, sortBy, sortOrder,
      minPrice, maxPrice, brand, type, is_published, warehouse_id
    });
    return ResponseHelper.Success(DATA, 'Lấy danh sách sản phẩm thành công', 200);
  }
  @Get(':id')
  @Roles("admin", "user")
  async findOne(@Param('id') id: string) {
    const PRODUCT = await this.productsService.findOne(id);
    return ResponseHelper.Success(PRODUCT, 'Lấy sản phẩm thành công',200);
  }

  @Patch(':id')
  @Roles("admin")
  async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    const PRODUCT = await this.productsService.update(id, updateProductDto);
    return ResponseHelper.Success(PRODUCT, 'Cập nhật sản phẩm thành công',200);
  }

  @Delete(':id')
  @Roles("admin")
  async remove(@Param('id') id: string) {
    const PRODUCT = await this.productsService.remove(id);
    return ResponseHelper.Success(PRODUCT, 'Xóa sản phẩm thành công',200);
  }
}
