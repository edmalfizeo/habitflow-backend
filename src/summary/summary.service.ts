import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SummaryService {
  constructor(private prisma: PrismaService) {}

  async getGeneralSummary(userId: string) {
    try {
      const totalTasks = await this.prisma.task.count({
        where: { userId },
      });

      const completedTasks = await this.prisma.task.count({
        where: { userId, status: 'completed' },
      });

      const pendingTasks = totalTasks - completedTasks;
      const completedRate =
        totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      return {
        totalTasks,
        completedTasks,
        pendingTasks,
        completedRate: Math.round(completedRate),
      };

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new Error('An error occurred while fetching the summary');
    }
  }

  async getProgress(userId: string) {
    try {
      const weeklyData = await this.prisma.task.groupBy({
        by: ['status'],
        where: { userId },
        _count: true,
        orderBy: { status: 'asc' },
      });

      const result = weeklyData.reduce(
        (acc, item) => {
          if (item.status === 'completed') {
            acc.completedTasks += item._count;
          } else {
            acc.pendingTasks += item._count;
          }
          return acc;
        },
        { completedTasks: 0, pendingTasks: 0 },
      );

      return result;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new Error('An error occurred while fetching the progress');
    }
  }
}
