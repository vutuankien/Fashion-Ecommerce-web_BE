import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { VoucherService } from './voucher.service';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { VoucherProductService } from './voucher-product.service';
import { VoucherCategoryService } from './voucher-category.service';
import { VoucherUsageService } from './voucher-usage.service';

@Controller('voucher')
export class VoucherController {
  constructor(
    private readonly voucherService: VoucherService,
    private readonly voucherProductService: VoucherProductService,
    private readonly voucherCategoryService: VoucherCategoryService,
    private readonly voucherUsageService: VoucherUsageService,
  ) {}

  // ========================= POST =========================

  /** Tạo voucher hệ thống */
  @Post()
  async create(@Body() createVoucherDto: CreateVoucherDto) {
    /** Gọi service tạo voucher */
    return await this.voucherService.create(createVoucherDto);
  }

  /** Tạo voucher theo shop */
  @Post('/shop/:shopId')
  async createByShop(@Param('shopId') shopId: string, @Body() createVoucherDto: CreateVoucherDto) {
    /** Gọi service tạo voucher cho shop */
    return await this.voucherService.createByShop(shopId, createVoucherDto);
  }

  /** Tạo liên kết voucher - product */
  @Post('/:voucherId/product/:productId')
  async createProduct(@Param('voucherId') voucherId: string, @Param('productId') productId: string) {
    /** Gọi service tạo liên kết voucher với sản phẩm */
    return await this.voucherProductService.createVoucherProduct(voucherId, productId);
  }

  /** Tạo liên kết voucher - category */
  @Post('/:voucherId/category/:categoryId')
  async createCategory(@Param('voucherId') voucherId: string, @Param('categoryId') categoryId: string) {
    /** Gọi service tạo liên kết voucher với danh mục */
    return await this.voucherCategoryService.createVoucherCategory(voucherId, categoryId);
  }

  /** Tạo voucher usage */
  @Post('/:voucherId/usage/:userId')
  async createVoucherUsage(@Param('voucherId') voucherId: string, @Param('userId') userId: number) {
    /** Gọi service tạo voucher usage */
    return await this.voucherUsageService.createVoucherUsage(voucherId, userId);
  }

  // ========================= GET (Route tĩnh) =========================

  /** Lấy thông tin chi tiết voucher theo query id */
  @Get()
  async findOne(@Query('id') id: string) {
    /** Gọi service tìm voucher theo id */
    return await this.voucherService.findOne(id);
  }

  /** Lấy danh sách tất cả voucher, hỗ trợ phân trang qua query params */
  @Get('/all')
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    /** Chuyển đổi query string sang number */
    const params = {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    };
    return await this.voucherService.findAll(params);
  }

  /** Tìm kiếm voucher theo từ khoá qua Elasticsearch, hỗ trợ phân trang */
  @Get('/search')
  async search(
    @Query('q') q: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    /** Chuyển đổi query string sang kiểu tương ứng */
    const params = {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      /** Mặc định là true, chỉ false khi truyền 'false' */
      activeOnly: activeOnly === 'false' ? false : true,
    };
    return await this.voucherService.search(q, params);
  }

  /** Kiểm tra tính hợp lệ của voucher theo mã code */
  @Get('/check')
  async checkVoucher(@Query('code') code: string) {
    /** Gọi service kiểm tra voucher theo code */
    return await this.voucherService.checkVoucher(code);
  }

  // ========================= GET (Route có prefix cụ thể) =========================

  /** Lấy 1 voucher category theo id */
  @Get('/category/:id')
  async findOneVoucherCategory(@Param('id') id: string) {
    /** Gọi service tìm voucher category */
    return await this.voucherCategoryService.findOneVoucherCategory(id);
  }

  /** Lấy danh sách voucher theo shop, hỗ trợ phân trang */
  @Get('/shop/:shopId')
  async findAllByShop(
    @Param('shopId') shopId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    /** Chuyển đổi query string sang number */
    const params = {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    };
    return await this.voucherService.findAllByShop(shopId, params);
  }

  /** Lấy danh sách sản phẩm áp dụng voucher theo voucherId */
  @Get('/:voucherId/product')
  async getVoucherProducts(
    @Param('voucherId') voucherId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    /** Chuyển đổi query string sang number */
    const params = {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    };
    return await this.voucherProductService.getVoucherProducts(voucherId, params);
  }

  /** Lấy danh sách voucher áp dụng cho sản phẩm theo productId */
  @Get('/product/:productId/voucher')
  async getVouchersByProduct(
    @Param('productId') productId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    /** Chuyển đổi query string sang number */
    const params = {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    };
    return await this.voucherProductService.getVouchersByProduct(productId, params);
  }

  /** Lấy danh sách voucher áp dụng cho category theo categoryId */
  @Get('/category/:categoryId/voucher')
  async getVoucherCategories(
    @Param('categoryId') categoryId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    /** Chuyển đổi query string sang number */
    const params = {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    };
    return await this.voucherCategoryService.findAllVoucherCategories(categoryId, params);
  }

  /** Lấy lịch sử sử dụng voucher của user */
  @Get('/usage/:userId')
  async getUserVoucherHistory(@Param('userId') userId: number) {
    /** Gọi service lấy lịch sử sử dụng voucher của user */
    return await this.voucherUsageService.getUserVoucherHistory(userId);
  }

  /** Lấy lịch sử sử dụng voucher */
  @Get('/usage/:voucherId')
  async getVoucherUsageHistory(@Param('voucherId') voucherId: string) {
    /** Gọi service lấy lịch sử sử dụng voucher */
    return await this.voucherUsageService.getVoucherUsageHistory(voucherId);
  }

  /** Lấy số lần sử dụng voucher */
  @Get('/usage/:voucherId/stats')
  async getVoucherUsageStats(@Param('voucherId') voucherId: string) {
    /** Gọi service lấy số lần sử dụng voucher */
    return await this.voucherUsageService.getVoucherUsageStats(voucherId);
  }

  /** Lấy số lần sử dụng voucher của user */
  @Get('/usage/:voucherId/:userId')
  async getUsageByUserAndVoucher(@Param('voucherId') voucherId: string, @Param('userId') userId: number) {
    /** Gọi service lấy số lần sử dụng voucher của user */
    return await this.voucherUsageService.getUsageByUserAndVoucher(voucherId, userId);
  }

  // ========================= PATCH =========================

  /** Cập nhật voucher theo id */
  @Patch('/:id')
  async update(@Param('id') id: string, @Body() updateVoucherDto: UpdateVoucherDto) {
    /** Gọi service cập nhật voucher */
    return await this.voucherService.update(id, updateVoucherDto);
  }

  // ========================= DELETE (Route cụ thể trước) =========================

  /** Xoá liên kết voucher - product theo cặp id */
  @Delete('/:voucherId/product/:productId')
  async removeProduct(@Param('voucherId') voucherId: string, @Param('productId') productId: string) {
    /** Gọi service xoá liên kết voucher-product */
    return await this.voucherProductService.deleteVoucherProduct(voucherId, productId);
  }

  /** Xoá tất cả voucher áp dụng cho sản phẩm theo productId */
  @Delete('/product/:productId/voucher')
  async deleteVouchersByProduct(@Param('productId') productId: string) {
    /** Gọi service xoá tất cả voucher của sản phẩm */
    return await this.voucherProductService.deleteVouchersByProduct(productId);
  }

  /** Xoá tất cả product áp dụng voucher theo voucherId */
  @Delete('/:voucherId/voucher')
  async deleteVouchersByVoucher(@Param('voucherId') voucherId: string) {
    /** Gọi service xoá tất cả product của voucher */
    return await this.voucherProductService.deleteVouchersByVoucher(voucherId);
  }

  /** Xoá tất cả voucher áp dụng cho category theo categoryId */
  @Delete('/category/:categoryId/voucher')
  async deleteVouchersByCategory(@Param('categoryId') categoryId: string) {
    /** Gọi service xoá tất cả voucher của category */
    return await this.voucherCategoryService.deleteVoucherCategory(categoryId);
  }

  /** Xoá voucher theo id */
  @Delete('/:id')
  async remove(@Param('id') id: string) {
    /** Gọi service xoá voucher */
    return await this.voucherService.remove(id);
  }
}
