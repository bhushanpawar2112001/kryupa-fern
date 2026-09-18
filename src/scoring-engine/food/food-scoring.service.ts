import { Injectable } from '@nestjs/common';

/**
 * Food & Groceries scoring engine.
 *
 * Weighting (per business plan):
 *   40% — Nutrition density
 *   35% — Additives / processing (NOVA-style)
 *   25% — Allergen & label honesty
 *
 * Returns a normalised 0–100 score.
 */
@Injectable()
export class FoodScoringService {
  // TODO: implement scoring logic
}
