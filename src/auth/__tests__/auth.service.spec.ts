// Mock bcrypt BEFORE any imports that use it
const mockBcrypt = {
  hash: jest.fn(),
  compare: jest.fn(),
};
jest.mock('bcrypt', () => mockBcrypt);

// At this point, now we can import everything else
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { User } from '../entities/user.entity';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let jwtService: JwtService;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const registerDto: RegisterDto = {
        fullName: 'John Doe',
        email: 'john@example.com',
        birthDate: '1990-01-01',
        password: 'password123',
      };

      const hashedPassword = 'hashedPassword';
      const savedUser = {
        id: 1,
        fullName: 'John Doe',
        email: 'john@example.com',
        birthDate: new Date('1990-01-01'),
        password: hashedPassword,
        balance: 1000.00,
      };

      mockBcrypt.hash.mockResolvedValue(hashedPassword);
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(savedUser);
      mockUserRepository.save.mockResolvedValue(savedUser);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.register(registerDto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'john@example.com' }
      });
      expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        fullName: 'John Doe',
        email: 'john@example.com',
        birthDate: new Date('1990-01-01'),
        password: hashedPassword,
        balance: 1000.00,
      });
      expect(result).toEqual({
        access_token: 'jwt-token',
        user: {
          id: 1,
          fullName: 'John Doe',
          email: 'john@example.com',
          birthDate: '1990-01-01',
          balance: 1000.00,
        },
      });
    });

    it('should throw ConflictException if user already exists', async () => {
      const registerDto: RegisterDto = {
        fullName: 'John Doe',
        email: 'existing@example.com',
        birthDate: '1990-01-01',
        password: 'password123',
      };

      mockUserRepository.findOne.mockResolvedValue({ id: 1, email: 'existing@example.com' });

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'existing@example.com' }
      });
    });
  });

  describe('login', () => {
    it('should successfully login a user', async () => {
      const loginDto: LoginDto = {
        email: 'john@example.com',
        password: 'password123',
      };

      const user = {
        id: 1,
        fullName: 'John Doe',
        email: 'john@example.com',
        birthDate: new Date('1990-01-01'),
        password: 'hashedPassword',
        balance: 1000.00,
      };

      mockBcrypt.compare.mockResolvedValue(true);
      mockUserRepository.findOne.mockResolvedValue(user);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login(loginDto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'john@example.com' }
      });
      expect(mockBcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(result).toEqual({
        access_token: 'jwt-token',
        user: {
          id: 1,
          fullName: 'John Doe',
          email: 'john@example.com',
          birthDate: '1990-01-01',
          balance: 1000.00,
        },
      });
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      const loginDto: LoginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const loginDto: LoginDto = {
        email: 'john@example.com',
        password: 'wrongpassword',
      };

      const user = {
        id: 1,
        email: 'john@example.com',
        password: 'hashedPassword',
      };

      mockBcrypt.compare.mockResolvedValue(false);
      mockUserRepository.findOne.mockResolvedValue(user);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateUser', () => {
    it('should return user if found', async () => {
      const user = { id: 1, email: 'john@example.com' };
      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await service.validateUser(1);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(user);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.validateUser(1)).rejects.toThrow(UnauthorizedException);
    });
  });
});
