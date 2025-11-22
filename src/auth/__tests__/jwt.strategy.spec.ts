import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { AuthService } from '../services/auth.service';
import { User } from '../entities/user.entity';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let authService: AuthService;

  const mockAuthService = {
    validateUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should return user if validation succeeds', async () => {
      const payload = { sub: 1, email: 'john@example.com' };
      const user: User = {
        id: 1,
        fullName: 'John Doe',
        email: 'john@example.com',
        birthDate: new Date(),
        password: 'hashed',
        balance: 1000.00,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuthService.validateUser.mockResolvedValue(user);

      const result = await strategy.validate(payload);

      expect(mockAuthService.validateUser).toHaveBeenCalledWith(1);
      expect(result).toEqual(user);
    });

    it('should throw UnauthorizedException if validation fails', async () => {
      const payload = { sub: 1, email: 'john@example.com' };

      mockAuthService.validateUser.mockRejectedValue(new UnauthorizedException());

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
    });
  });
});
