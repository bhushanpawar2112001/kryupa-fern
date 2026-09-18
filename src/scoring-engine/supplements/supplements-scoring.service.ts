import { Injectable } from '@nestjs/common';

/**
 * Supplements & Vitamins scoring engine.
 *
 * Weighting (per business plan):
 *   45% — Dosage accuracy vs. clinical guidance
 *   30% — Purity / third-party testing
 *   25% — Interaction & filler risk
 *
 * Returns a normalised 0–100 score.
 */
@Injectable()
export class SupplementsScoringService {
  // TODO: implement scoring logic
}
