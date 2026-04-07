import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { CommentGateway } from './comment.gateway';

/** Module quản lý comment sản phẩm */
@Module({
  /** Các controller xử lý HTTP request */
  controllers: [CommentsController],
  /** Các provider: service xử lý logic + gateway xử lý socket */
  providers: [CommentsService, CommentGateway],
})
export class CommentsModule {}
