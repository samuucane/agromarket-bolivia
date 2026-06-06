import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const appUrl = configService.get<string>('APP_URL', 'http://localhost:3001');

  // ─── Security Middleware ─────────────────────────────────────────
  app.use(helmet());
  app.use(cookieParser());
  app.use(compression());

  // ─── CORS ────────────────────────────────────────────────────────
  app.enableCors({
    origin: nodeEnv === 'production' ? [appUrl] : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  });

  // ─── Global Validation Pipe ──────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ─── Global prefix ───────────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ─── Swagger Documentation ───────────────────────────────────────
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('🌾 AgroMarket Bolivia API')
      .setDescription(
        'La primera plataforma agritech integrada de Bolivia. ' +
          'API completa para productores, compradores, proveedores e instituciones financieras.',
      )
      .setVersion('1.0.0')
      .addTag('auth', 'Autenticación y gestión de usuarios')
      .addTag('marketplace', 'Marketplace de productos agrícolas, insumos y maquinaria')
      .addTag('payments', 'Pagos QR, wallets y transacciones')
      .addTag('credit', 'Motor de crédito agrícola y scoring')
      .addTag('farms', 'Farm Manager — Gestión de fincas y cultivos')
      .addTag('certifications', 'Certificaciones y verificaciones')
      .addTag('analytics', 'Analytics y reportes')
      .addTag('notifications', 'Notificaciones multicanal')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
      },
    });

    logger.log(`📚 Swagger docs available at http://localhost:${port}/api/docs`);
  }

  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 AgroMarket API running on port ${port}`);
  logger.log(`🌍 Environment: ${nodeEnv}`);
  logger.log(`📡 API Base URL: http://localhost:${port}/api/v1`);
}

bootstrap();
