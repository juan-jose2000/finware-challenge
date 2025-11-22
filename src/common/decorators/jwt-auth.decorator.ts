import { UseGuards, applyDecorators } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

export function JwtAuth() {
  return applyDecorators(UseGuards(JwtAuthGuard));
}
