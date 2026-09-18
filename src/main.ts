import { NestFactory } from '@nestjs/core';
import { ValidationPipe, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    }),
  );

  // Global filters & interceptors
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  // CORS
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN', '*'),
    credentials: true,
  });

  // Swagger — only in non-production
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Vero API')
      .setDescription("Vero — Know what's really in it. Health product ranking & report API.")
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
        'access-token',
      )
      .addTag('Auth', 'Authentication & token management')
      .addTag('Users', 'User profiles, favorites, scan history')
      .addTag('Products', 'Product search, lookup, submit')
      .addTag('Categories', 'Category & subcategory browsing')
      .addTag('Scores', 'Health scores & factor breakdowns')
      .addTag('Rankings', 'Category leaderboards')
      .addTag('Reviews', 'User product reviews')
      .addTag('Health Profiles', 'Personal health profile (allergies, conditions)')
      .addTag('Subscriptions', 'Free / premium subscription management')
      .addTag('Data Corrections', 'Report incorrect product data')
      .addTag('Admin', 'Admin portal APIs')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });

    console.log(`Swagger docs → http://localhost:${port}/api/docs`);
  }

  await app.listen(port);
  console.log(`Vero API running on http://localhost:${port}/api/v1`);
}

bootstrap();
