# Wishlist Module - Implementation Guide

## Overview

This document provides comprehensive documentation for the Wishlist module implemented in the Fashion Web BE backend using NestJS, Prisma, and Redis.

## Module Structure

```
src/modules/wishlist/
├── dto/
│   ├── create-wishlist.dto.ts      # DTO for creating wishlist entry
│   └── query-wishlist.dto.ts       # DTO for pagination query
├── interfaces/
│   └── wishlist.interface.ts       # Type definitions and interfaces
├── wishlist.cache.ts               # Redis cache layer
├── wishlist.repository.ts          # Database query layer
├── wishlist.service.ts             # Business logic layer
├── wishlist.controller.ts          # HTTP handler layer
├── wishlist.module.ts              # NestJS module registration
└── wishlist.spec.ts                # Unit tests
```

## Architecture Pattern

The module follows **clean architecture** with strict separation of concerns:

```
Controller (HTTP) 
    ↓
Service (Business Logic)
    ↓
Repository (Database) + Cache (Redis)
```

### Layer Responsibilities

1. **Controller Layer** (`wishlist.controller.ts`)
   - Handles HTTP requests/responses
   - Validates input parameters
   - Returns formatted responses
   - NO business logic

2. **Service Layer** (`wishlist.service.ts`)
   - Contains all business logic
   - Validates data before operations
   - Calls repository for DB operations
   - Manages cache invalidation
   - Handles errors and exceptions

3. **Repository Layer** (`wishlist.repository.ts`)
   - Pure Prisma database queries
   - NO business logic
   - NO cache operations
   - Returns raw database data

4. **Cache Layer** (`wishlist.cache.ts`)
   - Manages Redis operations
   - Implements cache-aside pattern
   - Handles cache misses gracefully
   - Non-blocking cache failures

## API Endpoints

All endpoints require JWT authentication.

### 1. Add Product to Wishlist
```
POST /wishlist
Content-Type: application/json

{
  "productId": "prod_123"
}

Response (201):
{
  "data": {
    "id": "wish_abc123",
    "product": {
      "id": "prod_123",
      "name": "Product Name",
      "image": "...",
      "price": 100000,
      ...
    },
    "createdAt": "2026-04-29T10:30:00Z"
  },
  "message": "Sản phẩm đã được thêm vào danh sách yêu thích",
  "statusCode": 201
}

Error (400): Product already in wishlist
Error (404): Product not found
```

### 2. Get Wishlist (with Pagination)
```
GET /wishlist?page=1&limit=10

Response (200):
{
  "data": [
    {
      "id": "wish_1",
      "product": { ... },
      "createdAt": "2026-04-29T10:30:00Z"
    },
    ...
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPage": 3
  },
  "message": "Lấy danh sách yêu thích thành công",
  "statusCode": 200
}
```

### 3. Check if Product in Wishlist
```
GET /wishlist/check/prod_123

Response (200):
{
  "data": {
    "isInWishlist": true
  },
  "message": "Kiểm tra thành công",
  "statusCode": 200
}
```

### 4. Remove Product from Wishlist
```
DELETE /wishlist/prod_123

Response (200):
{
  "data": null,
  "message": "Sản phẩm đã được xóa khỏi danh sách yêu thích",
  "statusCode": 200
}

Error (404): Product not in wishlist
```

### 5. Clear All Wishlist
```
DELETE /wishlist

Response (200):
{
  "data": null,
  "message": "Đã xóa 5 sản phẩm khỏi danh sách yêu thích",
  "statusCode": 200
}
```

## Database Schema

The Wishlist model is already defined in `prisma/schema.prisma`:

```prisma
model Wishlist {
  id        String    @id @default(cuid())
  userId    Int
  productId String
  product   products  @relation(fields: [productId], references: [id])
  user      User      @relation(fields: [userId], references: [id])
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@unique([userId, productId])  # Ensure no duplicates
}
```

### Key Features
- **Composite Unique Constraint**: `@@unique([userId, productId])` prevents duplicate entries
- **Auto-increment IDs**: Using CUID for ID generation
- **Timestamps**: `createdAt` and `updatedAt` for audit trail
- **Foreign Keys**: Relations to `User` and `products` tables

## Cache Strategy

### Cache-Aside Pattern

**For READ operations** (GET /wishlist):
1. Check Redis cache with key `FashionWeb:Wishlist:list:{userId}`
2. If cache hit → return cached data
3. If cache miss → query DB → store in Redis (TTL 300s) → return data

**For WRITE operations** (POST, DELETE, DELETE all):
1. Execute database operation
2. Invalidate cache by deleting the key
3. Next read will refresh cache from DB

### Cache Key Format
```
FashionWeb:Wishlist:list:{userId}        # For wishlist list
```

### TTL (Time To Live)
- **300 seconds** (5 minutes) for wishlist list cache
- Auto-expiration ensures data consistency without manual refresh

### Benefits
- **Performance**: Reduces DB queries for frequently accessed data
- **Scalability**: Redis handles high concurrent reads
- **Consistency**: Cache is invalidated on writes
- **Resilience**: Cache failures don't break functionality

## Error Handling

### Exception Types

| Error | HTTP Status | Cause |
|-------|------------|-------|
| `BadRequestException` | 400 | Product already in wishlist, invalid input |
| `NotFoundException` | 404 | Product doesn't exist, wishlist entry not found |
| `BadRequestException` | 400 | General operation failure |

### Error Messages

```typescript
// Product already in wishlist
"Sản phẩm này đã có trong danh sách yêu thích của bạn"

// Product doesn't exist
"Sản phẩm với ID {productId} không tồn tại"

// Wishlist entry not found
"Sản phẩm này không có trong danh sách yêu thích của bạn"
```

## Implementation Highlights

### 1. Input Validation
- **DTOs** use `class-validator` decorators
- Page/limit constraints: min 1, max 100
- Product ID required and non-empty

### 2. Pagination
- **Offset-based** pagination (page + limit)
- Maximum 100 items per page
- Returns: `total`, `page`, `limit`, `totalPage`

### 3. Product Details in Response
- Full product object included in wishlist responses
- Includes: id, name, image, price, brand, etc.
- Fetched via Prisma relation

### 4. Concurrency & Consistency
- **Unique constraint** at database level prevents duplicates
- **Prisma P2002 error** caught and converted to business exception
- **Atomic operations** ensure data integrity

### 5. Logging
- Service layer logs all operations
- Logger levels: `log` (info), `warn` (warnings), `error` (errors)
- Useful for debugging and monitoring

### 6. Code Quality
- **JSDoc comments** on all classes and methods
- **camelCase** for methods/variables, **PascalCase** for classes
- **UPPER_SNAKE_CASE** for constants
- **Try-catch blocks** for error handling

## Testing

The module includes comprehensive unit tests in `wishlist.spec.ts`:

### Test Coverage

1. **WishlistService Tests**
   - ✓ Add product successfully
   - ✓ Add duplicate product (should fail)
   - ✓ Product not found (should fail)
   - ✓ Get wishlist with pagination
   - ✓ Empty wishlist
   - ✓ Remove product successfully
   - ✓ Remove non-existent product (should fail)
   - ✓ Check if in wishlist
   - ✓ Clear all wishlist

2. **WishlistRepository Tests**
   - ✓ findByUser returns paginated items
   - ✓ count returns correct count
   - ✓ create creates new item
   - ✓ delete removes item
   - ✓ deleteAll removes all user items

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- wishlist.spec.ts

# Run with coverage
npm test -- --coverage
```

## Dependencies

### Internal
- `PrismaService` - Database ORM
- `RedisConnection` - Redis connection handler
- `ResponseHelper` - Response formatting utility

### External
- `@nestjs/common` - NestJS core
- `class-validator` - Input validation
- `@prisma/client` - Prisma client

## Integration Steps

### 1. Database Migration
```bash
# Wishlist model is already in schema
# If first time, run:
npx prisma migrate dev --name add_wishlist
```

### 2. Module Registration
✓ Already added to `src/app.module.ts`

### 3. Environment Setup
- Ensure Redis is running and configured
- DATABASE_URL environment variable set

### 4. Start Server
```bash
npm start
```

## Usage Examples

### Example 1: Add Product to Wishlist
```bash
curl -X POST http://localhost:3000/wishlist \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "productId": "prod_123"
  }'
```

### Example 2: Get Wishlist
```bash
curl -X GET "http://localhost:3000/wishlist?page=1&limit=10" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Example 3: Check if Product in Wishlist
```bash
curl -X GET http://localhost:3000/wishlist/check/prod_123 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Example 4: Remove Product
```bash
curl -X DELETE http://localhost:3000/wishlist/prod_123 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Example 5: Clear All Wishlist
```bash
curl -X DELETE http://localhost:3000/wishlist \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

## Future Enhancements

1. **Sorting Options**
   - Sort by: newest, oldest, product name, price

2. **Filtering**
   - Filter by category, price range, brand

3. **Wishlist Sharing**
   - Share wishlist with other users
   - Public/private wishlist

4. **Wishlist Collections**
   - Multiple wishlist lists (e.g., "Summer", "Winter")
   - Organize products by category

5. **Price Tracking**
   - Track product price changes
   - Notify user when price drops

6. **Export/Import**
   - Export wishlist as CSV/PDF
   - Import wishlist from external sources

## Troubleshooting

### Issue: Wishlist cache not working
- Check Redis connection in `.env`
- Verify Redis server is running
- Check logs for Redis connection errors

### Issue: Pagination returns wrong count
- Verify `page` and `limit` query parameters
- Ensure both are valid numbers
- Check total wishlist count

### Issue: Product already in wishlist error on valid product
- Check database unique constraint
- Run Prisma validation: `npx prisma validate`
- Check if user already has this product in wishlist

### Issue: Authentication failing
- Verify JWT token is valid
- Check Authorization header format
- Ensure JWT secret is configured

## Performance Considerations

1. **Redis TTL**: 300 seconds balances freshness and performance
2. **Pagination limit**: Max 100 items prevents large data transfers
3. **Batch operations**: Cache-aside pattern minimizes DB load
4. **Indexing**: Database has index on userId for fast queries

## Security Considerations

1. **JWT Authentication**: All endpoints protected
2. **Input Validation**: DTO validation prevents injection
3. **Database Constraints**: Unique constraint prevents duplicates
4. **Error Handling**: No raw errors exposed to client
5. **Logging**: All operations logged for audit trail

## Contact & Support

For issues or questions about this module:
- Check implementation: `src/modules/wishlist/`
- Review tests: `wishlist.spec.ts`
- Check database schema: `prisma/schema.prisma`

---

**Last Updated**: April 29, 2026
**Module Version**: 1.0.0
**Status**: Production Ready
