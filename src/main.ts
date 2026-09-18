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
  const port    = configService.get<number>('PORT', 3000);

  // Global prefix — exclude legal pages so /privacy and /terms are accessible at root
  app.setGlobalPrefix('api/v1', {
    exclude: ['privacy', 'terms'],
  });

  // Global pipes
  // whitelist: strip unknown fields silently
  // forbidNonWhitelisted: FALSE — mobile clients may send extra device/platform fields;
  //   rejecting them causes confusing 422 errors. Strip unknown fields instead.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    }),
  );

  // Global filters & interceptors
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  // CORS — allow all origins (tighten in production by setting CORS_ORIGIN env var)
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN', '*'),
    credentials: true,
  });

  // Swagger — always enabled so the prod API can be tested via /api/docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Fern API')
    .setDescription("Fern — Know what's really in it. Health product ranking & report API.")
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'access-token',
    )
    .addTag('Auth',             'Authentication & token management')
    .addTag('Users',            'User profiles, favorites, scan history')
    .addTag('Products',         'Product search, lookup, submit')
    .addTag('Categories',       'Category & subcategory browsing')
    .addTag('Scores',           'Health scores & factor breakdowns')
    .addTag('Rankings',         'Category leaderboards')
    .addTag('Health Profiles',  'Personal health profile (allergies, conditions)')
    .addTag('Subscriptions',    'Free / premium subscription management')
    .addTag('Data Corrections', 'Report incorrect product data')
    .addTag('Admin',            'Admin portal APIs')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(port);
  console.log(`🌿 Fern API  →  http://localhost:${port}/api/v1`);
  console.log(`📖 Swagger   →  http://localhost:${port}/api/docs`);
}

bootstrap();
