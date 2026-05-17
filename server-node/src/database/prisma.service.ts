import { PrismaPg } from '@prisma/adapter-pg';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    const connectionString =
      process.env.DATABASE_URL ??
      'postgresql://byyouside:byyouside_password@localhost:5432/byyouside?schema=public';
    super({
      adapter: new PrismaPg(connectionString),
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
