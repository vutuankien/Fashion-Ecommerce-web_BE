/** Import Module decorator từ NestJS */
import { Module } from '@nestjs/common';
/** Import controller */
import { WishlistController } from './wishlist.controller';
/** Import service */
import { WishlistService } from './wishlist.service';
/** Import repository */
import { WishlistRepository } from './wishlist.repository';
/** Import cache */
import { WishlistCache } from './wishlist.cache';
/** Import Prisma service */
import { PrismaService } from '@/prisma/prisma.service';
/** Import AuthModule cho RolesGuard và TokenService */
import { AuthModule } from '../auth/auth.module';

/**
 * Module cho Wishlist
 * 
 * Đăng ký:
 * - Controller: Xử lý HTTP requests/responses
 * - Service: Xử lý business logic
 * - Repository: Xử lý database queries
 * - Cache: Xử lý Redis caching
 * - PrismaService: Dependency cho repository
 * 
 * Các providers sẽ được dependency inject vào các lớp khác
 */
@Module({
  /** Import AuthModule để sử dụng RolesGuard và TokenService */
  imports: [AuthModule],
  /** Controllers xử lý HTTP requests */
  controllers: [WishlistController],

  
  /** Providers là các service/repository được register */
  providers: [
    /** Service chứa business logic */
    WishlistService,
    /** Repository chứa database queries */
    WishlistRepository,
    /** Cache chứa Redis operations */
    WishlistCache,
    /** PrismaService cho database access */
    PrismaService
  ],
  
  /** Exports - các provider có thể được import ở module khác */
  exports: [WishlistService]
})
export class WishlistModule {}
