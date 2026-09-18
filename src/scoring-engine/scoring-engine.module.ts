import { Module } from '@nestjs/common';
import { FoodScoringService } from './food/food-scoring.service';
import { SkincareScoringService } from './skincare/skincare-scoring.service';
import { SupplementsScoringService } from './supplements/supplements-scoring.service';

@Module({
  providers: [FoodScoringService, SkincareScoringService, SupplementsScoringService],
  exports: [FoodScoringService, SkincareScoringService, SupplementsScoringService],
})
export class ScoringEngineModule {}
