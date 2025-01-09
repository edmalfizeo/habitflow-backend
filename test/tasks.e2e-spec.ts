import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as request from 'supertest';

describe('Tasks Module (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  describe('Tasks Module (E2E) - Positive cases', () => {
    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      prisma = moduleFixture.get<PrismaService>(PrismaService);
      await app.init();

      await prisma.task.deleteMany();
      await prisma.user.deleteMany();
    });

    afterAll(async () => {
      await prisma.$disconnect();
      await app.close();
    });

    it('/tasks (POST) - should create a task successfully', async () => {
      await request(app.getHttpServer()).post('/users/register').send({
        email: 'tasktest@example.com',
        password: 'Password123!',
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'tasktest@example.com',
          password: 'Password123!',
        });

      const token = loginResponse.body.access_token;

      const response = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'New Task',
          description: 'Task for testing',
          status: 'pending',
          deadline: '2025-01-01T00:00:00.000Z',
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        message: 'Task created successfully',
        task: {
          id: expect.any(String),
          title: 'New Task',
          description: 'Task for testing',
          status: 'pending',
          deadline: '2025-01-01T00:00:00.000Z',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          userId: expect.any(String),
        },
      });
    });

    it('/tasks (GET) - should return all tasks for the authenticated user', async () => {
      // Cria um usuário e faz login
      const registerResponse = await request(app.getHttpServer())
        .post('/users/register')
        .send({
          email: 'gettasks@example.com',
          password: 'Password123!',
        });
      expect(registerResponse.status).toBe(201);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'gettasks@example.com',
          password: 'Password123!',
        });
      expect(loginResponse.status).toBe(200);

      const token = loginResponse.body.access_token;

      // Obtém o ID do usuário criado
      const user = await prisma.user.findUnique({
        where: { email: 'gettasks@example.com' },
      });
      expect(user).toBeDefined();

      // Cria algumas tarefas associadas ao usuário
      await prisma.task.createMany({
        data: [
          { title: 'Task 1', description: 'First task', userId: user!.id },
          { title: 'Task 2', description: 'Second task', userId: user!.id },
        ],
      });

      // Faz a requisição
      const response = await request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.tasks).toHaveLength(2);
      expect(response.body.tasks[0].title).toBe('Task 1');
      expect(response.body.tasks[1].title).toBe('Task 2');
    });

    it('/tasks/:id (GET) - should return a specific task for the authenticated user', async () => {
      // Cria um usuário e faz login
      const registerResponse = await request(app.getHttpServer())
        .post('/users/register')
        .send({
          email: 'gettask@example.com',
          password: 'Password123!',
        });
      expect(registerResponse.status).toBe(201);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'gettask@example.com',
          password: 'Password123!',
        });
      expect(loginResponse.status).toBe(200);

      const token = loginResponse.body.access_token;

      // Obtém o ID do usuário criado
      const user = await prisma.user.findUnique({
        where: { email: 'gettask@example.com' },
      });
      expect(user).toBeDefined();

      // Cria uma tarefa associada ao usuário
      const createdTask = await prisma.task.create({
        data: {
          title: 'Specific Task',
          description: 'Testing specific task retrieval',
          status: 'pending',
          deadline: '2025-01-15T23:59:59.999Z',
          userId: user!.id,
        },
      });

      // Faz a requisição para obter a tarefa
      const response = await request(app.getHttpServer())
        .get(`/tasks/${createdTask.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.task).toBeDefined();
      expect(response.body.task.id).toBe(createdTask.id);
      expect(response.body.task.title).toBe('Specific Task');
      expect(response.body.task.description).toBe(
        'Testing specific task retrieval',
      );
    });

    it('/tasks/:id (PATCH) - should update a task successfully', async () => {
      // Cria um usuário e faz login
      const registerResponse = await request(app.getHttpServer())
        .post('/users/register')
        .send({
          email: 'updatetask@example.com',
          password: 'Password123!',
        });
      expect(registerResponse.status).toBe(201);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'updatetask@example.com',
          password: 'Password123!',
        });
      expect(loginResponse.status).toBe(200);

      const token = loginResponse.body.access_token;

      // Cria uma tarefa associada ao usuário
      const user = await prisma.user.findUnique({
        where: { email: 'updatetask@example.com' },
      });
      expect(user).toBeDefined();

      const createdTask = await prisma.task.create({
        data: {
          title: 'Task to Update',
          description: 'Original Description',
          status: 'pending',
          deadline: '2025-01-15T23:59:59.999Z',
          userId: user!.id,
        },
      });

      // Faz a requisição para atualizar a tarefa
      const updateResponse = await request(app.getHttpServer())
        .patch(`/tasks/${createdTask.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Updated Task Title',
          description: 'Updated Description',
          status: 'completed',
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.message).toBe('Task updated successfully');
      expect(updateResponse.body.task).toEqual({
        id: createdTask.id,
        title: 'Updated Task Title',
        description: 'Updated Description',
        status: 'completed',
        deadline: '2025-01-15T23:59:59.999Z',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        userId: user!.id,
      });

      // Verifica se a tarefa foi atualizada no banco
      const updatedTask = await prisma.task.findUnique({
        where: { id: createdTask.id },
      });
      expect(updatedTask).toBeDefined();
      expect(updatedTask!.title).toBe('Updated Task Title');
      expect(updatedTask!.description).toBe('Updated Description');
      expect(updatedTask!.status).toBe('completed');
    });

    it('/tasks/:id (DELETE) - should delete a task successfully', async () => {
      // Cria um usuário
      const registerResponse = await request(app.getHttpServer())
        .post('/users/register')
        .send({
          email: 'deletetask@example.com',
          password: 'Password123!',
        });
      expect(registerResponse.status).toBe(201);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'deletetask@example.com',
          password: 'Password123!',
        });
      expect(loginResponse.status).toBe(200);

      const token = loginResponse.body.access_token;

      // Cria uma tarefa
      const createTaskResponse = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Task to Delete',
          description: 'This task will be deleted',
          status: 'pending',
          deadline: '2025-01-15T23:59:59.999Z',
        });

      expect(createTaskResponse.status).toBe(201);
      const taskId = createTaskResponse.body.task.id;

      // Deleta a tarefa criada
      const deleteResponse = await request(app.getHttpServer())
        .delete(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body).toEqual({
        message: 'Task deleted successfully',
      });

      // Verifica se a tarefa foi removida do banco
      const deletedTask = await prisma.task.findUnique({
        where: { id: taskId },
      });

      expect(deletedTask).toBeNull();
    });
  });

  describe('Tasks Module (E2E) - Negative Scenarios', () => {
    beforeEach(async () => {
      await prisma.task.deleteMany();
      await prisma.user.deleteMany();
    });

    afterAll(async () => {
      await prisma.task.deleteMany();
      await prisma.user.deleteMany();

      await prisma.$disconnect();
      await app.close();
    });

    // Teste: Criar tarefa sem autenticação
    it('/tasks (POST) - should return 401 if no token is provided', async () => {
      const response = await request(app.getHttpServer()).post('/tasks').send({
        title: 'Unauthorized Task',
        description: 'This should fail',
        status: 'pending',
        deadline: '2025-01-15T23:59:59.999Z',
      });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        statusCode: 401,
        message: 'Unauthorized',
      });
    });

    // Teste: Criar tarefa com dados inválidos
    it('/tasks (POST) - should return 400 for invalid task data', async () => {
      const registerResponse = await request(app.getHttpServer())
        .post('/users/register')
        .send({
          email: 'invaliddata@example.com',
          password: 'Password123!',
        });
      expect(registerResponse.status).toBe(201);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'invaliddata@example.com',
          password: 'Password123!',
        });
      expect(loginResponse.status).toBe(200);

      const token = loginResponse.body.access_token;

      const response = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: '', // Título inválido
          status: 'pending',
        });

      expect(response.status).toBe(400); // Agora retorna 400 devido à BadRequestException
      expect(response.body).toHaveProperty('message'); // Verifica se a mensagem está presente
      expect(response.body.message).toContainEqual({
        code: 'too_small',
        minimum: 1,
        type: 'string',
        inclusive: true,
        exact: false,
        message: 'Title is required',
        path: ['title'],
      });
    });

    // Teste: Atualizar tarefa que não pertence ao usuário
    it('/tasks/:id (PATCH) - should return 404 if task does not exist for user', async () => {
      const registerResponse = await request(app.getHttpServer())
        .post('/users/register')
        .send({
          email: 'notfound@example.com',
          password: 'Password123!',
        });
      expect(registerResponse.status).toBe(201);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'notfound@example.com',
          password: 'Password123!',
        });
      expect(loginResponse.status).toBe(200);

      const token = loginResponse.body.access_token;

      const response = await request(app.getHttpServer())
        .patch('/tasks/nonexistent-task-id')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Updated Task Title',
        });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        error: 'Not Found',
        message: 'Task not found',
      });
    });

    // Teste: Deletar tarefa sem autenticação
    it('/tasks/:id (DELETE) - should return 401 if no token is provided', async () => {
      const response = await request(app.getHttpServer()).delete(
        '/tasks/some-task-id',
      );

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        statusCode: 401,
        message: 'Unauthorized',
      });
    });

    // Teste: Deletar tarefa que não pertence ao usuário
    it('/tasks/:id (DELETE) - should return 404 if task does not exist for user', async () => {
      const registerResponse = await request(app.getHttpServer())
        .post('/users/register')
        .send({
          email: 'deleteother@example.com',
          password: 'Password123!',
        });
      expect(registerResponse.status).toBe(201);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'deleteother@example.com',
          password: 'Password123!',
        });
      expect(loginResponse.status).toBe(200);

      const token = loginResponse.body.access_token;

      const response = await request(app.getHttpServer())
        .delete('/tasks/nonexistent-task-id')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        error: 'Not Found',
        message: 'Task not found',
      });
    });

    // Teste: Listar tarefas sem autenticação
    it('/tasks (GET) - should return 401 if no token is provided', async () => {
      const response = await request(app.getHttpServer()).get('/tasks');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        statusCode: 401,
        message: 'Unauthorized',
      });
    });

    // Teste: Buscar tarefa específica sem autenticação
    it('/tasks/:id (GET) - should return 401 if no token is provided', async () => {
      const response = await request(app.getHttpServer()).get(
        '/tasks/some-task-id',
      );

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        statusCode: 401,
        message: 'Unauthorized',
      });
    });

    // Teste: Buscar tarefa inexistente
    it('/tasks/:id (GET) - should return 404 if task does not exist', async () => {
      const registerResponse = await request(app.getHttpServer())
        .post('/users/register')
        .send({
          email: 'getnotfound@example.com',
          password: 'Password123!',
        });
      expect(registerResponse.status).toBe(201);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'getnotfound@example.com',
          password: 'Password123!',
        });
      expect(loginResponse.status).toBe(200);

      const token = loginResponse.body.access_token;

      const response = await request(app.getHttpServer())
        .get('/tasks/nonexistent-task-id')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        error: 'Not Found',
        message: 'Task not found',
      });
    });
  });
});
