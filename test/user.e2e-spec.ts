import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as request from 'supertest';

describe('User Module (e2e)', () => {
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

  it('/user/register (POST) - should register a user', async () => {
    const response = await request(app.getHttpServer())
      .post('/users/register')
      .send({
        email: 'test@example.com',
        password: 'Password123!',
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      message: 'User created successfully',
    });

    const user = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
    });
    expect(user).toBeDefined();
  });

  it('/user/delete (DELETE) - should delete the user successfully', async () => {
    // Cria um usuário
    const createResponse = await request(app.getHttpServer())
      .post('/users/register')
      .send({
        email: 'deleteuser@example.com',
        password: 'Password123!',
      });

    expect(createResponse.status).toBe(201);

    // Autentica o usuário
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'deleteuser@example.com',
        password: 'Password123!',
      });

    expect(loginResponse.status).toBe(200);
    const token = loginResponse.body.access_token;

    // Deletar o usuário
    const deleteResponse = await request(app.getHttpServer())
      .delete('/users/me')
      .set('Authorization', `Bearer ${token}`);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body).toEqual({
      message: 'User deleted successfully',
    });

    // Verificar se o usuário foi deletado
    const user = await prisma.user.findUnique({
      where: { email: 'deleteuser@example.com' },
    });

    expect(user).toBeNull();
  });

  it('/user/me (GET) - should return the user profile', async () => {
    // Primeiro, registre um usuário para obter um token de autenticação
    const registerResponse = await request(app.getHttpServer())
      .post('/users/register')
      .send({
        email: 'profiletest@example.com',
        password: 'Password123!',
      });
    expect(registerResponse.status).toBe(201);

    // Faça login para obter o token JWT
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'profiletest@example.com',
        password: 'Password123!',
      });
    expect(loginResponse.status).toBe(200);
    const token = loginResponse.body.access_token;

    // Faça uma solicitação GET para /users/me com o token de autenticação
    const profileResponse = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${token}`);

    // Verifique se o status e os dados estão corretos
    expect(profileResponse.status).toBe(200);
    expect(profileResponse.body).toEqual({
      id: expect.any(String),
      email: 'profiletest@example.com',
      createdAt: expect.any(String),
    });
  });

  it('/user/register (POST) - should return 409 if user already exists', async () => {
    // Primeiro, registre um usuário normalmente
    await request(app.getHttpServer()).post('/users/register').send({
      email: 'duplicate@example.com',
      password: 'Password123!',
    });

    // Tente registrar o mesmo usuário novamente
    const response = await request(app.getHttpServer())
      .post('/users/register')
      .send({
        email: 'duplicate@example.com', // Mesmo email
        password: 'Password123!', // Mesma senha
      });

    // Validações
    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      error: 'Conflict',
      message: 'User with this email already exists',
      statusCode: 409,
    });
  });

  it('/user/delete (DELETE) - should return 404 if user does not exist', async () => {
    const nonExistentUserId = 'non-existent-id';

    // Crie um token válido para o teste
    const { body: loginResponse } = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'profiletest@example.com',
        password: 'Password123!',
      });

    const token = loginResponse.access_token;

    // Tente deletar um usuário que não existe
    const response = await request(app.getHttpServer())
      .delete(`/users/${nonExistentUserId}`)
      .set('Authorization', `Bearer ${token}`);

    // Validações
    expect(response.status).toBe(404); // Não encontrado
    expect(response.body).toEqual({
      statusCode: 404,
      message: 'Cannot DELETE /users/non-existent-id',
      error: 'Not Found',
    });
  });

  it('/user/me (GET) - should return 401 if no token is provided', async () => {
    // Tente acessar o perfil sem passar o token
    const response = await request(app.getHttpServer()).get('/users/me');

    // Validações
    expect(response.status).toBe(401); // Não autorizado
    expect(response.body).toEqual({
      statusCode: 401,
      message: 'Unauthorized',
    });
  });

  it('/user/me (GET) - should return 401 if token is invalid', async () => {
    // Tente acessar o perfil com um token inválido
    const response = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer invalid-token`);

    // Validações
    expect(response.status).toBe(401); // Não autorizado
    expect(response.body).toEqual({
      statusCode: 401,
      message: 'Unauthorized',
    });
  });
});
