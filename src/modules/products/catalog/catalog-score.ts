import { LetterGrade, ScoreLabel } from '../../../database/schemas/score.schema';
import { CatalogProduct } from './open-food-facts.types';

export interface CatalogScoreResult {
  overallScore: number;
  grade: LetterGrade;
  label: ScoreLabel;
  factors: {
    key: string;
    label: string;
    impact: 'positive' | 'negative';
    points: number;
    reason: string;
    detail?: string;
    citationSource?: string;
    citationUrl?: string;
  }[];
  avoidIf: string[];
  goodFor: string[];
  scoringEngineVersion: string;
}

function gradeLabel(score: number): { grade: LetterGrade; label: ScoreLabel } {
  if (score >= 90) return { grade: LetterGrade.A, label: ScoreLabel.EXCELLENT };
  if (score >= 80) return { grade: LetterGrade.B, label: ScoreLabel.EXCELLENT };
  if (score >= 65) return { grade: LetterGrade.C, label: ScoreLabel.GOOD };
  if (score >= 50) return { grade: LetterGrade.D, label: ScoreLabel.FAIR };
  return { grade: LetterGrade.F, label: ScoreLabel.POOR };
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

const NUTRISCORE_BASE: Record<string, number> = {
  a: 92,
  b: 78,
  c: 62,
  d: 45,
  e: 28,
};

export function scoreFromCatalog(catalog: CatalogProduct): CatalogScoreResult {
  const factors: CatalogScoreResult['factors'] = [];
  const avoidIf: string[] = [];
  const goodFor: string[] = [];
  const cite = catalog.dataSource;
  const url = catalog.dataSourceUrl;

  let score =
    catalog.kind === 'food'
      ? NUTRISCORE_BASE[catalog.nutriscoreGrade ?? ''] ?? 58
      : 64;

  if (catalog.nutriscoreGrade) {
    const grade = catalog.nutriscoreGrade.toUpperCase();
    const positive = ['a', 'b'].includes(catalog.nutriscoreGrade);
    factors.push({
      key: 'nutriscore',
      label: `Nutri-Score ${grade}`,
      impact: positive ? 'positive' : 'negative',
      points: positive ? 12 : -10,
      reason: positive
        ? `+ Nutri-Score ${grade} — stronger nutrition profile`
        : `− Nutri-Score ${grade} — weaker nutrition profile`,
      detail: 'Nutri-Score is computed by Open Food Facts from the nutrition facts label.',
      citationSource: cite,
      citationUrl: url,
    });
  }

  if (catalog.novaGroup) {
    const nova = catalog.novaGroup;
    const delta = nova === 1 ? 8 : nova === 2 ? 3 : nova === 3 ? -6 : -12;
    score += delta;
    factors.push({
      key: 'nova',
      label: `NOVA ${nova}`,
      impact: delta >= 0 ? 'positive' : 'negative',
      points: delta,
      reason:
        nova <= 2
          ? `+ Minimally processed (NOVA ${nova})`
          : `− Ultra-processed (NOVA ${nova})`,
      citationSource: cite,
      citationUrl: url,
    });
  }

  if (catalog.additivesCount != null) {
    if (catalog.additivesCount === 0) {
      score += 6;
      factors.push({
        key: 'additives',
        label: 'No additives',
        impact: 'positive',
        points: 6,
        reason: '+ No additives reported',
        citationSource: cite,
      });
    } else if (catalog.additivesCount >= 4) {
      score -= 8;
      factors.push({
        key: 'additives',
        label: 'Additives',
        impact: 'negative',
        points: -8,
        reason: `− ${catalog.additivesCount} additives reported`,
        citationSource: cite,
      });
    }
  }

  const sugars = catalog.nutriments['sugars_100g'];
  if (sugars != null) {
    if (sugars >= 15) {
      score -= 10;
      factors.push({
        key: 'sugar',
        label: 'High sugar',
        impact: 'negative',
        points: -10,
        reason: `− ${sugars}g sugar per 100g`,
      });
    } else if (sugars <= 5) {
      score += 5;
      factors.push({
        key: 'sugar',
        label: 'Low sugar',
        impact: 'positive',
        points: 5,
        reason: `+ Only ${sugars}g sugar per 100g`,
      });
    }
  }

  const fiber = catalog.nutriments['fiber_100g'];
  if (fiber != null && fiber >= 5) {
    score += 6;
    factors.push({
      key: 'fiber',
      label: 'High fiber',
      impact: 'positive',
      points: 6,
      reason: `+ ${fiber}g fiber per 100g`,
    });
    goodFor.push('Digestive health');
  }

  const protein = catalog.nutriments['proteins_100g'];
  if (protein != null && protein >= 10) {
    score += 6;
    factors.push({
      key: 'protein',
      label: 'High protein',
      impact: 'positive',
      points: 6,
      reason: `+ ${protein}g protein per 100g`,
    });
    goodFor.push('High-protein diets');
  }

  const salt = catalog.nutriments['salt_100g'];
  if (salt != null && salt >= 1.5) {
    score -= 7;
    factors.push({
      key: 'salt',
      label: 'High salt',
      impact: 'negative',
      points: -7,
      reason: `− ${salt}g salt per 100g`,
    });
    avoidIf.push('People watching sodium intake');
  }

  if (catalog.kind === 'beauty') {
    const count = catalog.ingredients.length;
    if (count > 0 && count <= 12) {
      score += 6;
      factors.push({
        key: 'formula',
        label: 'Short formula',
        impact: 'positive',
        points: 6,
        reason: `+ ${count} ingredients — shorter formula`,
      });
    } else if (count >= 25) {
      score -= 5;
      factors.push({
        key: 'formula',
        label: 'Long formula',
        impact: 'negative',
        points: -5,
        reason: `− ${count} ingredients listed`,
      });
    }
    if (catalog.labels.some((l) => /organic|vegan|fragrance-free/i.test(l))) {
      score += 5;
      goodFor.push('Clean-beauty shoppers');
    }
  }

  for (const allergen of catalog.allergens.slice(0, 8)) {
    avoidIf.push(`${allergen} allergy`);
  }

  if (!factors.length) {
    factors.push({
      key: 'source',
      label: 'Catalog data',
      impact: 'positive',
      points: 0,
      reason: `Product data from ${catalog.dataSource}`,
      citationSource: cite,
      citationUrl: url,
    });
  }

  const overallScore = clamp(score);
  return {
    overallScore,
    ...gradeLabel(overallScore),
    factors,
    avoidIf: [...new Set(avoidIf)],
    goodFor: [...new Set(goodFor)],
    scoringEngineVersion: 'off-1.0',
  };
}
