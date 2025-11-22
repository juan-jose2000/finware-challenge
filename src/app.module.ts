import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).hostname : 'localhost',
      port: process.env.DATABASE_URL ? parseInt(new URL(process.env.DATABASE_URL).port) : 5432,
      username: process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).username : 'user',
      password: process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).password : 'password',
      database: process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).pathname.slice(1) : 'finware',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // Set to false in production
      logging: true,
    }),
    AuthModule,
  ],
})
export class AppModule {}
