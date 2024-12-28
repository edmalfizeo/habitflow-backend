import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create_task.dto';

describe('TasksService', () => {
  let service: TasksService;
  let prismaMock: {
    task: {
      create: jest.Mock;
    };
  };

  beforeEach(async () => {
    prismaMock = {
      task: {
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a task successfully', async () => {
      const userId = '123';
      const createTaskDto: CreateTaskDto = {
        title: 'Learn Zod',
        description: 'Implement Zod validation',
        status: 'pending',
        deadline: new Date('2024-12-31T23:59:59Z').toISOString(),
      };

      prismaMock.task.create.mockResolvedValue({
        id: 'task123',
        ...createTaskDto,
        userId,
      });

      const result = await service.create(createTaskDto, userId);

      expect(result).toEqual({
        id: 'task123',
        ...createTaskDto,
        userId,
      });

      expect(prismaMock.task.create).toHaveBeenCalledWith({
        data: {
          ...createTaskDto,
          user: {
            connect: { id: userId },
          },
        },
      });
    });
  });
});
