import { Injectable } from '@nestjs/common';

/**
 * Skincare & Cosmetics scoring engine.
 *
 * Weighting (per business plan):
 *   50% — Ingredient safety (comedogenicity, irritancy, endocrine-disruption)
 *   30% — Irritant / allergen risk
 *   20% — Claim transparency
 *
 * Returns a normalised 0–100 score.
 */
@Injectable()
export class SkincareScoringService {
  // TODO: implement scoring logic
}
