import { CatalogKind, CatalogProduct } from './open-food-facts.types';

const NUTRIMENT_FIELDS: { key: string; name: string; unit: string }[] = [
  { key: 'energy-kcal_100g', name: 'Calories', unit: 'kcal' },
  { key: 'fat_100g', name: 'Fat', unit: 'g' },
  { key: 'saturated-fat_100g', name: 'Saturated fat', unit: 'g' },
  { key: 'carbohydrates_100g', name: 'Carbohydrates', unit: 'g' },
  { key: 'sugars_100g', name: 'Sugars', unit: 'g' },
  { key: 'fiber_100g', name: 'Fiber', unit: 'g' },
  { key: 'proteins_100g', name: 'Protein', unit: 'g' },
  { key: 'salt_100g', name: 'Salt', unit: 'g' },
  { key: 'sodium_100g', name: 'Sodium', unit: 'g' },
];

function firstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function splitList(text: string): string[] {
  return text
    .split(/[,;\n]/)
    .map((part) => part.replace(/^[-•\s]+/, '').trim())
    .filter((part) => part.length > 1 && part.length < 120);
}

function parseIngredients(product: Record<string, any>): string[] {
  if (Array.isArray(product.ingredients) && product.ingredients.length) {
    const named = product.ingredients
      .map((item: any) => firstString(item.text, item.id?.replace(/^en:/, '')))
      .filter(Boolean);
    if (named.length) return named;
  }
  return splitList(firstString(product.ingredients_text_en, product.ingredients_text));
}

function parseNutriments(product: Record<string, any>): Record<string, number> {
  const src = product.nutriments ?? {};
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(src)) {
    if (typeof value === 'number' && Number.isFinite(value)) out[key] = value;
  }
  return out;
}

function nutritionFacts(nutriments: Record<string, number>) {
  return NUTRIMENT_FIELDS.filter((field) => nutriments[field.key] != null).map((field) => ({
    name: field.name,
    value: String(nutriments[field.key]),
    unit: field.unit,
  }));
}

function tagName(tag: string): string {
  return tag.replace(/^[a-z]{2}:/, '').replace(/-/g, ' ');
}

export function mapOpenFactsProduct(
  product: Record<string, any>,
  barcode: string,
  kind: CatalogKind,
): CatalogProduct | null {
  const name = firstString(
    product.product_name_en,
    product.product_name,
    product.generic_name_en,
    product.generic_name,
  );
  if (!name) return null;

  const brand = firstString(
    typeof product.brands === 'string' ? product.brands.split(',')[0] : '',
    Array.isArray(product.brands) ? product.brands[0] : '',
    'Unknown brand',
  );
  const images = [
    product.image_front_url,
    product.image_url,
    product.image_front_small_url,
  ].filter((url): url is string => typeof url === 'string' && url.startsWith('http'));

  const categoryTags: string[] = Array.isArray(product.categories_tags) ? product.categories_tags : [];
  const labels: string[] = Array.isArray(product.labels_tags) ? product.labels_tags : [];
  const allergens: string[] = Array.isArray(product.allergens_tags)
    ? product.allergens_tags.map(tagName)
    : [];
  const nutriments = parseNutriments(product);
  const ingredients = parseIngredients(product);

  const dataSource = kind === 'beauty' ? 'Open Beauty Facts' : 'Open Food Facts';
  const host = kind === 'beauty' ? 'world.openbeautyfacts.org' : 'world.openfoodfacts.org';

  return {
    kind,
    barcode: firstString(product.code, barcode),
    name,
    brand,
    description: firstString(product.generic_name_en, product.generic_name, product.quantity),
    images: [...new Set(images)],
    ingredients,
    nutritionFacts: nutritionFacts(nutriments),
    tags: [
      ...labels.slice(0, 6).map(tagName),
      ...(product.nutriscore_grade ? [`nutriscore-${product.nutriscore_grade}`] : []),
      ...(product.nova_group ? [`nova-${product.nova_group}`] : []),
    ],
    categoryTags,
    nutriscoreGrade: product.nutriscore_grade,
    novaGroup: typeof product.nova_group === 'number' ? product.nova_group : undefined,
    additivesCount: typeof product.additives_n === 'number' ? product.additives_n : undefined,
    allergens,
    labels,
    nutriments,
    dataSource,
    dataSourceUrl: `https://${host}/product/${firstString(product.code, barcode)}`,
    raw: product,
  };
}

export const CATEGORY_SLUG_BY_TAG: [string, string][] = [
  ['en:greek-yogurts', 'greek-yogurt'],
  ['en:yogurts', 'greek-yogurt'],
  ['en:breakfast-cereals', 'cereal'],
  ['en:cereals-and-their-products', 'cereal'],
  ['en:chips-and-fries', 'chips'],
  ['en:crisps', 'chips'],
  ['en:fruit-juices', 'fruit-juice'],
  ['en:juices-and-nectars', 'fruit-juice'],
  ['en:toothpastes', 'toothpaste'],
  ['en:moisturizers', 'moisturizer'],
  ['en:body-lotions', 'moisturizer'],
  ['en:facial-creams', 'moisturizer'],
  ['en:sunscreens', 'sunscreen'],
  ['en:multivitamins', 'multivitamin'],
  ['en:protein-powders', 'protein'],
  ['en:dietary-supplements', 'supplements'],
];

export function categorySlugFor(catalog: CatalogProduct): string {
  for (const [tag, slug] of CATEGORY_SLUG_BY_TAG) {
    if (catalog.categoryTags.includes(tag)) return slug;
  }
  if (catalog.kind === 'beauty') return 'skincare';
  if (catalog.categoryTags.some((tag) => tag.includes('supplement') || tag.includes('vitamin'))) {
    return 'supplements';
  }
  return 'food';
}
