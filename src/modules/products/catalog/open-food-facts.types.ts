export type CatalogKind = 'food' | 'beauty';

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
  raw: Record<string, unknown>;
}

export interface OffApiResponse {
  status: number;
  code?: string;
  product?: Record<string, any>;
}
