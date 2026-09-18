import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { appConfig, databaseConfig, jwtConfig, throttleConfig, redisConfig } from './config';
import { RedisService } from './common/services/redis.service';

// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ScoresModule } from './modules/scores/scores.module';
import { RankingsModule } from './modules/rankings/rankings.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { HealthProfilesModule } from './modules/health-profiles/health-profiles.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { DataCorrectionsModule } from './modules/data-corrections/data-corrections.module';
import { AdminModule } from './modules/admin/admin.module';
import { LegalModule } from './modules/legal/legal.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, throttleConfig, redisConfig],
      envFilePath: '.env',
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
        connectionFactory: (connection) => {
          connection.on('connected', () => console.log('MongoDB connected'));
          connection.on('error', (err) => console.error('MongoDB error:', err));
          return connection;
        },
      }),
      inject: [ConfigService],
    }),

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('throttle.ttl'),
          limit: configService.get<number>('throttle.limit'),
        },
      ],
      inject: [ConfigService],
    }),

    AuthModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    ScoresModule,
    RankingsModule,
    ReviewsModule,
    HealthProfilesModule,
    SubscriptionsModule,
    NotificationsModule,
    DataCorrectionsModule,
    AdminModule,
    LegalModule,
  ],
  providers: [RedisService],
  exports: [RedisService],
})
export class AppModule {}
