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

  const categoryTags: string[] = Array.isArray(product.categories_tags)
    ? product.categories_tags
    : [];
  const labels: string[] = Array.isArray(product.labels_tags) ? product.labels_tags : [];
  const allergens: string[] = Array.isArray(product.allergens_tags)
    ? product.allergens_tags.map(tagName)
    : [];
  const nutriments = parseNutriments(product);
  const ingredients = parseIngredients(product);

  // Detect pharma/medicine products from category tags
  const isPharma = categoryTags.some((t) =>
    /medicine|pharma|drug|tablet|capsule|syrup|otc|painkiller|antibiotic|supplement.*medic/i.test(
      t,
    ),
  );
  const resolvedKind: CatalogKind = isPharma ? 'pharma' : kind;

  const dataSource = kind === 'beauty' ? 'Open Beauty Facts' : 'Open Food Facts';
  const host = kind === 'beauty' ? 'world.openbeautyfacts.org' : 'world.openfoodfacts.org';

  return {
    kind: resolvedKind,
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
  // ── Pharma / Medicine (must be checked before food/beauty) ──────────────
  ['en:medicines', 'medicine'],
  ['en:drugs', 'medicine'],
  ['en:tablets', 'medicine'],
  ['en:capsules', 'medicine'],
  ['en:syrups', 'medicine'],
  ['en:otc-medicines', 'medicine'],
  ['en:painkillers', 'medicine'],
  ['en:antibiotics', 'medicine'],
  ['en:antacids', 'medicine'],
  ['en:cough-syrups', 'medicine'],
  ['en:ayurvedic-medicines', 'ayurveda'],
  ['in:ayurvedic', 'ayurveda'],
  ['en:homeopathic-medicines', 'medicine'],

  // ── Supplements ──────────────────────────────────────────────────────────
  ['en:protein-powders', 'protein'],
  ['en:whey-proteins', 'protein'],
  ['en:plant-proteins', 'protein'],
  ['en:multivitamins', 'multivitamin'],
  ['en:vitamin-d', 'multivitamin'],
  ['en:vitamin-c', 'multivitamin'],
  ['en:omega-3', 'multivitamin'],
  ['en:dietary-supplements', 'supplements'],
  ['en:health-supplements', 'supplements'],
  ['en:sports-nutrition', 'protein'],
  ['in:health-drinks', 'health-drink'],
  ['en:energy-drinks', 'health-drink'],
  ['en:meal-replacement', 'health-drink'],

  // ── Skincare / Beauty ────────────────────────────────────────────────────
  ['en:sunscreens', 'sunscreen'],
  ['en:sun-creams', 'sunscreen'],
  ['en:spf-creams', 'sunscreen'],
  ['en:moisturizers', 'moisturizer'],
  ['en:body-lotions', 'moisturizer'],
  ['en:facial-creams', 'moisturizer'],
  ['en:face-creams', 'moisturizer'],
  ['en:body-creams', 'moisturizer'],
  ['en:hand-creams', 'moisturizer'],
  ['en:lip-balms', 'moisturizer'],
  ['en:serums', 'moisturizer'],
  ['en:face-washes', 'face-wash'],
  ['en:facial-cleansers', 'face-wash'],
  ['en:cleansers', 'face-wash'],
  ['en:shampoos', 'haircare'],
  ['en:conditioners', 'haircare'],
  ['en:hair-oils', 'haircare'],
  ['in:hair-oils', 'haircare'],
  ['en:toothpastes', 'toothpaste'],
  ['en:mouthwashes', 'toothpaste'],
  ['en:deodorants', 'deodorant'],
  ['en:antiperspirants', 'deodorant'],
  ['en:soaps', 'soap'],
  ['en:shower-gels', 'soap'],
  ['en:body-washes', 'soap'],

  // ── Indian Staples ───────────────────────────────────────────────────────
  ['en:dals', 'dal'],
  ['in:dals', 'dal'],
  ['en:lentils', 'dal'],
  ['en:split-peas', 'dal'],
  ['en:rice', 'rice'],
  ['in:rice', 'rice'],
  ['en:basmati-rice', 'rice'],
  ['en:atta', 'atta'],
  ['in:atta', 'atta'],
  ['en:whole-wheat-flour', 'atta'],
  ['en:wheat-flour', 'atta'],
  ['in:spices', 'spices'],
  ['en:spices', 'spices'],
  ['en:masalas', 'spices'],
  ['in:masalas', 'spices'],
  ['en:pickles', 'pickles'],
  ['in:pickles', 'pickles'],
  ['en:chutneys', 'pickles'],
  ['en:ghee', 'ghee'],
  ['in:ghee', 'ghee'],
  ['en:edible-oils', 'edible-oil'],
  ['en:mustard-oil', 'edible-oil'],
  ['en:sunflower-oil', 'edible-oil'],
  ['en:cooking-oils', 'edible-oil'],
  ['in:namkeen', 'snacks'],
  ['en:namkeen', 'snacks'],
  ['en:indian-snacks', 'snacks'],
  ['in:biscuits', 'biscuits'],
  ['en:biscuits', 'biscuits'],
  ['en:cookies', 'biscuits'],
  ['in:indian-sweets', 'sweets'],
  ['en:indian-sweets', 'sweets'],
  ['en:chocolates', 'chocolate'],
  ['en:chocolate-bars', 'chocolate'],
  ['en:instant-noodles', 'instant-food'],
  ['en:instant-soups', 'instant-food'],
  ['in:ready-to-eat', 'instant-food'],
  ['en:ready-to-eat-meals', 'instant-food'],
  ['in:dairy', 'dairy'],
  ['en:milks', 'dairy'],
  ['en:paneer', 'dairy'],
  ['en:cheese', 'dairy'],
  ['en:butter', 'dairy'],
  ['en:yogurts', 'greek-yogurt'],
  ['en:greek-yogurts', 'greek-yogurt'],
  ['en:flavoured-yogurts', 'greek-yogurt'],

  // ── Global Food ──────────────────────────────────────────────────────────
  ['en:breakfast-cereals', 'cereal'],
  ['en:cereals-and-their-products', 'cereal'],
  ['en:muesli', 'cereal'],
  ['en:granola', 'cereal'],
  ['en:chips-and-fries', 'chips'],
  ['en:crisps', 'chips'],
  ['en:popcorn', 'chips'],
  ['en:fruit-juices', 'fruit-juice'],
  ['en:juices-and-nectars', 'fruit-juice'],
  ['en:vegetable-juices', 'fruit-juice'],
  ['en:waters', 'water'],
  ['en:sparkling-waters', 'water'],
  ['en:soft-drinks', 'beverages'],
  ['en:sodas', 'beverages'],
  ['en:teas', 'beverages'],
  ['en:coffees', 'beverages'],
  ['in:chai', 'beverages'],
  ['en:breads', 'bread'],
  ['en:whole-wheat-breads', 'bread'],
  ['en:pastas', 'pasta'],
  ['en:noodles', 'pasta'],
  ['en:sauces', 'condiments'],
  ['en:ketchups', 'condiments'],
];

export function categorySlugFor(catalog: CatalogProduct): string {
  // Exact tag match first (order matters — more specific tags are first)
  for (const [tag, slug] of CATEGORY_SLUG_BY_TAG) {
    if (catalog.categoryTags.includes(tag)) return slug;
  }

  // Partial substring fallback — catches localised/less common tags
  const allTags = catalog.categoryTags.join(' ');

  if (/medicine|tablet|capsule|syrup|drug|pharma/.test(allTags)) return 'medicine';
  if (/ayurved/.test(allTags)) return 'ayurveda';
  if (/supplement|vitamin|omega|protein.powder|whey/.test(allTags)) return 'supplements';
  if (/sunscreen|spf/.test(allTags)) return 'sunscreen';
  if (/moisturi|lotion|serum|cream/.test(allTags)) return 'moisturizer';
  if (/shampoo|conditioner|hair.oil/.test(allTags)) return 'haircare';
  if (/toothpaste|dental/.test(allTags)) return 'toothpaste';
  if (/soap|body.wash|shower/.test(allTags)) return 'soap';
  if (/dal|lentil/.test(allTags)) return 'dal';
  if (/rice|basmati/.test(allTags)) return 'rice';
  if (/atta|wheat.flour/.test(allTags)) return 'atta';
  if (/ghee/.test(allTags)) return 'ghee';
  if (/spice|masala/.test(allTags)) return 'spices';
  if (/biscuit|cookie/.test(allTags)) return 'biscuits';
  if (/noodle|instant/.test(allTags)) return 'instant-food';
  if (/cereal/.test(allTags)) return 'cereal';
  if (/juice/.test(allTags)) return 'fruit-juice';
  if (/chip|crisp|namkeen/.test(allTags)) return 'chips';
  if (/yogurt|curd/.test(allTags)) return 'greek-yogurt';
  if (/chocolate/.test(allTags)) return 'chocolate';

  // Kind-based last resort
  if (catalog.kind === 'pharma') return 'medicine';
  if (catalog.kind === 'beauty') return 'skincare';
  if (catalog.categoryTags.some((t) => t.includes('supplement') || t.includes('vitamin'))) {
    return 'supplements';
  }
  return 'food';
}
