import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthProfile, HealthProfileSchema } from '../../database/schemas/health-profile.schema';
import { HealthProfilesService } from './health-profiles.service';
import { HealthProfilesController } from './health-profiles.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: HealthProfile.name, schema: HealthProfileSchema }]),
    AuthModule,
  ],
  providers: [HealthProfilesService],
  controllers: [HealthProfilesController],
  exports: [HealthProfilesService],
})
export class HealthProfilesModule {}
