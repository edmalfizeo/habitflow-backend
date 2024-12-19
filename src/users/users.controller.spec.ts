import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { ConflictException } from '@nestjs/common';
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
