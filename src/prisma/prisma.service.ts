// import { adapter } from './../../node_modules/effect/src/Utils';
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
@Injectable()
export class PrismaService extends PrismaClient  {
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL as string,
    });
    super({ adapter });
    if (!adapter) {
      throw new Error('database is not connected');
    }
    console.log('database connected successfully');
  }
}
