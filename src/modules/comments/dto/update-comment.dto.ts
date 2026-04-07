import { PartialType } from '@nestjs/mapped-types';
import { CreateCommentDto } from './create-comment.dto';
import { IsArray, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateCommentDto extends PartialType(CreateCommentDto) {
    @IsString()
    @IsOptional()
    content?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    images?: string[];
}
