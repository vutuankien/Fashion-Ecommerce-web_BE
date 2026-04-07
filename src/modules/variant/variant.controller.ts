import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { VariantService } from './variant.service';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { IVariantService } from './interface/variant.interface';
import { ProductVariant } from '@prisma/client';

@Controller('variants')
export class VariantController {
  constructor(private readonly variantService: VariantService) { }

  @Post('products/:productId')
  create(
    @Param('productId') productId: string,
    @Body() dto: CreateVariantDto,
  ): Promise<ProductVariant> {
    return this.variantService.create(productId, dto);
  }

  @Get()
  findAll(): Promise<ProductVariant[]> {
    return this.variantService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<ProductVariant> {
    return this.variantService.findOne(id);
  }

  @Get('products/:productId')
  findByProductId(
    @Param('productId') productId: string,
  ): Promise<ProductVariant[]> {
    return this.variantService.findByProductId(productId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateVariantDto,
  ): Promise<ProductVariant> {
    return this.variantService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<ProductVariant> {
    return this.variantService.remove(id);
  }
}