import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AttributeService } from './attribute.service';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';
import { CreateAttributeValueBodyDto, CreateAttributeValueDto } from './dto/create-attribute-value.dto';
import { UpdateAttributeValueDto } from './dto/update-attribute-value.dto';
import { ResponseHelper } from 'src/helper/response.helper';

/** Controller xử lý các route cho Attribute và AttributeValue */
@Controller('attributes')
export class AttributeController {
    /** Inject AttributeService */
    constructor(private readonly ATTRIBUTE_SERVICE: AttributeService) {}

    // ─────────────────────────── ATTRIBUTE ────────────────────────────

    /** POST /attributes - Tạo mới một Attribute */
    @Post()
    async create(@Body() dto: CreateAttributeDto) {
        /** Gọi service tạo mới */
        const DATA = await this.ATTRIBUTE_SERVICE.create(dto);
        /** Trả về response thống nhất */
        return ResponseHelper.Success(DATA, 'Tạo attribute thành công', 201);
    }

    /** GET /attributes - Lấy tất cả Attribute */
    @Get()
    async findAll() {
        /** Gọi service lấy tất cả */
        const DATA = await this.ATTRIBUTE_SERVICE.findAll();
        /** Trả về response thống nhất */
        return ResponseHelper.Success(DATA, 'Lấy danh sách attribute thành công', 200);
    }

    /** GET /attributes/:id - Lấy một Attribute theo id */
    @Get(':id')
    async findOne(@Param('id') id: string) {
        /** Gọi service tìm theo id */
        const DATA = await this.ATTRIBUTE_SERVICE.findOne(id);
        /** Trả về response thống nhất */
        return ResponseHelper.Success(DATA, 'Lấy attribute thành công', 200);
    }

    /** PATCH /attributes/:id - Cập nhật một Attribute */
    @Patch(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateAttributeDto) {
        /** Gọi service cập nhật */
        const DATA = await this.ATTRIBUTE_SERVICE.update(id, dto);
        /** Trả về response thống nhất */
        return ResponseHelper.Success(DATA, 'Cập nhật attribute thành công', 200);
    }

    /** DELETE /attributes/:id - Xóa một Attribute */
    @Delete(':id')
    async remove(@Param('id') id: string) {
        /** Gọi service xóa */
        const DATA = await this.ATTRIBUTE_SERVICE.remove(id);
        /** Trả về response thống nhất */
        return ResponseHelper.Success(DATA, 'Xóa attribute thành công', 200);
    }

    // ──────────────────────── ATTRIBUTE VALUE ─────────────────────────

    /** POST /attributes/:attributeId/values - Tạo mới một AttributeValue */
    @Post(':attributeId/values')
    async createValue(
        @Param('attributeId') attributeId: string,
        /** Chỉ nhận code + label từ body, KHÔNG nhận attributeId */
        @Body() dto: CreateAttributeValueBodyDto,
    ) {
        /** Gộp attributeId từ URL param vào DTO trước khi gọi service */
        const full_dto: CreateAttributeValueDto = { ...dto, attributeId };
        const DATA = await this.ATTRIBUTE_SERVICE.createValue(full_dto);
        /** Trả về response thống nhất */
        return ResponseHelper.Success(DATA, 'Tạo attribute value thành công', 201);
    }

    /** GET /attributes/:attributeId/values - Lấy tất cả values theo attributeId */
    @Get(':attributeId/values')
    async findAllValues(@Param('attributeId') attributeId: string) {
        /** Gọi service lấy tất cả values */
        const DATA = await this.ATTRIBUTE_SERVICE.findAllValues(attributeId);
        /** Trả về response thống nhất */
        return ResponseHelper.Success(DATA, 'Lấy danh sách attribute value thành công', 200);
    }

    /** GET /attributes/values/:id - Lấy một AttributeValue theo id */
    @Get('values/:id')
    async findOneValue(@Param('id') id: string) {
        /** Gọi service tìm value theo id */
        const DATA = await this.ATTRIBUTE_SERVICE.findOneValue(id);
        /** Trả về response thống nhất */
        return ResponseHelper.Success(DATA, 'Lấy attribute value thành công', 200);
    }

    /** PATCH /attributes/values/:id - Cập nhật một AttributeValue */
    @Patch('values/:id')
    async updateValue(@Param('id') id: string, @Body() dto: UpdateAttributeValueDto) {
        /** Gọi service cập nhật value */
        const DATA = await this.ATTRIBUTE_SERVICE.updateValue(id, dto);
        /** Trả về response thống nhất */
        return ResponseHelper.Success(DATA, 'Cập nhật attribute value thành công', 200);
    }

    /** DELETE /attributes/values/:id - Xóa một AttributeValue */
    @Delete('values/:id')
    async removeValue(@Param('id') id: string) {
        /** Gọi service xóa value */
        const DATA = await this.ATTRIBUTE_SERVICE.removeValue(id);
        /** Trả về response thống nhất */
        return ResponseHelper.Success(DATA, 'Xóa attribute value thành công', 200);
    }
}
