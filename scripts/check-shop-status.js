const Redis = require('ioredis');

// Kết nối Redis (cùng config với backend)
const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || '',
  db: Number(process.env.REDIS_DB) || 0,
});

async function checkShopStatus() {
  try {
    // 1. Lấy tất cả keys shop:online:*
    const onlineKeys = await redis.keys('shop:online:*');
    console.log('--- ONLINE SHOPS ---');
    if (onlineKeys.length === 0) {
      console.log('No shops currently online.');
    } else {
      for (const key of onlineKeys) {
        const id = key.split(':')[2];
        const ttl = await redis.ttl(key);
        console.log(`Shop ID: ${id} (Expires in: ${ttl}s)`);
      }
    }

    // 2. Lấy tất cả keys shop:last_seen:*
    const lastSeenKeys = await redis.keys('shop:last_seen:*');
    console.log('\n--- LAST SEEN SHOPS ---');
    if (lastSeenKeys.length === 0) {
      console.log('No last seen records found.');
    } else {
      for (const key of lastSeenKeys) {
        const id = key.split(':')[2];
        const timestamp = await redis.get(key);
        const date = new Date(Number(timestamp));
        console.log(`Shop ID: ${id} - Last Seen: ${date.toLocaleString()}`);
      }
    }

  } catch (err) {
    console.error('Error checking Redis:', err);
  } finally {
    redis.disconnect();
  }
}

checkShopStatus();
