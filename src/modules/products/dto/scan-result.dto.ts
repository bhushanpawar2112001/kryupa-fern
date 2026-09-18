/**
 * ScanResultDto — the full response shape for GET /products/barcode/:barcode
 *
 * Everything a mobile client needs to render the product detail screen
 * after a scan: product info, score, grade, plain-language explanation.
 * All fields are typed so Swagger picks them up automatically.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ScoreFactorDto {
  @ApiProperty({ example: 'High protein' })
  label: string;

  @ApiProperty({ enum: ['positive', 'negative'] })
  impact: 'positive' | 'negative';

  @ApiProperty({ example: '+ 24g protein per 100g — good for muscles' })
  reason: string;
}

export class ProductScoreDto {
  @ApiProperty({ example: 82 })
  overallScore: number;

  @ApiProperty({ example: 'B', enum: ['A', 'B', 'C', 'D', 'F'] })
  grade: string;

  @ApiProperty({ example: 'Good', enum: ['Excellent', 'Good', 'Fair', 'Poor'] })
  label: string;

  @ApiProperty({ type: [ScoreFactorDto] })
  factors: ScoreFactorDto[];

  @ApiProperty({ example: ['High-protein diets', 'Post-workout recovery'] })
  goodFor: string[];

  @ApiProperty({ example: ['People with diabetes'] })
  avoidIf: string[];
}

export class PlainSummaryDto {
  @ApiProperty({ example: 'Amul Butter by Amul — a food product.' })
  whatIsThis: string;

  @ApiProperty({ example: 'It has a Nutri-Score of B, which means good nutritional quality.' })
  overview: string;

  @ApiProperty({ type: [String], example: ['High protein — good for muscles.'] })
  goodPoints: string[];

  @ApiProperty({ type: [String], example: ['High in salt — not ideal for high blood pressure.'] })
  watchOut: string[];

  @ApiPropertyOptional({ example: "Amul is India's largest dairy cooperative." })
  brandNote: string | null;

  @ApiProperty({ example: 'A solid choice — fits well into a balanced daily diet.' })
  bottomLine: string;
}

export class NutritionFactDto {
  @ApiProperty({ example: 'Protein' })
  name: string;

  @ApiProperty({ example: '24' })
  value: string;

  @ApiProperty({ example: 'g' })
  unit: string;
}

export class ScanResultDto {
  // ── Identity ──────────────────────────────────────────────────────────────

  @ApiProperty({ example: 'uuid-v4-string' })
  productId: string;

  @ApiProperty({ example: '8901030862013' })
  barcode: string;

  @ApiProperty({ example: 'Amul Butter' })
  name: string;

  @ApiProperty({ example: 'Amul' })
  brand: string;

  @ApiPropertyOptional({ example: 'Salted Butter 500g' })
  description: string | null;

  @ApiProperty({ example: 'food', enum: ['food', 'beauty', 'pharma'] })
  kind: string;

  // ── Category ──────────────────────────────────────────────────────────────

  @ApiProperty({ example: 'category-uuid' })
  categoryId: string;

  // ── Media ─────────────────────────────────────────────────────────────────

  @ApiProperty({ type: [String] })
  images: string[];

  // ── Ingredients & Nutrition ───────────────────────────────────────────────

  @ApiProperty({ type: [String] })
  ingredients: string[];

  @ApiProperty({ type: [NutritionFactDto] })
  nutritionFacts: NutritionFactDto[];

  // ── Health Score ──────────────────────────────────────────────────────────

  @ApiPropertyOptional({ type: ProductScoreDto })
  score: ProductScoreDto | null;

  // ── Plain-language summary ────────────────────────────────────────────────

  @ApiPropertyOptional({ type: PlainSummaryDto })
  summary: PlainSummaryDto | null;

  // ── Extra details ─────────────────────────────────────────────────────────

  @ApiProperty({ type: [String], example: ['dairy allergy', 'lactose intolerance'] })
  allergens: string[];

  @ApiProperty({ type: [String], example: ['high-protein', 'probiotic'] })
  tags: string[];

  @ApiProperty({ example: 'Open Food Facts' })
  dataSource: string;

  @ApiPropertyOptional({ example: 'https://world.openfoodfacts.org/product/8901030862013' })
  dataSourceUrl: string | null;
}
