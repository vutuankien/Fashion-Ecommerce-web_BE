import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTagDto } from './dto/create-tag.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TagsService {

  constructor(
    private readonly prisma : PrismaService
  ){}


  /**Service tạo tag mới */
  async create(dto: CreateTagDto) {
    const exist = await this.prisma.tags.findFirst({
      where: { name: dto.name },
    });

    if (exist) {
      throw new ConflictException('Tag already exists');
    }

    return this.prisma.tags.create({
      data: dto,
    });
  }



  getTags(){
    const DATA =  this.prisma.tags.findMany({})
    return DATA
  }


  async getById(id:string){
    const EXIST_DATA = await this.prisma.tags.findUnique({where:{id}})
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
    return this.prisma.tags.delete({ where: { id } });
  }
}
