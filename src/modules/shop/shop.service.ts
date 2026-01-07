import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import sharp from 'sharp';

/** Service quản lý cửa hàng */
@Injectable()
export class ShopService {
  /** Khởi tạo service */
  constructor(
    private readonly PRISMA_SERVICE: PrismaService,
    private readonly CLOUDINARY_SERVICE: CloudinaryService,
  ) {}

  /** Tạo cửa hàng mới */
  async Create(create_shop_dto: CreateShopDto, avatar?: Express.Multer.File) {
    /** Tìm cửa hàng đã tồn tại theo tên */
    const EXISTING_SHOP = await this.PRISMA_SERVICE.shop.findFirst({
      where: {
        name: create_shop_dto.name,
      },
    });

    /** Nếu cửa hàng đã tồn tại thì ném lỗi */
    if (EXISTING_SHOP) throw new BadRequestException('Shop already exists');

    try {
      let avatar_url = create_shop_dto.avatar_url;

      /** Nếu có file avatar thì upload lên Cloudinary */
      if (avatar) {
        /** Validate file trước khi xử lý */
        await this.CLOUDINARY_SERVICE.validateFile(avatar);

        /** Resize và optimize ảnh sử dụng sharp */
        const OPTIMIZED_BUFFER = await sharp(avatar.buffer)
          .resize(400, 400, {
            fit: 'cover',
            position: 'center',
          })
          .jpeg({ quality: 85 })
          .toBuffer();

        /** Tạo object file mới với buffer đã được tối ưu */
        const OPTIMIZED_FILE: Express.Multer.File = {
          ...avatar,
          buffer: OPTIMIZED_BUFFER,
          size: OPTIMIZED_BUFFER.length,
        };

        /** Upload file lên Cloudinary */
        const UPLOAD_RESULT = await this.CLOUDINARY_SERVICE.uploadFile(OPTIMIZED_FILE, {
          folder: 'shop-avatars',
        });

        avatar_url = UPLOAD_RESULT.secure_url;
      }

      /** Tạo cửa hàng mới trong database */
      const SHOP = await this.PRISMA_SERVICE.shop.create({
        data: {
          ...create_shop_dto,
          avatar_url: avatar_url || create_shop_dto.avatar_url || '',
        },
      });
      /** Trả về thông tin cửa hàng */
      return SHOP;
    } catch (error) {
      /** Ném lỗi nếu có */
      throw new BadRequestException(
        error.message || 'Failed to create shop',
      );
    }
  }

  /** Lấy danh sách cửa hàng với phân trang */
  async FindAll(limit: number = 10, page: number = 1) {
    // Normalize and validate limit (1..100)
    const MAX_LIMIT = Math.max(1, Math.min(limit ?? 10, 100));

    try {
      // Count total items first so we can clamp the requested page
      const TOTAL = await this.PRISMA_SERVICE.shop.count();
      const TOTAL_PAGE = Math.max(1, Math.ceil(TOTAL / MAX_LIMIT));

      // Clamp page into [1, TOTAL_PAGE]
      const CURRENT_PAGE = Math.min(Math.max(page ?? 1, 1), TOTAL_PAGE);
      const OFFSET = (CURRENT_PAGE - 1) * MAX_LIMIT;

      // Fetch paginated data
      const SHOP = await this.PRISMA_SERVICE.shop.findMany({
        take: MAX_LIMIT,
        skip: OFFSET,
      });

      console.info('[ShopService.FindAll] limit=', MAX_LIMIT, 'requestedPage=', page, 'currentPage=', CURRENT_PAGE, 'offset=', OFFSET, 'resultCount=', Array.isArray(SHOP) ? SHOP.length : 0, 'total=', TOTAL, 'totalPage=', TOTAL_PAGE);

      // Return paginated response with clamped page
      return {
        data: SHOP,
        total: TOTAL,
        limit: MAX_LIMIT,
        page: CURRENT_PAGE,
        totalPage: TOTAL_PAGE,
      };
    } catch (error) {
      throw error;
    }
  }

  /** Lấy thông tin chi tiết một cửa hàng */
  async FindOne(id: string) {
    const EXIST_SHOP = await this.PRISMA_SERVICE.shop.findUnique({
      where:{
        id,
      }
    })

    if(!EXIST_SHOP) throw new NotFoundException("No Shop Found")
    /** Tìm cửa hàng theo id */
    return EXIST_SHOP
  }

  /** Cập nhật thông tin cửa hàng */
  async Update(id: string, update_shop_dto: UpdateShopDto) {
    const EXIST_SHOP = await this.PRISMA_SERVICE.shop.findUnique({
      where:{
        id,
      }
    })

    if(!EXIST_SHOP) throw new NotFoundException("No Shop Found")
    /** Cập nhật cửa hàng trong database */
    return this.PRISMA_SERVICE.shop.update({
      where: {
        id,
      },
      data: update_shop_dto,
    });
  }

  /** Xóa cửa hàng */
  async Remove(id: string) {
    const EXIST_SHOP = await this.PRISMA_SERVICE.shop.findUnique({
      where:{
        id,
      }
    })

    if(!EXIST_SHOP) throw new NotFoundException("No Shop Found")
    /** Xóa cửa hàng khỏi database */
    const DATA = await this.PRISMA_SERVICE.shop.delete({
      where: {
        id,
      },
    });

    return DATA;
  }

  /** Upload và tối ưu hóa avatar cho cửa hàng */
  async UploadAvatarOptimized(id: string, avatar: Express.Multer.File) {
    /** Tìm thông tin cửa hàng cần upload avatar */
    const SHOP = await this.PRISMA_SERVICE.shop.findUnique({
      where: { id },
      select: { id: true, avatar_url: true },
    });

    /** Nếu không tìm thấy cửa hàng thì ném lỗi NotFound */
    if (!SHOP) throw new NotFoundException(`Shop with ID ${id} not found`);

    /** Validate file trước khi xử lý */
    await this.CLOUDINARY_SERVICE.validateFile(avatar);

    try {
      /** Resize và optimize ảnh sử dụng sharp */
      const OPTIMIZED_BUFFER = await sharp(avatar.buffer)
        .resize(400, 400, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 85 })
        .toBuffer();

      /** Tạo object file mới với buffer đã được tối ưu */
      const OPTIMIZED_FILE: Express.Multer.File = {
        ...avatar,
        buffer: OPTIMIZED_BUFFER,
        size: OPTIMIZED_BUFFER.length,
      };

      /** Upload file lên Cloudinary */
      const RESULT = await this.CLOUDINARY_SERVICE.uploadFile(OPTIMIZED_FILE, {
        folder: 'shop-avatars',
      });

      /** Update database sử dụng transaction */
      const UPDATED_SHOP = await this.PRISMA_SERVICE.$transaction(async (tx) => {
        return tx.shop.update({
          where: { id },
          data: {
            avatar_url: RESULT.secure_url,
            updatedAt: new Date(),
          },
        });
      });

      /** Xóa avatar cũ nếu tồn tại */
      if (SHOP.avatar_url) {
        /** Gọi hàm xóa avatar cũ và log lỗi nếu thất bại */
        this.DeleteOldAvatar(SHOP.avatar_url).catch((err) =>
          console.error('Failed to delete old avatar:', err),
        );
      }

      /** Trả về thông tin cửa hàng sau khi cập nhật */
      return {
        id: UPDATED_SHOP.id,
        avatar_url: UPDATED_SHOP.avatar_url,
        updated_at: UPDATED_SHOP.updatedAt,
      };
    } catch (error) {
      /** Log lỗi upload thất bại */
      console.error('Avatar upload failed:', error);
      /** Ném lỗi BadRequest */
      throw new BadRequestException(
        error.message || 'Failed to upload avatar',
      );
    }
  }

  /** Helper method: Xóa avatar cũ từ Cloudinary */
  private async DeleteOldAvatar(avatar_url: string) {
    try {
      /** Tách public_id từ URL của Cloudinary */
      const MATCH = avatar_url.match(/\/v\d+\/(.+?)\.[a-zA-Z]+$/);
      /** Nếu tìm thấy pattern hợp lệ */
      if (MATCH && MATCH[1]) {
        /** Lấy public_id */
        const PUBLIC_ID = MATCH[1];
        /** Gọi service xóa file trên Cloudinary */
        await this.CLOUDINARY_SERVICE.deleteMultipleFiles([PUBLIC_ID]);
      }
    } catch (error) {
      /** Log lỗi nếu xóa thất bại */
      console.error('Error deleting old avatar:', error);
    }
  }

  
}
