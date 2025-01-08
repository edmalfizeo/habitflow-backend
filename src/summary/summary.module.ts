import { Module } from '@nestjs/common';
import { SummaryService } from './summary.service';
import { SummaryController } from './summary.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [SummaryService, PrismaService],
  controllers: [SummaryController],
})
export class SummaryModule {}
