import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from '../entities/user.entity';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  private formatBirthDate(birthDate: Date | string): string {
    const date = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, fullName, birthDate } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user with initial balance
    const user = this.userRepository.create({
      fullName,
      email,
      birthDate: new Date(birthDate),
      password: hashedPassword,
      balance: 1000.00, // Initial balance
    });

    const savedUser = await this.userRepository.save(user);

    // Generate JWT token
    const payload = { email: savedUser.email, sub: savedUser.id };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: savedUser.id,
        fullName: savedUser.fullName,
        email: savedUser.email,
        birthDate: this.formatBirthDate(savedUser.birthDate), // Use helper method
        balance: savedUser.balance,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload = { email: user.email, sub: user.id };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        birthDate: this.formatBirthDate(user.birthDate), // Use helper method
        balance: user.balance,
      },
    };
  }

  async validateUser(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }
}
