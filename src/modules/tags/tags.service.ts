import { Injectable } from '@nestjs/common';
import { CreateTagDto } from './dto/create-tag.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TagsService {

  constructor(
    private readonly prisma : PrismaService
  ){}


  /**Service tạo tag mới */
  async create(createTagDto: CreateTagDto) {

    const EXIST_DATA = await this.prisma.tags.findFirst({where:{name: createTagDto.name}})

    if (EXIST_DATA){
      throw new Error('Tag already exists')
    }

    /**Tạo tag mới */
    const DATA = this.prisma.tags.create({
      data : createTagDto
    })

    /**Trả về data */
    return DATA
  }


  getTags(){
    const DATA =  this.prisma.tags.findMany({})
    return DATA
  }


  getById(id:string){
    return this.prisma.tags.findUnique({where:{id}})
  }


  /**Service xóa tag */
  remove(id: string) {
    /**Xóa tag */
    return this.prisma.tags.delete({ where: { id } });
  }
}
