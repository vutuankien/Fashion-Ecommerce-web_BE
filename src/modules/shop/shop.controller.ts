import { Controller, Get, Post, Body, Patch, Param, Delete, UploadedFile, UseInterceptors, Query, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ShopService } from './shop.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { ResponseHelper } from 'src/helper/response.helper';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Public } from '../auth/public.decorator';
@UseGuards(RolesGuard)
/** Controller quản lý cửa hàng */
@Controller('shop')
export class ShopController {
  /** Khởi tạo controller */
  constructor(private readonly SHOP_SERVICE: ShopService) {}

  /** Tạo cửa hàng mới */
  @Post()
  @Roles('admin', 'shop')
  @UseInterceptors(FileInterceptor('avatar'))
  async Create(
    @Body() create_shop_dto: CreateShopDto,
    @UploadedFile() avatar?: Express.Multer.File,
  ) {
   try {
    const DATA= await this.SHOP_SERVICE.Create(create_shop_dto, avatar);
    return ResponseHelper.Success(DATA,"Create shop successfully",201);
  } catch (error) {
   return ResponseHelper.Error(error, 500);
  }
  }

  /** Lấy danh sách cửa hàng */
  @Get()
  @Roles('admin', 'shop')
  async FindAll(@Query('limit') limit ?: string, @Query('page') page?: string) {
    /** Gọi service lấy danh sách cửa hàng */
    try {
      const lim = limit ? Number(limit) : undefined;
      const pg = page ? Number(page) : undefined;
      const DATA = await this.SHOP_SERVICE.FindAll(lim, pg);
      return ResponseHelper.Success(DATA, "Get shops successfully", 200);
    } catch (error) {
      return ResponseHelper.Error(error, 500);
    }
  }

  /** Lấy thông tin cửa hàng theo product_id - PHẢI ĐẶT TRƯỚC route :id */
  @Get('product/:product_id')
  @Public()
  async findShopByProductId(@Param('product_id') product_id: string) {
    /** Gọi service tìm cửa hàng theo product_id */
    const DATA = await this.SHOP_SERVICE.getShopByProductId(product_id);

    return ResponseHelper.Success(DATA, "Get shop successfully", 200);
  }

  /** Lấy thông tin cửa hàng theo slug */
  @Get('slug/:slug')
  @Public()
  async findShopBySlug(@Param('slug') slug: string) {
    /** Gọi service tìm cửa hàng theo slug */
    const DATA = await this.SHOP_SERVICE.getShopBySlug(slug);
    return ResponseHelper.Success(DATA, "Get shop successfully", 200);
  }

  /** Lấy thông tin chi tiết một cửa hàng */
  @Get(':id')
  async FindOne(@Param('id') id: string) {
    /** Gọi service tìm cửa hàng theo id */
    const DATA = await this.SHOP_SERVICE.FindOne(id);
    return ResponseHelper.Success(DATA, "Get shop successfully", 200);
  }

  /** Cập nhật thông tin cửa hàng */
  @Patch(':id')
  async Update(@Param('id') id: string, @Body() update_shop_dto: UpdateShopDto) {
    /** Gọi service cập nhật cửa hàng */
    const DATA = await this.SHOP_SERVICE.Update(id, update_shop_dto);
    return ResponseHelper.Success(DATA, "Update shop successfully", 200);
  }

  /** Xóa cửa hàng */
  @Delete(':id')
  async Remove(@Param('id') id: string) {
    /** Gọi service xóa cửa hàng */
    const DATA = await this.SHOP_SERVICE.Remove(id);
    return ResponseHelper.Success(DATA, "Delete shop successfully", 200);
  }


  /** Check heartbeat của cửa hàng */
  @Patch('check-heartbeat/:id')
  @Public()
  async checkHeartbeat(@Param('id') id: string) {
    const DATA = await this.SHOP_SERVICE.touchOnline(id);
    return ResponseHelper.Success(DATA, "Check heartbeat successfully", 200);
  }

  /** Lấy trạng thái của cửa hàng */
  @Get('status/:id')
  @Public()
  async getStatus(@Param('id') id: string) {
    const DATA = await this.SHOP_SERVICE.getStatus(id);
    return ResponseHelper.Success(DATA, "Get status successfully", 200);
  }
}
