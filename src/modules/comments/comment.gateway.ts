import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, ConnectedSocket } from '@nestjs/websockets';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
    cors: {
        origin: "*",
        credentials: true,
    }
})
export class CommentGateway {
    /** Đối tượng Server socket */
    @WebSocketServer()
    server: Server;

    /** Logger để ghi log */
    private readonly logger = new Logger(CommentGateway.name);

    /** Hàm khởi tạo */
    constructor(private readonly commentsService: CommentsService) {}

    /** Nhận sự kiện client tham gia phòng sản phẩm */
    @SubscribeMessage('join-product')
    handleJoinProduct(@ConnectedSocket() client: Socket, @MessageBody() payload: { productId: string }) {
        /** Client tham gia phòng theo productId */
        client.join(`product:${payload.productId}`);
    }

    /** Nhận sự kiện bình luận mới */
    @SubscribeMessage('newComment')
    async handleNewComment(@ConnectedSocket() client: Socket, @MessageBody() payload: CreateCommentDto) {
        try {
            /** Log payload nhận được để debug */
            this.logger.log(`[newComment] payload: ${JSON.stringify(payload)}`);

            /** Tạo bình luận qua service từ payload */
            const comment = await this.commentsService.create(payload);

            /** Gửi sự kiện tới phòng id sản phẩm cụ thể */
            this.server
                .to(`product:${payload.productId}`)
                .emit('comment-created', comment);

            /** Trả về bình luận */
            return comment;
        } catch (error) {
            /** Log lỗi chi tiết */
            this.logger.error(`[newComment] Failed to create comment: ${error.message}`, error.stack);

            /** Gửi lỗi về cho client gửi comment */
            client.emit('comment-error', {
                message: 'Không thể lưu bình luận. Vui lòng thử lại.',
                productId: payload.productId,
            });
        }
    }
}