import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable global validation pipes
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  // Enable CORS for development
  app.enableCors();

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Finware Investment Platform API')
    .setDescription('A comprehensive fintech investment platform with AI-powered market analysis')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('opportunities', 'Investment opportunities management')
    .addTag('investments', 'Investment transactions')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name here is important for matching up with @ApiBearerAuth() in your controller!
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  await app.listen(4000);
  console.log('Application is running on: http://localhost:4000');
  console.log('Swagger documentation: http://localhost:4000/api');
}
bootstrap();
