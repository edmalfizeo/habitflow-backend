import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(
      UsersService,
    ) as jest.Mocked<UsersService>;
    jwtService = module.get<JwtService>(JwtService) as jest.Mocked<JwtService>;

    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user data if credentials are valid', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        password: 'hashed_password',
      };

      usersService.findByEmail.mockResolvedValue(mockUser);

      jest
        .spyOn<any, any>(authService, 'comparePasswords')
        .mockImplementation(async () => true);

      const result = await authService.validateUser(
        'test@example.com',
        'password123',
      );

      expect(result).toEqual({ id: '123', email: 'test@example.com' });
      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        authService.validateUser('test@example.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        password: 'hashed_password',
      };

      usersService.findByEmail.mockResolvedValue(mockUser);

      jest
        .spyOn<any, any>(authService, 'validateUser')
        .mockImplementation(async () => {
          throw new UnauthorizedException('Invalid credentials');
        });

      await expect(
        authService.validateUser('test@example.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should return a JWT token', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      const mockToken = 'jwt_token';

      jwtService.sign.mockReturnValue(mockToken);

      const result = await authService.login(mockUser);
      expect(result).toEqual({ access_token: mockToken });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
    });
  });
});
