import { IsNotEmpty, IsEmail, IsString, IsDateString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'User full name',
    example: 'John Doe'
  })
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john@example.com'
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User birth date',
    example: '1990-01-01'
  })
  @IsNotEmpty()
  @IsDateString()
  birthDate: string;

  @ApiProperty({
    description: 'User password (minimum 6 characters)',
    example: 'securepassword123',
    minLength: 6
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;
}
