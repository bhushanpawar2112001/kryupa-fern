import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  DataCorrection,
  DataCorrectionSchema,
} from '../../database/schemas/data-correction.schema';
import { DataCorrectionsService } from './data-corrections.service';
import { DataCorrectionsController } from './data-corrections.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: DataCorrection.name, schema: DataCorrectionSchema }]),
    AuthModule,
  ],
  providers: [DataCorrectionsService],
  controllers: [DataCorrectionsController],
  exports: [DataCorrectionsService],
})
export class DataCorrectionsModule {}
