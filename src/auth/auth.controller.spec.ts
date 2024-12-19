import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            validateUser: jest.fn(),
            login: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(
      AuthService,
    ) as jest.Mocked<AuthService>;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return a JWT token when credentials are valid', async () => {
      const mockBody = { email: 'test@example.com', password: 'password123' };
      const mockUser = { id: '123', email: 'test@example.com' };
      const mockToken = { access_token: 'jwt_token' };

      authService.validateUser.mockResolvedValue(mockUser);
      authService.login.mockResolvedValue(mockToken);

      const result = await controller.login(mockBody);

      expect(result).toEqual(mockToken);
      expect(authService.validateUser).toHaveBeenCalledWith(
        mockBody.email,
        mockBody.password,
      );
      expect(authService.login).toHaveBeenCalledWith(mockUser);
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      const mockBody = { email: 'test@example.com', password: 'wrongpassword' };

      authService.validateUser.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(controller.login(mockBody)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(authService.validateUser).toHaveBeenCalledWith(
        mockBody.email,
        mockBody.password,
      );

      expect(authService.login).not.toHaveBeenCalled();
    });
  });
});
