import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { CloudinaryService } from '@/cloudinary/cloudinary.service';
import sharp from 'sharp';
/** Import ShopCache */
import { ShopCache } from './shop.cache';
import { RedisConnection } from '@/config/redis.config';


const ONLINE_TTL = 90;//seconds

/** Service quản lý cửa hàng */
@Injectable()
export class ShopService {
  /** Khởi tạo service */
  constructor(
    private readonly PRISMA_SERVICE: PrismaService,
    private readonly CLOUDINARY_SERVICE: CloudinaryService,
    /** Inject RedisConnection */
    private readonly REDIS_CONN: RedisConnection,
    /** Inject ShopCache */
    private readonly SHOP_CACHE: ShopCache
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

      /** Kiểm tra userId */
      if (!create_shop_dto.userId) throw new BadRequestException('User ID is required');
      /** Tạo slug */
      create_shop_dto.slug = create_shop_dto.name.toLowerCase().replace(/\s+/g, '-');

      /** Tạo cửa hàng mới trong database */
      const SHOP = await this.PRISMA_SERVICE.shop.create({
        data: {
          ...create_shop_dto,
          avatar_url: avatar_url || create_shop_dto.avatar_url || '',
          userId: create_shop_dto.userId,
          slug: create_shop_dto.slug,
        },
      });
      
      /** Invalidate cache sau khi tạo mới */
      await this.SHOP_CACHE.invalidateAll();
      
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

      /** Kiểm tra cache trước */
      const cached_shops = await this.SHOP_CACHE.getPage(CURRENT_PAGE, MAX_LIMIT);
      
      let SHOP;
      /** Nếu có cache thì sử dụng */
      if (cached_shops) {
        SHOP = cached_shops;
      } else {
        /** Fetch paginated data từ DB */
        SHOP = await this.PRISMA_SERVICE.shop.findMany({
          take: MAX_LIMIT,
          skip: OFFSET,
        });
        
        /** Lưu vào cache */
        await this.SHOP_CACHE.setPage(CURRENT_PAGE, MAX_LIMIT, SHOP);
      }


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
    /** Lấy từ cache hoặc DB */
    const EXIST_SHOP = await this.SHOP_CACHE.get(id);

    if(!EXIST_SHOP) throw new NotFoundException("No Shop Found")

    const SHOP = await this.PRISMA_SERVICE.shop.findUnique({
      where: {
        id,
      },
    });
    /** Tìm cửa hàng theo id */
    return SHOP
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
    const DATA = await this.PRISMA_SERVICE.shop.update({
      where: {
        id,
      },
      data: update_shop_dto,
    });
    
    /** Xóa cache của shop này và invalidate all */
    await this.SHOP_CACHE.delete(id);
    await this.SHOP_CACHE.invalidateAll();
    
    return DATA;
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

    /** Xóa cache của shop này và invalidate all */
    await this.SHOP_CACHE.delete(id);
    await this.SHOP_CACHE.invalidateAll();

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

  /** Lấy thông tin cửa hàng theo id sản phẩm */
  async getShopByProductId(id: string) {
    console.log('[getShopByProductId] Received product_id:', id);
    
    /** Tìm sản phẩm theo id */
    const product = await this.PRISMA_SERVICE.products.findUnique({
      where: { id },
      select: { shop_id: true },
    });

    if (!product) {
      throw new NotFoundException("No Product Found");
    }


    /** Tìm cửa hàng theo id */
    const shop = await this.PRISMA_SERVICE.shop.findUnique({
      where: { id: product.shop_id },
    });

    /** Nếu không tìm thấy cửa hàng thì ném lỗi NotFound */
    if (!shop) {
      throw new NotFoundException("No Shop Found");
    }

    /** Trả về thông tin cửa hàng */
    return shop
  }

  /** Lấy thông tin cửa hàng theo slug */
  async getShopBySlug(slug: string) {
    console.log('[getShopBySlug] Received slug:', slug);
    
    /** Tìm cửa hàng theo slug */
    const shop = await this.PRISMA_SERVICE.shop.findUnique({
      where: { slug: slug },
    });

    /** Nếu không tìm thấy cửa hàng thì ném lỗi NotFound */
    if (!shop) {
      throw new NotFoundException("No Shop Found");
    }

    /** Trả về thông tin cửa hàng */
    return shop
  }


  /** Check heartbeat của cửa hàng */
  async touchOnline(id: string) {
    try {
      /** Lấy Redis client từ connection */
      const { REDIS_CLIENT } = await this.REDIS_CONN.exec({});
      
      /** Get timestamp hiện tại */
      const now = Date.now();

      /** Cập nhật last_seen_at của cửa hàng trong Redis */
      await REDIS_CLIENT.multi()
        .set(`shop:online:${id}`, '1', 'EX', ONLINE_TTL)
        .set(`shop:last_seen:${id}`, now.toString())
        .exec();

      return { success: true };
    } catch (error) {
      /** Log lỗi nếu heartbeat thất bại */
      console.error('[checkHeartbeat] Error:', error);
      throw new BadRequestException('Failed to update heartbeat');
    }
  }

  /** Lấy trạng thái online của cửa hàng */
  async getStatus(shop_id: string) {
    try {
      /** Lấy Redis client từ connection */
      const { REDIS_CLIENT } = await this.REDIS_CONN.exec({});
      
      /** Lấy thông tin online và last_seen từ Redis */
      const [is_online, last_seen] = await Promise.all([
        REDIS_CLIENT.exists(`shop:online:${shop_id}`),
        REDIS_CLIENT.get(`shop:last_seen:${shop_id}`),
      ]);

      /** Trả về trạng thái */
      return {
        isOnline: Boolean(is_online),
        lastSeenAt: last_seen ? Number(last_seen) : null,
      };
    } catch (error) {
      /** Log lỗi nếu get status thất bại */
      console.error('[getStatus] Error:', error);
      /** Trả về trạng thái offline nếu có lỗi */
      return {
        isOnline: false,
        lastSeenAt: null,
      };
    }
  }
}
