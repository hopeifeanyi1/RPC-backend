// src/main.ts

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // CORS — allow Next.js dev frontend
  app.enableCors({
    origin: ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Renovation Pricing Calculator API')
    .setDescription(
      'API for calculating renovation costs from rooms and materials. ' +
        'Supports Excel file parsing, manual data entry, formula-traced calculations, ' +
        'and PDF report generation.',
    )
    .setVersion('1.0')
    .addTag(
      'upload',
      'Excel file parsing — returns structured data without saving',
    )
    .addTag(
      'project',
      'Project lifecycle: calculate, retrieve, and manage projects',
    )
    .addTag('export', 'PDF report generation for completed projects')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📄 Swagger UI at http://localhost:${port}/api`);
}

bootstrap();
