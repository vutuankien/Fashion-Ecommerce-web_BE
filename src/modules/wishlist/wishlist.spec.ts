/** Import testing utilities từ NestJS */
import { Test, TestingModule } from '@nestjs/testing';
/** Import BadRequestException và NotFoundException */
import { BadRequestException, NotFoundException } from '@nestjs/common';
/** Import service */
import { WishlistService } from './wishlist.service';
/** Import repository */
import { WishlistRepository } from './wishlist.repository';
/** Import cache */
import { WishlistCache } from './wishlist.cache';
/** Import PrismaService */
import { PrismaService } from '@/prisma/prisma.service';
import { beforeEach, describe } from 'node:test';

/**
 * Unit Tests cho WishlistService
 * 
 * Bao gồm tests cho tất cả business logic scenarios:
 * - Add to wishlist (success, duplicate, product not found)
 * - Get wishlist (pagination)
 * - Remove from wishlist (success, not found)
 * - Check in wishlist
 * - Clear wishlist
 */
describe('WishlistService', () => {
  let service: WishlistService;
  let repository: WishlistRepository;
  let cache: WishlistCache;
  let prisma: PrismaService;

  /**
   * Setup trước mỗi test
   * Mock tất cả dependencies
   */
  beforeEach(async () => {
    /** Mock Prisma service */
    const mockPrismaService = {
      products: {
        findUnique: jest.fn(),
      },
      wishlist: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn(),
      },
    };

    /** Mock Repository */
    const mockRepository = {
      findByUser: jest.fn(),
      count: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteAll: jest.fn(),
    };

    /** Mock Cache */
    const mockCache = {
      getWishlist: jest.fn(),
      setWishlist: jest.fn(),
      invalidateWishlist: jest.fn(),
      checkInWishlist: jest.fn(),
    };

    /** Create testing module */
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WishlistService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: WishlistRepository, useValue: mockRepository },
        { provide: WishlistCache, useValue: mockCache },
      ],
    }).compile();

    service = module.get<WishlistService>(WishlistService);
    repository = module.get<WishlistRepository>(WishlistRepository);
    cache = module.get<WishlistCache>(WishlistCache);
    prisma = module.get<PrismaService>(PrismaService);
  });

  /**
   * Tests cho addToWishlist
   */
  describe('addToWishlist', () => {
    const userId = 123;
    const productId = 'prod_456';
    const mockProduct = { id: productId, name: 'Test Product' };
    const mockWishlistItem = {
      id: 'wish_123',
      userId,
      productId,
      product: mockProduct,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    /**
     * Test case: Thêm sản phẩm thành công
     */
    it('should add product to wishlist successfully', async () => {
      /** Setup mocks */
      jest.spyOn(prisma.products, 'findUnique').mockResolvedValue(mockProduct as any);
      jest.spyOn(repository, 'create').mockResolvedValue(mockWishlistItem as any);
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockWishlistItem as any);
      jest.spyOn(cache, 'invalidateWishlist').mockResolvedValue(undefined);

      /** Execute */
      const result = await service.addToWishlist(userId, productId);

      /** Verify */
      
      expect(result.message).toContain('thêm vào');
      expect(result.data.product).toEqual(mockProduct);
      expect(cache.invalidateWishlist).toHaveBeenCalledWith(userId);
    });

    /**
     * Test case: Sản phẩm không tồn tại
     */
    it('should throw NotFoundException when product does not exist', async () => {
      jest.spyOn(prisma.products, 'findUnique').mockResolvedValue(null);

      await expect(service.addToWishlist(userId, productId)).rejects.toThrow(
        NotFoundException
      );
    });

    /**
     * Test case: Sản phẩm đã có trong wishlist (duplicate)
     */
    it('should throw BadRequestException when product already in wishlist', async () => {
      jest.spyOn(prisma.products, 'findUnique').mockResolvedValue(mockProduct as any);
      const error = new Error() as any;
      error.code = 'P2002';
      jest.spyOn(repository, 'create').mockRejectedValue(error);

      await expect(service.addToWishlist(userId, productId)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  /**
   * Tests cho getWishlist
   */
  describe('getWishlist', () => {
    const userId = 123;
    const mockWishlistItems = [
      {
        id: 'wish_1',
        userId,
        productId: 'prod_1',
        product: { id: 'prod_1', name: 'Product 1' },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'wish_2',
        userId,
        productId: 'prod_2',
        product: { id: 'prod_2', name: 'Product 2' },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    /**
     * Test case: Lấy danh sách wishlist thành công
     */
    it('should get wishlist with pagination', async () => {
      jest.spyOn(cache, 'getWishlist').mockResolvedValue(mockWishlistItems as any);

      const result = await service.getWishlist(userId, 1, 10);

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.totalPage).toBe(1);
    });

    /**
     * Test case: Danh sách trống
     */
    it('should return empty list when user has no wishlist', async () => {
      jest.spyOn(cache, 'getWishlist').mockResolvedValue([]);

      const result = await service.getWishlist(userId, 1, 10);

      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPage).toBe(1);
    });

    /**
     * Test case: Pagination hoạt động đúng
     */
    it('should apply pagination correctly', async () => {
      const items = Array.from({ length: 25 }, (_, i) => ({
        ...mockWishlistItems[0],
        id: `wish_${i}`,
        productId: `prod_${i}`,
      }));

      jest.spyOn(cache, 'getWishlist').mockResolvedValue(items as any);

      const result = await service.getWishlist(userId, 2, 10);

      expect(result.data).toHaveLength(10);
      expect(result.pagination.total).toBe(25);
      expect(result.pagination.totalPage).toBe(3);
      expect(result.pagination.page).toBe(2);
    });
  });

  /**
   * Tests cho removeFromWishlist
   */
  describe('removeFromWishlist', () => {
    const userId = 123;
    const productId = 'prod_456';
    const mockWishlistItem = {
      id: 'wish_123',
      userId,
      productId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    /**
     * Test case: Xóa thành công
     */
    it('should remove product from wishlist successfully', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockWishlistItem as any);
      jest.spyOn(repository, 'delete').mockResolvedValue(1);
      jest.spyOn(cache, 'invalidateWishlist').mockResolvedValue(undefined);

      const result = await service.removeFromWishlist(userId, productId);

      
      expect(result.message).toContain('xóa');
      expect(cache.invalidateWishlist).toHaveBeenCalledWith(userId);
    });

    /**
     * Test case: Sản phẩm không có trong wishlist
     */
    it('should throw NotFoundException when product not in wishlist', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.removeFromWishlist(userId, productId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  /**
   * Tests cho checkInWishlist
   */
  describe('checkInWishlist', () => {
    const userId = 123;
    const productId = 'prod_456';

    /**
     * Test case: Sản phẩm có trong wishlist
     */
    it('should return true when product is in wishlist', async () => {
      jest.spyOn(cache, 'checkInWishlist').mockResolvedValue(true);

      const result = await service.checkInWishlist(userId, productId);

      expect(result.data).toBe(true);
    });

    /**
     * Test case: Sản phẩm không có trong wishlist
     */
    it('should return false when product is not in wishlist', async () => {
      jest.spyOn(cache, 'checkInWishlist').mockResolvedValue(false);

      const result = await service.checkInWishlist(userId, productId);

      expect(result.data).toBe(false);
    });
  });

  /**
   * Tests cho clearWishlist
   */
  describe('clearWishlist', () => {
    const userId = 123;

    /**
     * Test case: Xóa toàn bộ thành công
     */
    it('should clear all wishlist items successfully', async () => {
      jest.spyOn(repository, 'deleteAll').mockResolvedValue(5);
      jest.spyOn(cache, 'invalidateWishlist').mockResolvedValue(undefined);

      const result = await service.clearWishlist(userId);

      
      expect(result.message).toContain('5');
      expect(cache.invalidateWishlist).toHaveBeenCalledWith(userId);
    });

    /**
     * Test case: Xóa khi danh sách rỗng
     */
    it('should handle clearing empty wishlist', async () => {
      jest.spyOn(repository, 'deleteAll').mockResolvedValue(0);
      jest.spyOn(cache, 'invalidateWishlist').mockResolvedValue(undefined);

      const result = await service.clearWishlist(userId);

      
      expect(result.message).toContain('0');
    });
  });
});

/**
 * Unit Tests cho WishlistRepository
 */
describe('WishlistRepository', () => {
  let repository: WishlistRepository;
  let prisma: PrismaService;

  beforeEach(async () => {
    const mockPrismaService = {
      wishlist: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WishlistRepository,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    repository = module.get<WishlistRepository>(WishlistRepository);
    prisma = module.get<PrismaService>(PrismaService);
  });

  /**
   * Test findByUser
   */
  describe('findByUser', () => {
    it('should return wishlist items for user', async () => {
      const userId = 123;
      const mockItems = [{ id: 'wish_1', userId }];

      jest.spyOn(prisma.wishlist, 'findMany').mockResolvedValue(mockItems as any);

      const result = await repository.findByUser(userId, 10, 0);

      expect(result).toEqual(mockItems);
      expect(prisma.wishlist.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: { product: true },
        take: 10,
        skip: 0,
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  /**
   * Test count
   */
  describe('count', () => {
    it('should return count of wishlist items', async () => {
      const userId = 123;

      jest.spyOn(prisma.wishlist, 'count').mockResolvedValue(5);

      const result = await repository.count(userId);

      expect(result).toBe(5);
    });
  });

  /**
   * Test create
   */
  describe('create', () => {
    it('should create wishlist item', async () => {
      const data = { userId: 123, productId: 'prod_456' };
      const mockWishlist = { id: 'wish_123', ...data, createdAt: new Date() };

      jest.spyOn(prisma.wishlist, 'create').mockResolvedValue(mockWishlist as any);

      const result = await repository.create(data);

      expect(result).toEqual(mockWishlist);
    });
  });

  /**
   * Test delete
   */
  describe('delete', () => {
    it('should delete wishlist item', async () => {
      jest.spyOn(prisma.wishlist, 'deleteMany').mockResolvedValue({ count: 1 });

      const result = await repository.delete(123, 'prod_456');

      expect(result).toBe(1);
    });
  });

  /**
   * Test deleteAll
   */
  describe('deleteAll', () => {
    it('should delete all wishlist items for user', async () => {
      jest.spyOn(prisma.wishlist, 'deleteMany').mockResolvedValue({ count: 5 });

      const result = await repository.deleteAll(123);

      expect(result).toBe(5);
    });
  });
});
