/** import các thư viện từ nestjs */
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateEmployerDto } from './dto/create-employer.dto';
import { UpdateEmployerDto } from './dto/update-employer.dto';
/** import prisma service */
import { PrismaService } from '../../prisma/prisma.service';
/** import thư viện bcrypt */
import * as bcrypt from 'bcrypt';
/** import cloudinary service */
import { CloudinaryService } from '@/cloudinary/cloudinary.service';
/** import thư viện sharp */
import sharp from 'sharp';
/** import dto xóa nhân viên */
import { DeleteEmployerDto } from './dto/delete-employer.dto';

/** Service quản lý nhân viên */
@Injectable()
export class EmployerService {
    /**
     * khởi tạo service
     * @param PRISMA_SERVICE 
     * @param CLOUDINARY_SERVICE 
     */
    constructor(private readonly PRISMA_SERVICE: PrismaService,
        private readonly CLOUDINARY_SERVICE: CloudinaryService
    ) { }

    /**
     * tạo mới nhân viên
     * @param create_employer_dto dto tạo nhân viên
     * @param avatar file ảnh đại diện
     * @returns thông tin nhân viên vừa tạo
     */
    async Create(create_employer_dto: CreateEmployerDto, avatar?: Express.Multer.File) {
        /** Tìm nhân viên đã tồn tại theo tên */
        const EXISTING_EMPLOYER = await this.PRISMA_SERVICE.employer.findFirst({
          where: {
            name: create_employer_dto.name,
          },
        });
    
        /** Nếu nhân viên đã tồn tại thì ném lỗi */
        if (EXISTING_EMPLOYER) throw new BadRequestException('Employer already exists');
    
        try {
          /** khai báo biến url ảnh */
          let avatar_url = create_employer_dto.avatar_url;
    
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
              folder: 'employer-avatars',
            });
    
            /** gán url ảnh sau khi upload */
            avatar_url = UPLOAD_RESULT.secure_url;
          }
    
          /** Kiểm tra shop_id */
          const { shop_id, password, userId, ...rest } = create_employer_dto;
          /** ném lỗi nếu không có shop_id */
          if (!shop_id) throw new BadRequestException('Shop ID is required');
          /** ném lỗi nếu không có userId */
          if (!userId) throw new BadRequestException('User ID is required');

          /** Tạo nhân viên mới trong database */
          const EMPLOYER = await this.PRISMA_SERVICE.employer.create({
            data: {
              ...rest,
              /** mã hóa mật khẩu */
              password: await bcrypt.hash(password, 10),
              /** gán url ảnh */
              avatar_url: avatar_url || create_employer_dto.avatar_url || '',
              /** gán shop_id */
              shop_id: shop_id,
              /** gán userId */
              userId: userId,
            },
          });
          /** Trả về thông tin nhân viên */
          return EMPLOYER;
        } catch (error) {
          /** Ném lỗi nếu có */
          throw new BadRequestException(
            error.message || 'Failed to create employer',
          );
        }
      }

    /**
     * lấy danh sách tất cả nhân viên với pagination, search, sort, filters
     * @param query query parameters
     * @returns danh sách nhân viên và phân trang
     */
    async findAll(query?: {
      page?: number;
      limit?: number;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      shop_id?: string;
      minSalary?: number;
      maxSalary?: number;
    }) {
      /** Destructure và set default values */
      const {
        page = 1,
        limit = 10,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        shop_id,
        minSalary,
        maxSalary
      } = query || {};

      /** Validate và normalize */
      const MAX_LIMIT = Math.max(1, Math.min(limit, 100));
      const CURRENT_PAGE = Math.max(page, 1);
      const OFFSET = (CURRENT_PAGE - 1) * MAX_LIMIT;

      /** Build where clause */
      const where: Record<string, unknown> = {};

      /** Search conditions - tìm kiếm theo name, email, phone */
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } }
        ];
      }

      /** Filter conditions */
      if (shop_id) where.shop_id = shop_id;

      /** Salary range filter */
      if (minSalary !== undefined || maxSalary !== undefined) {
        const salary_filter: Record<string, number> = {};
        if (minSalary !== undefined) salary_filter.gte = minSalary;
        if (maxSalary !== undefined) salary_filter.lte = maxSalary;
        where.salary = salary_filter;
      }

      /** Đếm tổng số records */
      const TOTAL = await this.PRISMA_SERVICE.employer.count({ where });
      const TOTAL_PAGE = Math.max(1, Math.ceil(TOTAL / MAX_LIMIT));

      /** Lấy danh sách từ DB */
      const DATA = await this.PRISMA_SERVICE.employer.findMany({
        where,
        take: MAX_LIMIT,
        skip: OFFSET,
        orderBy: { [sortBy]: sortOrder }
      });

      /** Trả về với pagination info */
      return {
        data: DATA,
        total: TOTAL,
        page: CURRENT_PAGE,
        limit: MAX_LIMIT,
        totalPage: TOTAL_PAGE
      };
    }

    /**
     * lấy thông tin một nhân viên
     * @param id id nhân viên
     * @returns thông tin nhân viên
     */
     async findOne(id: string) {
        /** tìm nhân viên theo id */
        const DATA =  await this.PRISMA_SERVICE.employer.findUnique({
            where: {
                id
            }
        })
        /** nếu không tìm thấy thì ném lỗi */
        if(!DATA) throw new NotFoundException(`Employer with id ${id} not found`);
        /** trả về dữ liệu */
        return DATA;
    }

    /**
     * cập nhật thông tin nhân viên
     * @param id id nhân viên
     * @param updateEmployerDto dữ liệu cập nhật
     * @returns thông tin sau cập nhật
     */
    async update(id: string, updateEmployerDto: UpdateEmployerDto) {
        /** kiểm tra nhân viên có tồn tại không */
        const DATA =  await this.PRISMA_SERVICE.employer.findUnique({
            where: {
                id
            }
        })
        /** nếu không tìm thấy thì ném lỗi */
        if(!DATA) throw new NotFoundException(`Employer with id ${id} not found`);
        
        /** cập nhật dữ liệu */
        const UPDATE_DATA = await this.PRISMA_SERVICE.employer.update({
            where: {
                id
            },
            data: updateEmployerDto
        })
        /** trả về dữ liệu sau cập nhật */
        return UPDATE_DATA;
        
    }

    /**
     * xóa nhân viên
     * @param id id nhân viên
     * @returns thông tin nhân viên đã xóa
     */
    async remove(id:string) {   
        /** kiểm tra nhân viên có tồn tại không */
        const DATA =  await this.PRISMA_SERVICE.employer.findUnique({
            where: {
                id
            }
        })
        /** mỗi dòng code phải có chú thích */
        if(!DATA) throw new NotFoundException(`Employer with id ${id} not found`);
        
        /** thực hiện xóa trong db */
        const DELETE_DATA = await this.PRISMA_SERVICE.employer.delete({
            where: {
                id
            }
        })
        /** trả về dữ liệu đã xóa */
        return DELETE_DATA;
    }

    /**
     * upload và tối ưu ảnh avatar
     * @param id id nhân viên
     * @param avatar file ảnh
     * @returns thông tin cập nhật
     */
    async UploadAvatarOptimized(id: string, avatar: Express.Multer.File) {
        /** Tìm thông tin nhân viên cần upload avatar */
        const EMPLOYER = await this.PRISMA_SERVICE.employer.findUnique({
          where: { id },
          select: { id: true, avatar_url: true },
        });
    
        /** Nếu không tìm thấy nhân viên thì ném lỗi NotFound */
        if (!EMPLOYER) throw new NotFoundException(`Employer with ID ${id} not found`);
    
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
            folder: 'employer-avatars',
          });
    
          /** Update database sử dụng transaction */
          const UPDATED_EMPLOYER = await this.PRISMA_SERVICE.$transaction(async (tx) => {
            /** cập nhật bản ghi */
            return tx.employer.update({
              where: { id },
              data: {
                avatar_url: RESULT.secure_url,
                updatedAt: new Date(),
              },
            });
          });
    
          /** Xóa avatar cũ nếu tồn tại */
          if (EMPLOYER.avatar_url) {
            /** Gọi hàm xóa avatar cũ và log lỗi nếu thất bại */
            this.DeleteOldAvatar(EMPLOYER.avatar_url).catch((err) =>
              console.error('Failed to delete old avatar:', err),
            );
          }
    
          /** Trả về thông tin nhân viên sau khi cập nhật */
          return {
            id: UPDATED_EMPLOYER.id,
            avatar_url: UPDATED_EMPLOYER.avatar_url,
            updated_at: UPDATED_EMPLOYER.updatedAt,
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

    /**
     * xóa avatar cũ trên cloudinary
     * @param avatar_url đường dẫn ảnh cũ
     */
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
