/** Import SetMetadata từ NestJS */
import { SetMetadata } from '@nestjs/common';

/** Key để đánh dấu endpoint là public */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator đánh dấu endpoint không cần authentication
 * Sử dụng: @Public() trước @Get(), @Post(), etc.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
