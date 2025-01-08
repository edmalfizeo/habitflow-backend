import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as request from 'supertest';
import * as bcrypt from 'bcrypt';

describe('Auth Module (e2e)', () => {
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

  beforeEach(async () => {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "User" CASCADE;`);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    await prisma.user.deleteMany(); // Limpa o banco antes de cada teste
  });

  it('/auth/login (POST) - should login successfully', async () => {
    // Registra um usuário para teste
    const hashedPassword = bcrypt.hashSync('Password123!', 10);
    await prisma.user.create({
      data: {
        email: 'login-test@example.com',
        password: hashedPassword,
      },
    });

    // Faz login
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'login-test@example.com',
        password: 'Password123!',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('access_token');
    expect(typeof response.body.access_token).toBe('string');
  });

  it('/auth/login (POST) - should return 404 if email is not found', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'Password123!',
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      statusCode: 401,
      message: 'Invalid credentials',
      error: 'Unauthorized',
    });
  });

  it('/auth/login (POST) - should return 401 if password is incorrect', async () => {
    // Registra um usuário para teste
    await prisma.user.create({
      data: {
        email: 'test-password@example.com',
        password: 'hashedpassword123',
      },
    });

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test-password@example.com',
        password: 'WrongPassword123!',
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      statusCode: 401,
      message: 'Invalid credentials',
      error: 'Unauthorized',
    });
  });

  it('/auth/login (POST) - should return 400 if email or password is missing', async () => {
    // Sem email
    let response = await request(app.getHttpServer()).post('/auth/login').send({
      password: 'Password123!',
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('Email and password are required');

    // Sem senha
    response = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'missingpassword@example.com',
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('Email and password are required');
  });
});
