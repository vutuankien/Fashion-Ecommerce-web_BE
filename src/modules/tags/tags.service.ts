import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTagDto } from './dto/create-tag.dto';
import { PrismaService } from 'src/prisma/prisma.service';
/** Import TagsCache */
import { TagsCache } from './tags.cache';

@Injectable()
export class TagsService {

  constructor(
    private readonly prisma : PrismaService,
    /** Inject TagsCache */
    private readonly TAGS_CACHE: TagsCache
  ){}


  /**Service tạo tag mới */
  async create(dto: CreateTagDto) {
    const exist = await this.prisma.tags.findFirst({
      where: { name: dto.name },
    });

    if (exist) {
      throw new ConflictException('Tag already exists');
    }

    /** Tạo tag mới */
    const DATA = await this.prisma.tags.create({
      data: dto,
    });

    /** Invalidate cache sau khi tạo mới */
    await this.TAGS_CACHE.invalidateAll();

    return DATA;
  }





  /** Service lấy danh sách tags với pagination, search, sort */
  async getTags(query?: { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }) {
    /** Destructure và set default values */
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = query || {};

    /** Validate và normalize */
    const MAX_LIMIT = Math.max(1, Math.min(limit, 100));
    const CURRENT_PAGE = Math.max(page, 1);
    const OFFSET = (CURRENT_PAGE - 1) * MAX_LIMIT;

    /** Build where clause */
    const where = search ? {
      name: {
        contains: search,
        mode: 'insensitive' as const
      }
    } : {};

    /** Đếm tổng số records */
    const TOTAL = await this.prisma.tags.count({ where });
    const TOTAL_PAGE = Math.max(1, Math.ceil(TOTAL / MAX_LIMIT));

    /** Lấy danh sách */
    const DATA = await this.prisma.tags.findMany({
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


  async getById(id:string){
    /** Lấy tag từ cache hoặc DB */
    const EXIST_DATA = await this.TAGS_CACHE.get(id)
    if (!EXIST_DATA){
      throw new NotFoundException('Tag not found')
    }
    return EXIST_DATA
  }


  /**Service xóa tag */
  async remove(id: string) {
    const EXIST_DATA = await this.prisma.tags.findUnique({where:{id}})

    if (!EXIST_DATA){
      throw new NotFoundException('Tag not found')
    }
    /**Xóa tag */
    const DATA = await this.prisma.tags.delete({ where: { id } });

    /** Xóa cache của tag này và invalidate list */
    await this.TAGS_CACHE.delete(id);
    await this.TAGS_CACHE.invalidateAll();

    return DATA;
  }
}
