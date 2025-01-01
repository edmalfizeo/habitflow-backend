import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create_task.dto';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

describe('TasksService', () => {
  let service: TasksService;
  let prismaMock: {
    task: {
      create: jest.Mock<any, any>;
      findMany: jest.Mock<any, any>;
      findFirst: jest.Mock<any, any>;
    };
  };

  beforeEach(async () => {
    prismaMock = {
      task: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
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
        deadline: '2024-12-31T23:59:59Z',
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

  describe('listAll', () => {
    it('should return tasks for a user', async () => {
      const userId = '123';
      const mockTasks = [
        { id: 'task1', title: 'Task 1', userId },
        { id: 'task2', title: 'Task 2', userId },
      ];

      prismaMock.task.findMany.mockResolvedValue(mockTasks);

      const result = await service.listAll(userId);

      expect(result).toEqual(mockTasks);
      expect(prismaMock.task.findMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should throw InternalServerErrorException if list fails', async () => {
      const userId = '123';

      prismaMock.task.findMany.mockRejectedValue(new Error('Database error'));

      await expect(service.listAll(userId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getTask', () => {
    it('should return a task successfully', async () => {
      const userId = '123';
      const taskId = 'task123';
      const mockTask = { id: taskId, title: 'Task 1', userId };

      prismaMock.task.findFirst.mockResolvedValue(mockTask);

      const result = await service.getTask(taskId, userId);

      expect(result).toEqual(mockTask);
      expect(prismaMock.task.findFirst).toHaveBeenCalledWith({
        where: { id: taskId, userId },
      });
    });

    it('should throw NotFoundException if task is not found', async () => {
      const userId = '123';
      const taskId = 'task123';

      prismaMock.task.findFirst.mockResolvedValue(null);

      await expect(service.getTask(taskId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw InternalServerErrorException if retrieval fails', async () => {
      const userId = '123';
      const taskId = 'task123';

      prismaMock.task.findFirst.mockRejectedValue(new Error('Database error'));

      await expect(service.getTask(taskId, userId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
