/** Import SetMetadata từ NestJS để tạo custom decorator */
import { SetMetadata } from '@nestjs/common';

/** Định nghĩa key metadata cho roles */
export const ROLES_KEY = 'roles';

/**
 * Decorator để xác định các role được phép truy cập
 * @param roles - Danh sách các role được phép (vd: 'admin', 'user')
 * @example @Roles('admin')
 * @example @Roles('admin', 'user')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
