import { Injectable } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CommentsService {

  /** Các trường user an toàn trả về cho client */
  private readonly SAFE_USER_SELECT = {
    id: true,
    name: true,
    email: true,
    avatar_url: true,
  } as const;

  constructor(private readonly prisma: PrismaService){}
  create(createCommentDto: CreateCommentDto) {
    return this.prisma.comments.create({
      data: createCommentDto,
      include: {
        user: { select: this.SAFE_USER_SELECT }
      }
    });
  }

  async getUserById(userId: number) {
    const User = await this.prisma.user.findUnique({
      where: { id: userId },
      select: this.SAFE_USER_SELECT,
    });

    if(!User) {
      throw new Error(`User with id ${userId} not found`);
    }
    return User;
  }

  findAll() {
    return this.prisma.comments.findMany();
  }

  findOne(id: string) {
    return this.prisma.comments.findUnique({
      where: { id }
    });
  }

  findByProductId(productId: string) {
    return this.prisma.comments.findMany({
      where: { productId },
      include: {
        user: { select: this.SAFE_USER_SELECT }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  update(id: string, updateCommentDto: UpdateCommentDto) {
    return this.prisma.comments.update({
      where: { id },
      data: updateCommentDto
    });
  }

  remove(id: string) {
    return this.prisma.comments.delete({
      where: { id }
    });
  }
}
