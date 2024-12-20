import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create_user.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            createUser: jest.fn(),
            deleteUser: jest.fn(),
            getUserById: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(
      UsersService,
    ) as jest.Mocked<UsersService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a user successfully', async () => {
      const dto: CreateUserDto = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      service.createUser.mockResolvedValue({ id: '123' });

      const result = await controller.register(dto);

      expect(result).toEqual({ message: 'User created successfully' });
      expect(service.createUser).toHaveBeenCalledWith(dto.email, dto.password);
    });

    it('should throw ConflictException if email already exists', async () => {
      const dto: CreateUserDto = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      service.createUser.mockRejectedValue(
        new ConflictException('Email already in use'),
      );

      await expect(controller.register(dto)).rejects.toThrow(ConflictException);
      expect(service.createUser).toHaveBeenCalledWith(dto.email, dto.password);
    });
  });

  describe('deleteAccount', () => {
    it('should delete the user successfully', async () => {
      const req = { user: { userId: '123' } };

      service.deleteUser.mockResolvedValue(undefined);

      const result = await controller.deleteAccount(req);

      expect(result).toEqual({ message: 'User deleted successfully' });
      expect(service.deleteUser).toHaveBeenCalledWith(req.user.userId);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      const req = { user: { userId: '123' } };

      service.deleteUser.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(controller.deleteAccount(req)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.deleteUser).toHaveBeenCalledWith(req.user.userId);
    });
  });

  describe('getProfile', () => {
    it('should return user profile successfully', async () => {
      const req = { user: { userId: '123' } };
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        createdAt: new Date(),
      };

      service.getUserById.mockResolvedValue(mockUser);

      const result = await controller.getProfile(req);

      expect(result).toEqual(mockUser);
      expect(service.getUserById).toHaveBeenCalledWith(req.user.userId);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      const req = { user: { userId: '123' } };

      service.getUserById.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(controller.getProfile(req)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.getUserById).toHaveBeenCalledWith(req.user.userId);
    });
  });
});
