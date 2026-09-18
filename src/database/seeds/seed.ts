import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fern';
const id = () => uuidv4();
const now = () => new Date();

// ── Helpers ───────────────────────────────────────────────────────────────────

function gradeLabel(s: number) {
  return {
    grade: s >= 90 ? 'A' : s >= 80 ? 'B' : s >= 65 ? 'C' : s >= 50 ? 'D' : 'F',
    label: s >= 80 ? 'Excellent' : s >= 65 ? 'Good' : s >= 50 ? 'Fair' : 'Poor',
  };
}

// Use OFF stable image CDN — no version number in path
function offImg(barcode: string): string {
  const b = barcode.replace(/\D/g, '').padStart(13, '0');
  const p1 = b.slice(0, 3);
  const p2 = b.slice(3, 6);
  const p3 = b.slice(6, 9);
  const p4 = b.slice(9);
  return `https://images.openfoodfacts.org/images/products/${p1}/${p2}/${p3}/${p4}/front_en.400.jpg`;
}

const S = new mongoose.Schema({ _id: String }, { strict: false });

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to', MONGO_URI.split('@')[1]?.split('/')[1] ?? 'db');

  const Cat  = mongoose.model('Category', S, 'categories');
  const Prod = mongoose.model('Product',  S, 'products');
  const Sc   = mongoose.model('Score',    S, 'scores');
  const Rank = mongoose.model('Ranking',  S, 'rankings');

  await Promise.all([Cat.deleteMany({}), Prod.deleteMany({}), Sc.deleteMany({}), Rank.deleteMany({})]);
  console.log('🗑  Cleared existing data');

  // ── Category IDs ─────────────────────────────────────────────────────────
  const cFood = id(), cSkin = id(), cSupp = id();
  const cYogurt = id(), cCereal = id(), cChips = id(), cJuice = id();
  const cToothpaste = id(), cMoisturizer = id(), cSunscreen = id();
  const cMulti = id(), cProtein = id();

  // ── Categories ────────────────────────────────────────────────────────────
  await Cat.insertMany([
    { _id: cFood,        name: 'Food & Groceries',    slug: 'food',         type: 'food',         parentId: null,  isActive: true, sortOrder: 0 },
    { _id: cSkin,        name: 'Skincare',            slug: 'skincare',     type: 'skincare',     parentId: null,  isActive: true, sortOrder: 1 },
    { _id: cSupp,        name: 'Supplements',         slug: 'supplements',  type: 'supplements',  parentId: null,  isActive: true, sortOrder: 2 },
    { _id: cYogurt,      name: 'Greek Yogurt',        slug: 'greek-yogurt', type: 'food',         parentId: cFood, isActive: true, sortOrder: 0 },
    { _id: cCereal,      name: 'Breakfast Cereal',    slug: 'cereal',       type: 'food',         parentId: cFood, isActive: true, sortOrder: 1 },
    { _id: cChips,       name: 'Chips & Crisps',      slug: 'chips',        type: 'food',         parentId: cFood, isActive: true, sortOrder: 2 },
    { _id: cJuice,       name: 'Fruit Juice',         slug: 'fruit-juice',  type: 'food',         parentId: cFood, isActive: true, sortOrder: 3 },
    { _id: cToothpaste,  name: 'Toothpaste',          slug: 'toothpaste',   type: 'skincare',     parentId: cSkin, isActive: true, sortOrder: 0 },
    { _id: cMoisturizer, name: 'Moisturizer',         slug: 'moisturizer',  type: 'skincare',     parentId: cSkin, isActive: true, sortOrder: 1 },
    { _id: cSunscreen,   name: 'Sunscreen',           slug: 'sunscreen',    type: 'skincare',     parentId: cSkin, isActive: true, sortOrder: 2 },
    { _id: cMulti,       name: 'Multivitamin',        slug: 'multivitamin', type: 'supplements',  parentId: cSupp, isActive: true, sortOrder: 0 },
    { _id: cProtein,     name: 'Protein',             slug: 'protein',      type: 'supplements',  parentId: cSupp, isActive: true, sortOrder: 1 },
  ]);
  console.log('✅ 12 categories');

  // ── Product builder ───────────────────────────────────────────────────────
  type Factor = { key: string; label: string; impact: string; points: number; reason: string; detail?: string };
  type P = {
    cat: string; name: string; brand: string; barcode: string;
    ingredients: string[]; tags: string[]; score: number;
    avoidIf: string[]; goodFor: string[]; factors: Factor[];
    nutritionFacts?: { name: string; value: string; unit: string }[];
  };

  const products: any[] = [], scores: any[] = [];
  const entries: { pid: string; score: number; cat: string }[] = [];

  function add(p: P) {
    const pid = id();
    const { grade, label } = gradeLabel(p.score);
    products.push({
      _id: pid,
      name: p.name, brand: p.brand, categoryId: p.cat,
      barcode: p.barcode,
      images: [offImg(p.barcode)],
      ingredients: p.ingredients,
      nutritionFacts: p.nutritionFacts ?? [],
      tags: p.tags,
      status: 'active',
      isCrowdsourced: false,
      dataSource: 'Open Food Facts',
    });
    scores.push({
      _id: id(), productId: pid,
      overallScore: p.score, grade, label,
      factors: p.factors,
      avoidIf: p.avoidIf, goodFor: p.goodFor,
      lastCalculatedAt: now(), scoringEngineVersion: '1.0',
    });
    entries.push({ pid, score: p.score, cat: p.cat });
  }

  // ── Greek Yogurt ──────────────────────────────────────────────────────────
  add({
    cat: cYogurt, name: 'Plain Greek Yogurt 0%', brand: 'Chobani', barcode: '818290013815',
    ingredients: ['Cultured Skim Milk', 'Live Active Cultures'],
    tags: ['high-protein', 'probiotic', 'low-fat'], score: 91,
    avoidIf: ['Dairy allergy', 'Lactose intolerance'],
    goodFor: ['High-protein diets', 'Post-workout recovery'],
    nutritionFacts: [
      { name: 'Calories', value: '90', unit: 'kcal' }, { name: 'Protein', value: '17', unit: 'g' },
      { name: 'Sugars', value: '6', unit: 'g' }, { name: 'Fat', value: '0', unit: 'g' },
    ],
    factors: [
      { key: 'protein',    label: 'High protein',       impact: 'positive', points: 25, reason: '+ 17g protein per serving', detail: 'Whey and casein proteins support muscle repair and satiety.' },
      { key: 'additives',  label: 'Minimal ingredients',impact: 'positive', points: 20, reason: '+ Only 2 ingredients',       detail: 'No thickeners, stabilisers, or artificial additives.' },
      { key: 'sugar',      label: 'Low sugar',          impact: 'positive', points: 15, reason: '+ Only 6g natural sugar',   detail: 'All sugar is naturally occurring lactose — zero added sugar.' },
      { key: 'probiotics', label: 'Probiotics',         impact: 'positive', points: 10, reason: '+ 5 live probiotic cultures', detail: 'L. acidophilus and other cultures support gut health.' },
    ],
  });

  add({
    cat: cYogurt, name: 'Icelandic Style Plain Yogurt', brand: "Siggi's", barcode: '898571001013',
    ingredients: ['Pasteurized Skim Milk', 'Active Cultures'],
    tags: ['skyr', 'high-protein', 'low-sugar'], score: 89,
    avoidIf: ['Dairy allergy'], goodFor: ['Low-sugar diets', 'High-protein diets'],
    nutritionFacts: [
      { name: 'Calories', value: '100', unit: 'kcal' }, { name: 'Protein', value: '15', unit: 'g' },
      { name: 'Sugars', value: '4', unit: 'g' },
    ],
    factors: [
      { key: 'protein',   label: 'High protein',  impact: 'positive', points: 25, reason: '+ 15g protein per serving' },
      { key: 'sugar',     label: 'Very low sugar', impact: 'positive', points: 20, reason: '+ Only 4g sugar' },
      { key: 'additives', label: 'Clean label',    impact: 'positive', points: 15, reason: '+ 2-ingredient formula' },
    ],
  });

  add({
    cat: cYogurt, name: 'Total 0% Plain Greek Yogurt', brand: 'Fage', barcode: '074767024033',
    ingredients: ['Grade A Pasteurized Skimmed Milk', 'Live Active Yogurt Cultures'],
    tags: ['greek', 'probiotic', 'clean'], score: 85,
    avoidIf: ['Dairy allergy'], goodFor: ['Calcium intake', 'Healthy fat diets'],
    factors: [
      { key: 'protein', label: 'High protein', impact: 'positive', points: 20, reason: '+ 18g protein per serving' },
      { key: 'fat',     label: 'Saturated fat', impact: 'negative', points: -8,  reason: '- Higher saturated fat' },
      { key: 'clean',   label: 'No additives',  impact: 'positive', points: 18, reason: '+ No additives or thickeners' },
    ],
  });

  add({
    cat: cYogurt, name: 'Greek Yogurt Strawberry', brand: 'Yoplait', barcode: '070470003070',
    ingredients: ['Cultured Low Fat Milk', 'Strawberries', 'Sugar', 'Modified Corn Starch', 'Sucralose'],
    tags: ['flavored', 'low-fat'], score: 52,
    avoidIf: ['Diabetes', 'Added sugar sensitivity'], goodFor: ['Occasional treat'],
    nutritionFacts: [{ name: 'Sugars', value: '19', unit: 'g' }, { name: 'Protein', value: '11', unit: 'g' }],
    factors: [
      { key: 'sugar',    label: 'High sugar',     impact: 'negative', points: -20, reason: '- 19g sugar including 12g added' },
      { key: 'additives',label: 'Additives',      impact: 'negative', points: -15, reason: '- Sucralose + modified corn starch' },
      { key: 'protein',  label: 'Decent protein', impact: 'positive', points: 10,  reason: '+ 11g protein' },
    ],
  });

  // ── Toothpaste ────────────────────────────────────────────────────────────
  add({
    cat: cToothpaste, name: 'Repair & Protect Whitening', brand: 'Sensodyne', barcode: '310310072083',
    ingredients: ['Potassium Nitrate 5%', 'Sodium Fluoride 0.25%', 'Sorbitol', 'Hydrated Silica', 'Glycerin', 'Sodium Lauryl Sulfate'],
    tags: ['sensitive', 'whitening', 'fluoride'], score: 82,
    avoidIf: ['SLS sensitivity'], goodFor: ['Sensitive teeth', 'Cavity protection'],
    factors: [
      { key: 'fluoride',  label: 'Fluoride protection', impact: 'positive', points: 20, reason: '+ Proven fluoride cavity prevention' },
      { key: 'potassium', label: 'Desensitiser',        impact: 'positive', points: 15, reason: '+ Potassium nitrate desensitises nerves' },
      { key: 'sls',       label: 'SLS present',         impact: 'negative', points: -10, reason: '- SLS can irritate canker sores' },
    ],
  });

  add({
    cat: cToothpaste, name: 'Total Whitening', brand: 'Colgate', barcode: '035000261595',
    ingredients: ['Sodium Fluoride', 'Hydrated Silica', 'Sorbitol', 'Sodium Lauryl Sulfate', 'Zinc Sulfate', 'Saccharin'],
    tags: ['whitening', 'fluoride', 'antibacterial'], score: 70,
    avoidIf: ['Saccharin sensitivity', 'SLS sensitivity'], goodFor: ['All-round oral care'],
    factors: [
      { key: 'fluoride',  label: 'Fluoride',   impact: 'positive', points: 18, reason: '+ Effective fluoride' },
      { key: 'zinc',      label: 'Zinc',        impact: 'positive', points: 10, reason: '+ Zinc reduces bad breath bacteria' },
      { key: 'saccharin', label: 'Saccharin',   impact: 'negative', points: -12, reason: '- Contains saccharin' },
      { key: 'sls',       label: 'SLS present', impact: 'negative', points: -10, reason: '- Contains SLS' },
    ],
  });

  add({
    cat: cToothpaste, name: 'Activated Charcoal Whitening', brand: 'Hello', barcode: '850001835016',
    ingredients: ['Activated Charcoal', 'Coconut Oil', 'Xylitol', 'Hydrated Silica', 'Sodium Bicarbonate'],
    tags: ['charcoal', 'natural', 'fluoride-free', 'vegan'], score: 74,
    avoidIf: ['Those needing fluoride'], goodFor: ['Natural preference', 'SLS-free'],
    factors: [
      { key: 'natural',  label: 'Clean formula', impact: 'positive', points: 18, reason: '+ No SLS, vegan, no artificial sweeteners' },
      { key: 'xylitol',  label: 'Xylitol',       impact: 'positive', points: 12, reason: '+ Xylitol reduces cavity bacteria' },
      { key: 'fluoride', label: 'No fluoride',    impact: 'negative', points: -15, reason: '- No fluoride — higher cavity risk' },
    ],
  });

  // ── Moisturizer ───────────────────────────────────────────────────────────
  add({
    cat: cMoisturizer, name: 'Daily Moisturizing Lotion', brand: 'CeraVe', barcode: '301871329014',
    ingredients: ['Water', 'Glycerin', 'Cetearyl Alcohol', 'Ceramide NP', 'Ceramide AP', 'Ceramide EOP', 'Dimethicone'],
    tags: ['ceramide', 'fragrance-free', 'sensitive'], score: 93,
    avoidIf: ['Cetyl alcohol allergy (rare)'], goodFor: ['Dry skin', 'Sensitive skin', 'Eczema'],
    factors: [
      { key: 'ceramides', label: 'Ceramides',       impact: 'positive', points: 25, reason: '+ 3 ceramides restore skin barrier', detail: 'Ceramides NP, AP and EOP mimic the skin\'s natural lipid layer.' },
      { key: 'fragrance', label: 'Fragrance-free',  impact: 'positive', points: 20, reason: '+ Fragrance-free — safe for sensitive skin' },
      { key: 'glycerin',  label: 'Glycerin',        impact: 'positive', points: 15, reason: '+ Glycerin draws moisture into skin' },
    ],
  });

  add({
    cat: cMoisturizer, name: 'Hydro Boost Water Gel', brand: 'Neutrogena', barcode: '070501066292',
    ingredients: ['Water', 'Dimethicone', 'Glycerin', 'Hyaluronic Acid', 'Olive Extract'],
    tags: ['hyaluronic-acid', 'oil-free', 'gel'], score: 88,
    avoidIf: ['Silicone sensitivity'], goodFor: ['Oily skin', 'Combination skin'],
    factors: [
      { key: 'ha',       label: 'Hyaluronic acid', impact: 'positive', points: 22, reason: '+ Hyaluronic acid for deep hydration' },
      { key: 'oil-free', label: 'Oil-free',         impact: 'positive', points: 18, reason: '+ Non-comedogenic for oily skin' },
      { key: 'silicone', label: 'Silicone',         impact: 'negative', points: -5,  reason: '- Dimethicone may clog pores' },
    ],
  });

  // ── Multivitamin ──────────────────────────────────────────────────────────
  add({
    cat: cMulti, name: "Alive! Once Daily Women's", brand: "Nature's Way", barcode: '033674154090',
    ingredients: ['Organic Fruit Blend', 'Vitamin A', 'Vitamin C', 'Vitamin D3', 'Vitamin E', 'B-Complex', 'Folic Acid', 'Zinc'],
    tags: ['womens', 'organic', 'food-based', 'non-gmo'], score: 84,
    avoidIf: ['Citrus allergy'], goodFor: ["Women 18–50", 'Non-GMO preference'],
    factors: [
      { key: 'organic', label: 'Organic base',   impact: 'positive', points: 20, reason: '+ Organic fruit base improves absorption' },
      { key: 'd3',      label: 'Vitamin D3',     impact: 'positive', points: 15, reason: '+ D3 — more bioavailable than D2' },
      { key: 'fillers', label: 'Minimal fillers', impact: 'positive', points: 12, reason: '+ Minimal synthetic binders' },
    ],
  });

  add({
    cat: cMulti, name: "One A Day Women's", brand: 'Bayer', barcode: '016500540169',
    ingredients: ['Calcium Carbonate', 'Vitamin C', 'Iron', 'Vitamin E', 'Folic Acid', 'Biotin'],
    tags: ['womens', 'multivitamin', 'iron'], score: 78,
    avoidIf: ['Iron overload conditions'], goodFor: ["Women 18–50", 'Iron supplementation'],
    factors: [
      { key: 'folic',   label: 'Folic acid',     impact: 'positive', points: 18, reason: '+ 400mcg folic acid' },
      { key: 'iron',    label: 'Iron',            impact: 'positive', points: 15, reason: '+ Addresses iron deficiency' },
      { key: 'fillers', label: 'Synthetic binders', impact: 'negative', points: -10, reason: '- Several synthetic binders' },
    ],
  });

  // ── Cereal ────────────────────────────────────────────────────────────────
  add({
    cat: cCereal, name: 'Old Fashioned Rolled Oats', brand: 'Quaker', barcode: '030000010419',
    ingredients: ['100% Natural Whole Grain Rolled Oats'],
    tags: ['whole-grain', 'oats', 'fiber'], score: 94,
    avoidIf: ['Coeliac disease (cross-contamination risk)'],
    goodFor: ['Heart health', 'High-fiber diets', 'Weight management'],
    nutritionFacts: [
      { name: 'Calories', value: '150', unit: 'kcal' }, { name: 'Fiber', value: '4', unit: 'g' },
      { name: 'Protein', value: '5', unit: 'g' }, { name: 'Sugars', value: '1', unit: 'g' },
    ],
    factors: [
      { key: 'wholegrain', label: 'Whole grain', impact: 'positive', points: 25, reason: '+ 100% whole grain, rich in beta-glucan', detail: 'Beta-glucan fibre is clinically proven to lower LDL cholesterol.' },
      { key: 'single',     label: 'Single ingredient', impact: 'positive', points: 25, reason: '+ Single ingredient — zero additives' },
      { key: 'fiber',      label: 'High fibre',  impact: 'positive', points: 18, reason: '+ 4g fibre lowers cholesterol' },
    ],
  });

  add({
    cat: cCereal, name: 'Honey Nut Cheerios', brand: 'General Mills', barcode: '016000275287',
    ingredients: ['Whole Grain Oats', 'Sugar', 'Honey', 'Brown Sugar Syrup', 'Modified Corn Starch'],
    tags: ['honey', 'oats', 'whole-grain', 'fortified'], score: 63,
    avoidIf: ['Diabetes', 'Added sugar sensitivity'], goodFor: ['Kids breakfast'],
    nutritionFacts: [{ name: 'Sugars', value: '9', unit: 'g' }, { name: 'Fiber', value: '2', unit: 'g' }],
    factors: [
      { key: 'wholegrain', label: 'Whole grain',   impact: 'positive', points: 15, reason: '+ First ingredient whole grain oats' },
      { key: 'sugar',      label: 'Added sugar',   impact: 'negative', points: -18, reason: '- 9g sugar including added sugars' },
      { key: 'additives',  label: 'Modified starch', impact: 'negative', points: -8, reason: '- Modified corn starch' },
    ],
  });

  // ── Protein ───────────────────────────────────────────────────────────────
  add({
    cat: cProtein, name: 'Gold Standard 100% Whey', brand: 'Optimum Nutrition', barcode: '748927024890',
    ingredients: ['Whey Protein Isolate', 'Whey Protein Concentrate', 'Cocoa', 'Lecithin', 'Acesulfame Potassium', 'Sucralose'],
    tags: ['whey', 'protein', 'post-workout'], score: 79,
    avoidIf: ['Lactose intolerance', 'Artificial sweetener sensitivity'],
    goodFor: ['Muscle building', 'Post-workout recovery'],
    nutritionFacts: [{ name: 'Protein', value: '24', unit: 'g' }, { name: 'Calories', value: '120', unit: 'kcal' }],
    factors: [
      { key: 'protein',    label: 'High protein',     impact: 'positive', points: 25, reason: '+ 24g whey isolate — fast absorbing' },
      { key: 'bcaa',       label: 'BCAAs',            impact: 'positive', points: 15, reason: '+ 5.5g BCAAs per serving' },
      { key: 'artificial', label: 'Artificial sweeteners', impact: 'negative', points: -12, reason: '- Acesulfame K + sucralose' },
    ],
  });

  // ── Chips ─────────────────────────────────────────────────────────────────
  add({
    cat: cChips, name: 'Classic Original Chips', brand: "Lay's", barcode: '028400315036',
    ingredients: ['Potatoes', 'Vegetable Oil', 'Salt'],
    tags: ['chips', 'classic', 'gluten-free'], score: 45,
    avoidIf: ['High sodium diets', 'Cardiovascular disease'],
    goodFor: ['Occasional snack'],
    nutritionFacts: [{ name: 'Calories', value: '160', unit: 'kcal' }, { name: 'Salt', value: '1.5', unit: 'g' }],
    factors: [
      { key: 'simple',  label: 'Simple ingredients', impact: 'positive', points: 15, reason: '+ Only 3 ingredients' },
      { key: 'salt',    label: 'High sodium',        impact: 'negative', points: -20, reason: '- High sodium per serving' },
      { key: 'calories',label: 'Calorie dense',      impact: 'negative', points: -15, reason: '- Very calorie dense with low satiety' },
    ],
  });

  // ── Juice ─────────────────────────────────────────────────────────────────
  add({
    cat: cJuice, name: '100% Orange Juice', brand: "Tropicana", barcode: '048500202586',
    ingredients: ['100% Pure Squeezed Pasteurised Orange Juice'],
    tags: ['juice', 'vitamin-c', 'no-added-sugar'], score: 68,
    avoidIf: ['Diabetes (high glycaemic)', 'Fructose intolerance'],
    goodFor: ['Vitamin C source', 'Morning routine'],
    nutritionFacts: [
      { name: 'Calories', value: '110', unit: 'kcal' }, { name: 'Sugars', value: '22', unit: 'g' },
      { name: 'Vitamin C', value: '100', unit: '%DV' },
    ],
    factors: [
      { key: 'vitc',    label: 'Vitamin C',       impact: 'positive', points: 20, reason: '+ 100% vitamin C daily value' },
      { key: 'natural', label: 'No added sugar',  impact: 'positive', points: 10, reason: '+ No added sugar — only natural fructose' },
      { key: 'sugar',   label: 'High sugar',      impact: 'negative', points: -18, reason: '- 22g sugar per cup (no fibre to slow absorption)' },
    ],
  });

  await Prod.insertMany(products);
  console.log(`✅ ${products.length} products`);

  await Sc.insertMany(scores);
  console.log(`✅ ${scores.length} scores`);

  // ── Rankings ──────────────────────────────────────────────────────────────
  const byCat: Record<string, { pid: string; score: number }[]> = {};
  for (const e of entries) {
    (byCat[e.cat] ??= []).push({ pid: e.pid, score: e.score });
  }

  const rankings: any[] = [];
  for (const [cat, list] of Object.entries(byCat)) {
    list.sort((a, b) => b.score - a.score).forEach((e, i) => {
      rankings.push({
        _id: id(), categoryId: cat, productId: e.pid,
        rank: i + 1, score: e.score, computedAt: now(),
      });
    });
  }

  await Rank.insertMany(rankings);
  console.log(`✅ ${rankings.length} rankings`);

  await mongoose.disconnect();
  console.log('\n🌿 Fern seed complete!');
}

main().catch((e) => { console.error('❌', e); process.exit(1); });
