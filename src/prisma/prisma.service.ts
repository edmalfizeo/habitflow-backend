import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  // Connect to the database
  async onModuleInit() {
    await this.$connect();
  }

  // Disconnect from the database
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
