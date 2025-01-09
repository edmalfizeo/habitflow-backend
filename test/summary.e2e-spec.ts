import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as request from 'supertest';

describe('Summary Module (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('/summary/general (GET) - should return general summary successfully', async () => {
    // Cria um usuário e autentica
    await request(app.getHttpServer())
      .post('/users/register')
      .send({ email: 'summarytest@example.com', password: 'Password123!' });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'summarytest@example.com', password: 'Password123!' });

    const token = loginResponse.body.access_token;

    // Busca o ID do usuário
    const user = await prisma.user.findFirst({
      where: { email: 'summarytest@example.com' },
    });

    if (!user) {
      throw new Error('User not found in the database');
    }

    const userId = user.id;

    // Seed tasks para o usuário
    await prisma.task.createMany({
      data: [
        {
          title: 'Task 1',
          description: 'First task',
          status: 'completed',
          userId,
        },
        {
          title: 'Task 2',
          description: 'Second task',
          status: 'pending',
          userId,
        },
      ],
    });

    const response = await request(app.getHttpServer())
      .get('/summary/general')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      completedTasks: 1,
      totalTasks: 2,
      pendingTasks: 1,
      completedRate: 50,
    });
  });

  it('/summary/general (GET) - should return 401 if no token is provided', async () => {
    const response = await request(app.getHttpServer()).get('/summary/general');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      statusCode: 401,
      message: 'Unauthorized',
    });
  });

  it('/summary/general (GET) - should return 401 if an invalid token is provided', async () => {
    const response = await request(app.getHttpServer())
      .get('/summary/general')
      .set('Authorization', 'Bearer invalid_token');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      statusCode: 401,
      message: 'Unauthorized',
    });
  });
});
