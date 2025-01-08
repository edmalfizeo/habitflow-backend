import { Test, TestingModule } from '@nestjs/testing';
import { SummaryController } from './summary.controller';
import { SummaryService } from './summary.service';

describe('SummaryController', () => {
  let controller: SummaryController;
  let service: jest.Mocked<SummaryService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SummaryController],
      providers: [
        {
          provide: SummaryService,
          useValue: {
            getGeneralSummary: jest.fn(),
            getProgress: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<SummaryController>(SummaryController);
    service = module.get<SummaryService>(
      SummaryService,
    ) as jest.Mocked<SummaryService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getGeneralSummary', () => {
    it('should return general summary', async () => {
      const mockUserId = 'user123';
      const mockSummary = {
        totalTasks: 10,
        completedTasks: 7,
        pendingTasks: 3,
        completedRate: 70,
      };

      service.getGeneralSummary.mockResolvedValue(mockSummary);

      const result = await controller.getGeneralSummary({
        user: { userId: mockUserId },
      });

      expect(result).toEqual(mockSummary);
      expect(service.getGeneralSummary).toHaveBeenCalledWith(mockUserId);
    });

    it('should throw an error if service fails', async () => {
      const mockUserId = 'user123';

      service.getGeneralSummary.mockRejectedValue(new Error('Service error'));

      await expect(
        controller.getGeneralSummary({ user: { userId: mockUserId } }),
      ).rejects.toThrow('Service error');

      expect(service.getGeneralSummary).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('getProgress', () => {
    it('should return progress data (happy path)', async () => {
      const mockUserId = 'user123';
      const mockProgress = { completedTasks: 7, pendingTasks: 3 };

      service.getProgress.mockResolvedValue(mockProgress);

      const result = await controller.getProgress({
        user: { userId: mockUserId },
      });

      expect(result).toEqual(mockProgress);
      expect(service.getProgress).toHaveBeenCalledWith(mockUserId);
    });

    it('should throw an error if service fails', async () => {
      const mockUserId = 'user123';

      service.getProgress.mockRejectedValue(new Error('Service error'));

      await expect(
        controller.getProgress({ user: { userId: mockUserId } }),
      ).rejects.toThrow('Service error');

      expect(service.getProgress).toHaveBeenCalledWith(mockUserId);
    });
  });
});
