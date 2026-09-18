import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Score, ScoreSchema } from '../../database/schemas/score.schema';
import { ScoresService } from './scores.service';
import { ScoresController } from './scores.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: Score.name, schema: ScoreSchema }]), AuthModule],
  providers: [ScoresService],
  controllers: [ScoresController],
  exports: [ScoresService],
})
export class ScoresModule {}
