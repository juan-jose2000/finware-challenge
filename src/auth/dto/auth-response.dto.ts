import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  access_token: string;

  @ApiProperty({
    description: 'User information',
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      fullName: { type: 'string', example: 'John Doe' },
      email: { type: 'string', example: 'john@example.com' },
      birthDate: { type: 'string', example: '1990-01-01' },
      balance: { type: 'number', example: 1000.00 }
    }
  })
  user: {
    id: number;
    fullName: string;
    email: string;
    birthDate: string;
    balance: number;
  };
}