import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ResponseHelper } from 'src/helper/response.helper';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  async create(@Body() createProductDto: CreateProductDto) {
    try {
      const NEW_PRODUCT = await this.productsService.create(createProductDto);
      ResponseHelper.Success(NEW_PRODUCT, 'Tạo sản phẩm thành công',200);
    } catch (error) {
      ResponseHelper.Error(error.message ,500);
    }
  }

  @Get()
  async findAll() {
    try {
      const ALL_PRODUCTS = await this.productsService.findAll();
      ResponseHelper.Success(ALL_PRODUCTS, 'Lấy danh sách sản phẩm thành công',200);
    } catch (error) {
      ResponseHelper.Error(error.message ,500);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const PRODUCT = await this.productsService.findOne(id);
      ResponseHelper.Success(PRODUCT, 'Lấy sản phẩm thành công',200);
    } catch (error) {
      ResponseHelper.Error(error.message ,500);
    }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    try {
      const PRODUCT = await this.productsService.update(id, updateProductDto);
      ResponseHelper.Success(PRODUCT, 'Cập nhật sản phẩm thành công',200);
    } catch (error) {
      ResponseHelper.Error(error.message ,500);
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const PRODUCT = await this.productsService.remove(id);
      ResponseHelper.Success(PRODUCT, 'Xóa sản phẩm thành công',200);
    } catch (error) {
      ResponseHelper.Error(error.message ,500);
    }
  }
}
