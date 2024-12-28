import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { createTaskSchema } from './dto/create_task.dto';

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
});
