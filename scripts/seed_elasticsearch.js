const { PrismaClient } = require('@prisma/client');
const { Client } = require('@elastic/elasticsearch');

const prisma = new PrismaClient();
const elasticsearchClient = new Client({ node: 'http://localhost:9200' });

const INDEX_NAME = 'products';

/**
 * Khởi tạo index Elasticsearch nếu chưa tồn tại
 */
async function createIndexIfNotExists() {
  try {
    const exists = await elasticsearchClient.indices.exists({ index: INDEX_NAME });
    
    if (!exists) {
      console.log(`📝 Tạo index '${INDEX_NAME}'...`);
      await elasticsearchClient.indices.create({
        index: INDEX_NAME,
        mappings: {
          properties: {
            id: { type: 'keyword' },
            name: { type: 'text' },
            brand: { type: 'keyword' },
            category: { type: 'keyword' },
            price: { type: 'integer' },
            rating: { type: 'float' },
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
async function getAllProducts() {
  try {
    console.log('🔍 Đang lấy danh sách sản phẩm từ database...');
    const products = await prisma.products.findMany({
      select: {
        id: true,
        name: true,
        keyword: true,
        brand: true,
        category: true,
        sale_price: true,
        rating: true,
        images: true,
      },
    });
    console.log(`Tìm thấy ${products.length} sản phẩm\n`);
    return products;
  } catch (error) {
    console.error('Lỗi khi lấy sản phẩm:', error.message);
    throw error;
  }
}

/**
 * Index sản phẩm vào Elasticsearch
 */
async function indexProducts(products) {
  if (products.length === 0) {
    console.log('⚠️  Không có sản phẩm nào để index.');
    return;
  }

  try {
    console.log(`📤 Indexing ${products.length} sản phẩm vào Elasticsearch...`);
    
    // Sử dụng bulk API để index nhiều tài liệu cùng lúc (hiệu suất cao)
    const bulkBody = [];
    products.forEach((product) => {
      // Action line (index action)
      bulkBody.push({
        index: { _index: INDEX_NAME, _id: product.id },
      });
      
      // Document line
      bulkBody.push({
        id: product.id,
        name: product.name,
        brand: product.brand || '',
        category: Array.isArray(product.category) ? product.category.join(', ') : (product.category || ''),
        price: product.sale_price,
        keyword: product.keyword || '',
        rating: product.rating || 0,
        image_url: product.images?.[0] || '',
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
      console.log(`Đã index thành công ${products.length} sản phẩm!\n`);
    }

    // Thống kê
    const indexed = response.items.filter((item) => !item.index?.error).length;
    const failed = response.items.filter((item) => item.index?.error).length;
    console.log(`📊 Thống kê: ${indexed} thành công, ${failed} thất bại`);
    
  } catch (error) {
    console.error('Lỗi khi indexing sản phẩm:', error.message);
    throw error;
  }
}

/**
 * Hàm chính
 */
async function main() {
  try {
    console.log('🚀 Bắt đầu seed Elasticsearch với dữ liệu sản phẩm...\n');

    // Step 1: Tạo index
    await createIndexIfNotExists();

    // Step 2: Lấy tất cả sản phẩm
    const products = await getAllProducts();

    // Step 3: Index sản phẩm
    await indexProducts(products);

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
