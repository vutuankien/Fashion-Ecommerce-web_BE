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
