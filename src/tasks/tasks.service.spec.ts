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
      update: jest.Mock<any, any>;
      delete: jest.Mock<any, any>;
    };
  };

  beforeEach(async () => {
    prismaMock = {
      task: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
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

  describe('updateTask', () => {
    it('should update a task successfully', async () => {
      const userId = '123';
      const taskId = 'task456';
      const updateData = {
        title: 'Updated Task',
        description: 'Updated Description',
        status: 'completed' as 'pending' | 'completed',
        deadline: '2024-12-31T23:59:59Z',
      };

      const existingTask = {
        id: taskId,
        title: 'Old Task',
        description: 'Old Description',
        status: 'pending',
        deadline: '2024-11-30T23:59:59Z',
        userId,
      };

      prismaMock.task.findFirst.mockResolvedValue(existingTask);
      prismaMock.task.update.mockResolvedValue({
        ...existingTask,
        ...updateData,
      });

      const result = await service.updateTask(taskId, updateData, userId);

      expect(result).toEqual({ ...existingTask, ...updateData });
      expect(prismaMock.task.findFirst).toHaveBeenCalledWith({
        where: { id: taskId, userId },
      });
      expect(prismaMock.task.update).toHaveBeenCalledWith({
        where: { id: taskId },
        data: updateData,
      });
    });

    it('should throw NotFoundException if task does not exist', async () => {
      const userId = '123';
      const taskId = 'task456';
      const updateData = {
        title: 'Updated Task',
        description: 'Updated Description',
        status: 'completed' as 'pending' | 'completed',
        deadline: '2024-12-31T23:59:59Z',
      };

      prismaMock.task.findFirst.mockResolvedValue(null);

      await expect(
        service.updateTask(taskId, updateData, userId),
      ).rejects.toThrow(NotFoundException);

      expect(prismaMock.task.findFirst).toHaveBeenCalledWith({
        where: { id: taskId, userId },
      });
      expect(prismaMock.task.update).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException if Prisma fails during update', async () => {
      const userId = '123';
      const taskId = 'task456';
      const updateData = {
        title: 'Updated Task',
        description: 'Updated Description',
        status: 'completed' as 'pending' | 'completed',
        deadline: '2024-12-31T23:59:59Z',
      };

      prismaMock.task.findFirst.mockResolvedValue({
        id: taskId,
        title: 'Old Task',
        description: 'Old Description',
        status: 'pending',
        deadline: '2024-11-30T23:59:59Z',
        userId,
      });

      prismaMock.task.update.mockRejectedValue(new Error('Database error'));

      await expect(
        service.updateTask(taskId, updateData, userId),
      ).rejects.toThrow(InternalServerErrorException);

      expect(prismaMock.task.update).toHaveBeenCalledWith({
        where: { id: taskId },
        data: updateData,
      });
    });
  });

  describe('deleteTask', () => {
    it('should delete a task successfully', async () => {
      const taskId = 'task123';
      const userId = 'user123';

      prismaMock.task.findFirst.mockResolvedValue({
        id: taskId,
        title: 'Sample Task',
        userId,
      });

      prismaMock.task.delete.mockResolvedValue({
        id: taskId,
        title: 'Sample Task',
        userId,
      });

      const result = await service.deleteTask(taskId, userId);

      expect(result).toEqual({
        id: taskId,
        title: 'Sample Task',
        userId,
      });
      expect(prismaMock.task.findFirst).toHaveBeenCalledWith({
        where: { id: taskId, userId },
      });
      expect(prismaMock.task.delete).toHaveBeenCalledWith({
        where: { id: taskId },
      });
    });

    it('should throw NotFoundException if task does not exist', async () => {
      const taskId = 'task123';
      const userId = 'user123';

      prismaMock.task.findFirst.mockResolvedValue(null);

      await expect(service.deleteTask(taskId, userId)).rejects.toThrow(
        NotFoundException,
      );

      expect(prismaMock.task.findFirst).toHaveBeenCalledWith({
        where: { id: taskId, userId },
      });
      expect(prismaMock.task.delete).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException for Prisma errors during delete', async () => {
      const taskId = 'task123';
      const userId = 'user123';

      prismaMock.task.findFirst.mockResolvedValue({
        id: taskId,
        title: 'Sample Task',
        userId,
      });

      prismaMock.task.delete.mockRejectedValue(new Error('Database error'));

      await expect(service.deleteTask(taskId, userId)).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(prismaMock.task.delete).toHaveBeenCalledWith({
        where: { id: taskId },
      });
    });
  });
});
