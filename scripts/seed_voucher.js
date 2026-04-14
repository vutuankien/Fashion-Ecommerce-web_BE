const { PrismaClient } = require('@prisma/client');
const { Client } = require('@elastic/elasticsearch');

const prisma = new PrismaClient();
const elasticsearchClient = new Client({ node: 'http://localhost:9200' });

const INDEX_NAME = 'vouchers';

/**
 * Khởi tạo index Elasticsearch nếu chưa tồn tại
 */
async function createIndexIfNotExists() {
  try {
    const exists = await elasticsearchClient.indices.exists({ index: INDEX_NAME });
    
    if (!exists) {
      console.log(`Tạo index '${INDEX_NAME}'...`);
      await elasticsearchClient.indices.create({
        index: INDEX_NAME,
        mappings: {
          properties: {
            id: { type: 'keyword' },
            code: { type: 'text' },
            name: { type: 'keyword' },
            type: { type: 'keyword' },
            applyType: { type: 'keyword' },
            provider: { type: 'keyword' },
            value: { type: 'integer' },
            maxValue: { type: 'integer' },
            minOrderValue: { type: 'integer' },
            quantity: { type: 'integer' },
            used: { type: 'integer' },
            usageLimitPerUser: { type: 'integer' },
            shippingDiscount: { type: 'integer' },
            isActive: { type: 'boolean' },
            isPublic: { type: 'boolean' },
            startTime: { type: 'date' },
            endTime: { type: 'date' },
            createdAt: { type: 'date' },
          },
        },
      });
      console.log(`Index '${INDEX_NAME}' đã tạo thành công!\n`);
    } else {
      console.log(`Index '${INDEX_NAME}' đã tồn tại, tiếp tục seed dữ liệu...\n`);
    }
  } catch (error) {
    console.error('Lỗi khi khởi tạo index:', error.message);
    throw error;
  }
}

/**
 * Lấy tất cả sản phẩm từ database
 */
async function getAllVouchers() {
  try {
    console.log('Đang lấy danh sách voucher từ database...');
    const vouchers = await prisma.voucher.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
        applyType: true,
        provider: true,
        value: true,
        maxValue: true,
        minOrderValue: true,
        quantity: true,
        used: true,
        usageLimitPerUser: true,
        shippingDiscount: true,
        isActive: true,
        isPublic: true,
        startTime: true,
        endTime: true,
        createdAt: true,
        // images: true,
      },
    });
    console.log(`Tìm thấy ${vouchers.length} voucher\n`);
    return vouchers;
  } catch (error) {
    console.error('Lỗi khi lấy voucher:', error.message);
    throw error;
  }
}

/**
 * Index sản phẩm vào Elasticsearch
 */
async function indexVouchers(vouchers) {
  if (vouchers.length === 0) {
    console.log('Không có voucher nào để index.');
    return;
  }

  try {
    console.log(`Indexing ${vouchers.length} voucher vào Elasticsearch...`);
    
    // Sử dụng bulk API để index nhiều tài liệu cùng lúc (hiệu suất cao)
    const bulkBody = [];
    vouchers.forEach((voucher) => {
      // Action line (index action)
      bulkBody.push({
        index: { _index: INDEX_NAME, _id: voucher.id },
      });
      
      // Document line
      bulkBody.push({
        id: voucher.id,
        code: voucher.code,
        name: voucher.name,
        type: voucher.type,
        applyType: voucher.applyType,
        provider: voucher.provider,
        value: voucher.value,
        maxValue: voucher.maxValue,
        minOrderValue: voucher.minOrderValue,
        quantity: voucher.quantity,
        used: voucher.used,
        usageLimitPerUser: voucher.usageLimitPerUser,
        shippingDiscount: voucher.shippingDiscount,
        isActive: voucher.isActive,
        isPublic: voucher.isPublic,
        startTime: voucher.startTime,
        endTime: voucher.endTime,
        createdAt: voucher.createdAt,
      });
    });

    const response = await elasticsearchClient.bulk({ body: bulkBody });

    if (response.errors) {
      console.error('Một số lỗi xảy ra trong quá trình indexing:');
      response.items.forEach((item) => {
        if (item.index?.error) {
          console.error(`  - Document ${item.index._id}: ${item.index.error.reason}`);
        }
      });
    } else {
      console.log(`Đã index thành công ${vouchers.length} voucher!\n`);
    }

    // Thống kê
    const indexed = response.items.filter((item) => !item.index?.error).length;
    const failed = response.items.filter((item) => item.index?.error).length;
    console.log(`Thống kê: ${indexed} thành công, ${failed} thất bại`);
    
  } catch (error) {
    console.error('Lỗi khi indexing voucher:', error.message);
    throw error;
  }
}

/**
 * Hàm chính
 */
async function main() {
  try {
    console.log('Bắt đầu seed Elasticsearch với dữ liệu voucher...\n');

    // Step 1: Tạo index
    await createIndexIfNotExists();

    // Step 2: Lấy tất cả sản phẩm
    const vouchers = await getAllVouchers();

    // Step 3: Index sản phẩm
    await indexVouchers(vouchers);

    console.log('\nSeed Elasticsearch hoàn tất!');
    process.exitCode = 0;
  } catch (error) {
    console.error('\nSeed thất bại:', error.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
    await elasticsearchClient.close();
  }
}

main();
