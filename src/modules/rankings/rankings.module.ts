import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Ranking, RankingSchema } from '../../database/schemas/ranking.schema';
import { RankingsService } from './rankings.service';
import { RankingsController } from './rankings.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Ranking.name, schema: RankingSchema }])],
  providers: [RankingsService],
  controllers: [RankingsController],
  exports: [RankingsService],
})
export class RankingsModule {}
