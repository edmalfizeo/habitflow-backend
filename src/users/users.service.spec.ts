import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let prismaMock: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prismaMock = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a user', async () => {
      const hashedPassword = 'hashed_password';
      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword);

      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        id: '123',
        email: 'test@example.com',
        password: hashedPassword,
      });

      const result = await service.createUser(
        'test@example.com',
        'password123',
      );

      expect(result).toEqual({ id: '123' });

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          password: hashedPassword,
        },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    });

    it('should throw ConflictException if email already exists', async () => {
      (prismaMock.user.findUnique as jest.Mock).mockResolvedValue({
        id: '123',
        email: 'test@example.com',
        password: 'hashed_password',
      });

      await expect(
        service.createUser('test@example.com', 'password123'),
      ).rejects.toThrow(ConflictException);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException for unexpected errors', async () => {
      (prismaMock.user.findUnique as jest.Mock).mockRejectedValue(
        new Error('Unexpected Error'),
      );

      await expect(
        service.createUser('test@example.com', 'password123'),
      ).rejects.toThrow(InternalServerErrorException);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    it('should delete a user successfully', async () => {
      const userId = '123';
      prismaMock.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'test@example.com',
      });
      prismaMock.user.delete.mockResolvedValue(undefined);

      await service.deleteUser(userId);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(prismaMock.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });

    it('should throw NotFoundException if user does not exist', async () => {
      const userId = '123';
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.deleteUser(userId)).rejects.toThrow(
        NotFoundException,
      );

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(prismaMock.user.delete).not.toHaveBeenCalled();
    });
  });
});
