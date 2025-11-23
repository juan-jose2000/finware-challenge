import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../services/auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private authService: AuthService) {
    const jwtSecret = process.env.JWT_SECRET || 'finware-jwt-secret-key-2025-very-secure';
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
    
    this.logger.log(`JWT Strategy initialized with secret: ${jwtSecret.substring(0, 10)}...`);
    this.logger.log(`JWT_SECRET env var: ${process.env.JWT_SECRET ? 'SET' : 'NOT SET'}`);
  }

  async validate(payload: any) {
    this.logger.log(`🔍 JWT Validation - Payload:`, payload);
    this.logger.log(`🔍 JWT Validation - User ID: ${payload.sub}`);
    
    try {
      const user = await this.authService.validateUser(payload.sub);
      if (!user) {
        this.logger.error(`❌ User not found for ID: ${payload.sub}`);
        throw new UnauthorizedException('User not found');
      }
      
      this.logger.log(`✅ JWT validation successful for user: ${user.email}`);
      return user;
    } catch (error) {
      this.logger.error(`❌ JWT validation failed:`, error.message);
      throw error;
    }
  }
}
