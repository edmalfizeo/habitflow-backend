import { Test, TestingModule } from '@nestjs/testing';
import { SummaryService } from './summary.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SummaryService', () => {
  let service: SummaryService;
  let prismaMock: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SummaryService,
        {
          provide: PrismaService,
          useValue: {
            task: {
              count: jest.fn(),
              groupBy: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<SummaryService>(SummaryService);
    prismaMock = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getGeneralSummary', () => {
    it('should return the general summary', async () => {
      (prismaMock.task.count as jest.Mock)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(7);

      const result = await service.getGeneralSummary('userId');

      expect(result).toEqual({
        totalTasks: 10,
        completedTasks: 7,
        pendingTasks: 3,
        completedRate: 70,
      });
    });

    it('should return zero values when there are no tasks', async () => {
      (prismaMock.task.count as jest.Mock)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      const result = await service.getGeneralSummary('userId');

      expect(result).toEqual({
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        completedRate: 0,
      });
    });

    it('should throw an error if Prisma count fails', async () => {
      (prismaMock.task.count as jest.Mock).mockRejectedValueOnce(
        new Error('Database error'),
      );

      await expect(service.getGeneralSummary('userId')).rejects.toThrow(
        'An error occurred while fetching the summary',
      );
    });
  });

  describe('getProgress', () => {
    it('should return weekly progress', async () => {
      const userId = 'user123';

      (prismaMock.task.groupBy as jest.Mock).mockResolvedValueOnce([
        { status: 'completed', _count: 5 },
        { status: 'pending', _count: 3 },
      ]);

      const result = await service.getProgress(userId);

      expect(result).toEqual({
        completedTasks: 5,
        pendingTasks: 3,
      });

      expect(prismaMock.task.groupBy).toHaveBeenCalledWith({
        by: ['status'],
        where: { userId },
        _count: true,
        orderBy: { status: 'asc' },
      });
    });

    it('should return zero values when there are no tasks', async () => {
      const userId = 'user123';

      (prismaMock.task.groupBy as jest.Mock).mockResolvedValueOnce([]);

      const result = await service.getProgress(userId);

      expect(result).toEqual({
        completedTasks: 0,
        pendingTasks: 0,
      });

      expect(prismaMock.task.groupBy).toHaveBeenCalledWith({
        by: ['status'],
        where: { userId },
        _count: true,
        orderBy: { status: 'asc' },
      });
    });

    it('should throw an error if Prisma groupBy fails', async () => {
      const userId = 'user123';

      (prismaMock.task.groupBy as jest.Mock).mockRejectedValueOnce(
        new Error('Database error'),
      );

      await expect(service.getProgress(userId)).rejects.toThrow(
        'An error occurred while fetching the progress',
      );

      expect(prismaMock.task.groupBy).toHaveBeenCalledWith({
        by: ['status'],
        where: { userId },
        _count: true,
        orderBy: { status: 'asc' },
      });
    });
  });
});
