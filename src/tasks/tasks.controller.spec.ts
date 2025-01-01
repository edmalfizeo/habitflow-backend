import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { createTaskSchema } from './dto/create_task.dto';
import { NotFoundException } from '@nestjs/common';

describe('TasksController', () => {
  let controller: TasksController;
  let service: jest.Mocked<TasksService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: {
            create: jest.fn(),
            listAll: jest.fn(),
            getTask: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
    service = module.get<TasksService>(
      TasksService,
    ) as jest.Mocked<TasksService>;
  });

  describe('createTask', () => {
    it('should create a task successfully', async () => {
      const req = { user: { userId: '123' } };
      const body = {
        title: 'Learn Zod',
        description: 'Implement Zod validation',
        status: 'pending',
        deadline: '2024-12-31T23:59:59Z',
      };

      const parsedData = createTaskSchema.parse(body);

      const mockTask = {
        id: 'task123',
        title: parsedData.title,
        description: parsedData.description,
        status: parsedData.status,
        deadline: new Date(parsedData.deadline),
        userId: req.user.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      service.create.mockResolvedValue(mockTask);

      const result = await controller.createTask(req, body);

      expect(result).toEqual({
        message: 'Task created successfully',
        task: mockTask,
      });
      expect(service.create).toHaveBeenCalledWith(parsedData, req.user.userId);
    });
  });

  describe('listAllTasks', () => {
    it('should return all tasks for the user', async () => {
      const req = { user: { userId: '123' } };
      const mockTasks = [
        {
          id: 'task1',
          title: 'Task 1',
          description: 'Description 1',
          status: 'pending',
          deadline: new Date('2024-12-31T23:59:59Z'),
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: '123',
        },
        {
          id: 'task2',
          title: 'Task 2',
          description: 'Description 2',
          status: 'pending',
          deadline: new Date('2024-12-31T23:59:59Z'),
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: '123',
        },
      ];

      service.listAll.mockResolvedValue(mockTasks);

      const result = await controller.listAllTasks(req);

      expect(result).toEqual({ tasks: mockTasks });
      expect(service.listAll).toHaveBeenCalledWith('123');
    });

    it('should handle service errors', async () => {
      const req = { user: { userId: '123' } };
      service.listAll.mockRejectedValue(new Error('Database error'));

      await expect(controller.listAllTasks(req)).rejects.toThrowError(
        'Database error',
      );
    });
  });

  describe('getTask', () => {
    it('should return the specified task', async () => {
      const req = { user: { userId: '123' }, params: { id: 'task123' } };
      const mockTask = {
        id: 'task123',
        title: 'Task 1',
        description: 'Description 1',
        status: 'pending',
        deadline: new Date('2024-12-31T23:59:59Z'),
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: '123',
      };

      service.getTask.mockResolvedValue(mockTask);

      const result = await controller.getTask(req);

      expect(result).toEqual({ task: mockTask });
      expect(service.getTask).toHaveBeenCalledWith('task123', '123');
    });

    it('should throw NotFoundException if task is not found', async () => {
      const req = { user: { userId: '123' }, params: { id: 'task123' } };

      service.getTask.mockRejectedValue(
        new NotFoundException('Task not found'),
      );

      await expect(controller.getTask(req)).rejects.toThrow(NotFoundException);
    });

    it('should handle other service errors', async () => {
      const req = { user: { userId: '123' }, params: { id: 'task123' } };

      service.getTask.mockRejectedValue(new Error('Database error'));

      await expect(controller.getTask(req)).rejects.toThrowError(
        'Database error',
      );
    });
  });
});
