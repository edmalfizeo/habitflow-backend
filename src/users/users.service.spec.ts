import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(
      PrismaService,
    ) as jest.Mocked<PrismaService>;

    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a user', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: '123',
      email: 'test@example.com',
      password: 'hashed_password',
    });

    const result = await service.createUser('test@example.com', 'password123');
    expect(result).toEqual({ id: '123' });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
    });
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'test@example.com',
        password: 'hashed_password',
      },
    });
  });

  it('should throw ConflictException if email already exists', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: '123',
      email: 'test@example.com',
      password: 'hashed_password',
    });

    await expect(
      service.createUser('test@example.com', 'password123'),
    ).rejects.toThrow(ConflictException);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
    });
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('should throw InternalServerErrorException for unexpected errors', async () => {
    (prisma.user.findUnique as jest.Mock).mockRejectedValue(
      new Error('Unexpected Error'),
    );

    await expect(
      service.createUser('test@example.com', 'password123'),
    ).rejects.toThrow(InternalServerErrorException);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
    });
    expect(prisma.user.create).not.toHaveBeenCalled();
  });
});
