import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  create(@Body() createCommentDto: CreateCommentDto) {
    return this.commentsService.create(createCommentDto);
  }

  @Get()
  findAll() {
    return this.commentsService.findAll();
  }

  @Get('product/:productId')
  async findByProductId(@Param('productId') productId: string) {
    /** Lấy danh sách comment theo productId */
    const comments = await this.commentsService.findByProductId(productId);
    /** Trả về dạng { data: [...] } để khớp với ICommentResponse */
    return { status: 200, message: 'success', data: comments };
  }

  
  @Get('user/:userId')
  async findByUserId(@Param('userId', ParseIntPipe) userId: number) {
    /** Lấy danh sách comment theo userId */
    const user = await this.commentsService.getUserById(userId);
    /** Trả về dạng { data: [...] } để khớp với ICommentResponse */
    return { status: 200, message: 'get user successfully', data: user };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.commentsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCommentDto: UpdateCommentDto) {
    return this.commentsService.update(id, updateCommentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.commentsService.remove(id);
  }
}
