import { PlainSummary } from './plain-language';

export type CatalogKind = 'food' | 'beauty' | 'pharma';

export interface CatalogProduct {
  kind: CatalogKind;
  barcode: string;
  name: string;
  brand: string;
  description?: string;
  images: string[];
  ingredients: string[];
  nutritionFacts: { name: string; value: string; unit: string }[];
  tags: string[];
  categoryTags: string[];
  nutriscoreGrade?: string;
  novaGroup?: number;
  additivesCount?: number;
  allergens: string[];
  labels: string[];
  nutriments: Record<string, number>;
  dataSource: string;
  dataSourceUrl: string;
  /** Plain-language summary built at import time — no jargon. */
  humanReadableSummary?: PlainSummary;
  raw: Record<string, unknown>;
}

export interface OffApiResponse {
  status: number;
  code?: string;
  product?: Record<string, any>;
}
