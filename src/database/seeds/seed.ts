import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vero';
const id = () => uuidv4();
const now = () => new Date();

function gradeLabel(s: number) {
  return {
    grade: s >= 90 ? 'A' : s >= 80 ? 'B' : s >= 65 ? 'C' : s >= 50 ? 'D' : 'F',
    label: s >= 80 ? 'Excellent' : s >= 65 ? 'Good' : s >= 50 ? 'Fair' : 'Poor',
  };
}

const S = new mongoose.Schema({ _id: String }, { strict: false });

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected');

  const Cat = mongoose.model('Category', S, 'categories');
  const Prod = mongoose.model('Product', S, 'products');
  const Sc = mongoose.model('Score', S, 'scores');
  const Rank = mongoose.model('Ranking', S, 'rankings');

  await Promise.all([
    Cat.deleteMany({}),
    Prod.deleteMany({}),
    Sc.deleteMany({}),
    Rank.deleteMany({}),
  ]);
  console.log('🗑  Cleared');

  // ── IDs ───────────────────────────────────────────────────────────────────
  const cFood = id(),
    cSkin = id(),
    cSupp = id();
  const cYogurt = id(),
    cCereal = id(),
    cChips = id(),
    cJuice = id();
  const cToothpaste = id(),
    cMoisturizer = id(),
    cSunscreen = id();
  const cMulti = id(),
    cProtein = id();

  // ── CATEGORIES ────────────────────────────────────────────────────────────
  await Cat.insertMany([
    {
      _id: cFood,
      name: 'Food & Groceries',
      slug: 'food',
      type: 'food',
      parentId: null,
      isActive: true,
      sortOrder: 0,
    },
    {
      _id: cSkin,
      name: 'Skincare',
      slug: 'skincare',
      type: 'skincare',
      parentId: null,
      isActive: true,
      sortOrder: 1,
    },
    {
      _id: cSupp,
      name: 'Supplements',
      slug: 'supplements',
      type: 'supplements',
      parentId: null,
      isActive: true,
      sortOrder: 2,
    },
    {
      _id: cYogurt,
      name: 'Greek Yogurt',
      slug: 'greek-yogurt',
      type: 'food',
      parentId: cFood,
      isActive: true,
      sortOrder: 0,
    },
    {
      _id: cCereal,
      name: 'Breakfast Cereal',
      slug: 'cereal',
      type: 'food',
      parentId: cFood,
      isActive: true,
      sortOrder: 1,
    },
    {
      _id: cChips,
      name: 'Chips & Crisps',
      slug: 'chips',
      type: 'food',
      parentId: cFood,
      isActive: true,
      sortOrder: 2,
    },
    {
      _id: cJuice,
      name: 'Fruit Juice',
      slug: 'fruit-juice',
      type: 'food',
      parentId: cFood,
      isActive: true,
      sortOrder: 3,
    },
    {
      _id: cToothpaste,
      name: 'Toothpaste',
      slug: 'toothpaste',
      type: 'skincare',
      parentId: cSkin,
      isActive: true,
      sortOrder: 0,
    },
    {
      _id: cMoisturizer,
      name: 'Moisturizer',
      slug: 'moisturizer',
      type: 'skincare',
      parentId: cSkin,
      isActive: true,
      sortOrder: 1,
    },
    {
      _id: cSunscreen,
      name: 'Sunscreen',
      slug: 'sunscreen',
      type: 'skincare',
      parentId: cSkin,
      isActive: true,
      sortOrder: 2,
    },
    {
      _id: cMulti,
      name: 'Multivitamin',
      slug: 'multivitamin',
      type: 'supplements',
      parentId: cSupp,
      isActive: true,
      sortOrder: 0,
    },
    {
      _id: cProtein,
      name: 'Protein',
      slug: 'protein',
      type: 'supplements',
      parentId: cSupp,
      isActive: true,
      sortOrder: 1,
    },
  ]);
  console.log('✅ 12 categories');

  // ── PRODUCTS helper ───────────────────────────────────────────────────────
  type P = {
    cat: string;
    name: string;
    brand: string;
    barcode: string;
    image: string;
    ingredients: string[];
    tags: string[];
    score: number;
    avoidIf: string[];
    goodFor: string[];
    factors: any[];
  };

  const products: any[] = [],
    scores: any[] = [];
  const entries: { pid: string; score: number; cat: string }[] = [];

  function add(p: P) {
    const pid = id();
    const { grade, label } = gradeLabel(p.score);
    products.push({
      _id: pid,
      name: p.name,
      brand: p.brand,
      categoryId: p.cat,
      barcode: p.barcode,
      images: [p.image],
      ingredients: p.ingredients,
      tags: p.tags,
      status: 'active',
      isCrowdsourced: false,
      dataSource: 'Open Food Facts',
    });
    scores.push({
      _id: id(),
      productId: pid,
      overallScore: p.score,
      grade,
      label,
      factors: p.factors,
      avoidIf: p.avoidIf,
      goodFor: p.goodFor,
      lastCalculatedAt: now(),
      scoringEngineVersion: '1.0',
    });
    entries.push({ pid, score: p.score, cat: p.cat });
  }

  // ── GREEK YOGURT ──────────────────────────────────────────────────────────
  add({
    cat: cYogurt,
    name: 'Plain Greek Yogurt 0%',
    brand: 'Chobani',
    barcode: '818290013815',
    image: 'https://images.openfoodfacts.org/images/products/081/829/001/3815/front_en.3.400.jpg',
    ingredients: ['Cultured Skim Milk', 'Live Active Cultures'],
    tags: ['high-protein', 'probiotic', 'low-fat'],
    score: 91,
    avoidIf: ['Dairy allergy', 'Lactose intolerance'],
    goodFor: ['High-protein diets', 'Post-workout recovery'],
    factors: [
      { key: 'protein', impact: 'positive', points: 25, reason: '+ 17g protein per serving' },
      { key: 'additives', impact: 'positive', points: 20, reason: '+ Only 2 ingredients' },
      { key: 'sugar', impact: 'positive', points: 15, reason: '+ Only 6g natural sugar' },
      { key: 'probiotics', impact: 'positive', points: 10, reason: '+ 5 live probiotic cultures' },
    ],
  });

  add({
    cat: cYogurt,
    name: 'Icelandic Style Plain Yogurt',
    brand: "Siggi's",
    barcode: '898571001013',
    image: 'https://images.openfoodfacts.org/images/products/089/857/100/1013/front_en.3.400.jpg',
    ingredients: ['Pasteurized Skim Milk', 'Active Cultures'],
    tags: ['skyr', 'high-protein', 'low-sugar'],
    score: 89,
    avoidIf: ['Dairy allergy'],
    goodFor: ['Low-sugar diets', 'High-protein diets'],
    factors: [
      { key: 'protein', impact: 'positive', points: 25, reason: '+ 15g protein per serving' },
      { key: 'sugar', impact: 'positive', points: 20, reason: '+ Only 4g sugar' },
      { key: 'additives', impact: 'positive', points: 15, reason: '+ 2-ingredient formula' },
    ],
  });

  add({
    cat: cYogurt,
    name: 'Total 0% Plain Greek Yogurt',
    brand: 'Fage',
    barcode: '074767024033',
    image: 'https://images.openfoodfacts.org/images/products/007/476/702/4033/front_en.3.400.jpg',
    ingredients: ['Grade A Pasteurized Skimmed Milk', 'Live Active Yogurt Cultures'],
    tags: ['greek', 'probiotic', 'clean'],
    score: 85,
    avoidIf: ['Dairy allergy'],
    goodFor: ['Calcium intake', 'Healthy fat diets'],
    factors: [
      { key: 'protein', impact: 'positive', points: 20, reason: '+ 18g protein per serving' },
      { key: 'fat', impact: 'negative', points: -8, reason: '- Higher saturated fat' },
      { key: 'clean', impact: 'positive', points: 18, reason: '+ No additives or thickeners' },
    ],
  });

  add({
    cat: cYogurt,
    name: 'Greek Yogurt Strawberry',
    brand: 'Yoplait',
    barcode: '070470003070',
    image: 'https://images.openfoodfacts.org/images/products/007/047/000/3070/front_en.3.400.jpg',
    ingredients: [
      'Cultured Low Fat Milk',
      'Strawberries',
      'Sugar',
      'Modified Corn Starch',
      'Sucralose',
    ],
    tags: ['flavored', 'low-fat'],
    score: 52,
    avoidIf: ['Diabetes', 'Added sugar sensitivity'],
    goodFor: ['Occasional treat'],
    factors: [
      { key: 'sugar', impact: 'negative', points: -20, reason: '- 19g sugar including 12g added' },
      {
        key: 'additives',
        impact: 'negative',
        points: -15,
        reason: '- Sucralose + modified corn starch',
      },
      { key: 'protein', impact: 'positive', points: 10, reason: '+ 11g protein' },
    ],
  });

  // ── TOOTHPASTE ────────────────────────────────────────────────────────────
  add({
    cat: cToothpaste,
    name: 'Repair & Protect Whitening',
    brand: 'Sensodyne',
    barcode: '310310072083',
    image: 'https://images.openfoodfacts.org/images/products/031/031/007/2083/front_en.3.400.jpg',
    ingredients: [
      'Potassium Nitrate 5%',
      'Sodium Fluoride 0.25%',
      'Sorbitol',
      'Hydrated Silica',
      'Glycerin',
      'Sodium Lauryl Sulfate',
    ],
    tags: ['sensitive', 'whitening', 'fluoride'],
    score: 82,
    avoidIf: ['SLS sensitivity'],
    goodFor: ['Sensitive teeth', 'Cavity protection'],
    factors: [
      {
        key: 'fluoride',
        impact: 'positive',
        points: 20,
        reason: '+ Proven fluoride cavity prevention',
      },
      {
        key: 'potassium',
        impact: 'positive',
        points: 15,
        reason: '+ Potassium nitrate desensitises nerves',
      },
      { key: 'sls', impact: 'negative', points: -10, reason: '- SLS can irritate canker sores' },
    ],
  });

  add({
    cat: cToothpaste,
    name: 'Activated Charcoal Whitening',
    brand: 'Hello',
    barcode: '850001835016',
    image: 'https://images.openfoodfacts.org/images/products/085/000/183/5016/front_en.3.400.jpg',
    ingredients: [
      'Activated Charcoal',
      'Coconut Oil',
      'Xylitol',
      'Hydrated Silica',
      'Sodium Bicarbonate',
    ],
    tags: ['charcoal', 'natural', 'fluoride-free', 'vegan'],
    score: 74,
    avoidIf: ['Those needing fluoride'],
    goodFor: ['Natural preference', 'SLS-free'],
    factors: [
      {
        key: 'natural',
        impact: 'positive',
        points: 18,
        reason: '+ No SLS, vegan, no artificial sweeteners',
      },
      {
        key: 'xylitol',
        impact: 'positive',
        points: 12,
        reason: '+ Xylitol reduces cavity bacteria',
      },
      {
        key: 'fluoride',
        impact: 'negative',
        points: -15,
        reason: '- No fluoride — higher cavity risk',
      },
    ],
  });

  add({
    cat: cToothpaste,
    name: 'Total Whitening',
    brand: 'Colgate',
    barcode: '035000261595',
    image: 'https://images.openfoodfacts.org/images/products/003/500/026/1595/front_en.3.400.jpg',
    ingredients: [
      'Sodium Fluoride',
      'Hydrated Silica',
      'Sorbitol',
      'Sodium Lauryl Sulfate',
      'Zinc Sulfate',
      'Saccharin',
    ],
    tags: ['whitening', 'fluoride', 'antibacterial'],
    score: 70,
    avoidIf: ['Saccharin sensitivity', 'SLS sensitivity'],
    goodFor: ['All-round oral care'],
    factors: [
      { key: 'fluoride', impact: 'positive', points: 18, reason: '+ Effective fluoride' },
      { key: 'zinc', impact: 'positive', points: 10, reason: '+ Zinc reduces bad breath bacteria' },
      { key: 'saccharin', impact: 'negative', points: -12, reason: '- Contains saccharin' },
      { key: 'sls', impact: 'negative', points: -10, reason: '- Contains SLS' },
    ],
  });

  add({
    cat: cToothpaste,
    name: 'Kids Bubblegum Toothpaste',
    brand: 'Oral-B',
    barcode: '300410310313',
    image: 'https://images.openfoodfacts.org/images/products/030/041/031/0313/front_en.3.400.jpg',
    ingredients: [
      'Water',
      'Hydrated Silica',
      'Sorbitol',
      'Sodium Fluoride',
      'Sodium Lauryl Sulfate',
      'Sucralose',
      'FD&C Blue No. 1',
    ],
    tags: ['kids', 'fluoride'],
    score: 58,
    avoidIf: ['Children under 2', 'Artificial dye sensitivity'],
    goodFor: ['Kids cavity protection'],
    factors: [
      {
        key: 'fluoride',
        impact: 'positive',
        points: 15,
        reason: '+ Fluoride for developing teeth',
      },
      { key: 'dye', impact: 'negative', points: -15, reason: '- FD&C Blue No.1 unnecessary dye' },
      { key: 'sucralose', impact: 'negative', points: -10, reason: '- Contains sucralose' },
    ],
  });

  // ── MOISTURIZER ───────────────────────────────────────────────────────────
  add({
    cat: cMoisturizer,
    name: 'Daily Moisturizing Lotion',
    brand: 'CeraVe',
    barcode: '301871329014',
    image: 'https://images.openfoodfacts.org/images/products/030/187/132/9014/front_en.3.400.jpg',
    ingredients: [
      'Water',
      'Glycerin',
      'Cetearyl Alcohol',
      'Ceramide NP',
      'Ceramide AP',
      'Ceramide EOP',
      'Dimethicone',
    ],
    tags: ['ceramide', 'fragrance-free', 'sensitive'],
    score: 93,
    avoidIf: ['Cetyl alcohol allergy (rare)'],
    goodFor: ['Dry skin', 'Sensitive skin', 'Eczema'],
    factors: [
      {
        key: 'ceramides',
        impact: 'positive',
        points: 25,
        reason: '+ 3 ceramides restore skin barrier',
      },
      {
        key: 'fragrance',
        impact: 'positive',
        points: 20,
        reason: '+ Fragrance-free — safe for sensitive skin',
      },
      {
        key: 'glycerin',
        impact: 'positive',
        points: 15,
        reason: '+ Glycerin draws moisture into skin',
      },
    ],
  });

  add({
    cat: cMoisturizer,
    name: 'Hydro Boost Water Gel',
    brand: 'Neutrogena',
    barcode: '070501066292',
    image: 'https://images.openfoodfacts.org/images/products/007/050/106/6292/front_en.3.400.jpg',
    ingredients: ['Water', 'Dimethicone', 'Glycerin', 'Hyaluronic Acid', 'Olive Extract'],
    tags: ['hyaluronic-acid', 'oil-free', 'gel'],
    score: 88,
    avoidIf: ['Silicone sensitivity'],
    goodFor: ['Oily skin', 'Combination skin'],
    factors: [
      { key: 'ha', impact: 'positive', points: 22, reason: '+ Hyaluronic acid for deep hydration' },
      {
        key: 'oil-free',
        impact: 'positive',
        points: 18,
        reason: '+ Non-comedogenic for oily skin',
      },
      { key: 'silicone', impact: 'negative', points: -5, reason: '- Dimethicone may clog pores' },
    ],
  });

  // ── MULTIVITAMIN ──────────────────────────────────────────────────────────
  add({
    cat: cMulti,
    name: "Alive! Once Daily Women's",
    brand: "Nature's Way",
    barcode: '033674154090',
    image: 'https://images.openfoodfacts.org/images/products/003/367/415/4090/front_en.3.400.jpg',
    ingredients: [
      'Organic Fruit Blend',
      'Vitamin A',
      'Vitamin C',
      'Vitamin D3',
      'Vitamin E',
      'B-Complex',
      'Folic Acid',
      'Zinc',
    ],
    tags: ['womens', 'organic', 'food-based', 'non-gmo'],
    score: 84,
    avoidIf: ['Citrus allergy'],
    goodFor: ['Women 18-50', 'Non-GMO preference'],
    factors: [
      {
        key: 'organic',
        impact: 'positive',
        points: 20,
        reason: '+ Organic fruit base improves absorption',
      },
      { key: 'd3', impact: 'positive', points: 15, reason: '+ D3 — more bioavailable than D2' },
      { key: 'fillers', impact: 'positive', points: 12, reason: '+ Minimal synthetic binders' },
    ],
  });

  add({
    cat: cMulti,
    name: "One A Day Women's",
    brand: 'Bayer',
    barcode: '016500540169',
    image: 'https://images.openfoodfacts.org/images/products/001/650/054/0169/front_en.3.400.jpg',
    ingredients: ['Calcium Carbonate', 'Vitamin C', 'Iron', 'Vitamin E', 'Folic Acid', 'Biotin'],
    tags: ['womens', 'multivitamin', 'iron'],
    score: 78,
    avoidIf: ['Iron overload conditions'],
    goodFor: ['Women 18-50', 'Iron supplementation'],
    factors: [
      { key: 'folic', impact: 'positive', points: 18, reason: '+ 400mcg folic acid' },
      { key: 'iron', impact: 'positive', points: 15, reason: '+ Addresses iron deficiency' },
      { key: 'fillers', impact: 'negative', points: -10, reason: '- Several synthetic binders' },
    ],
  });

  // ── CEREAL ────────────────────────────────────────────────────────────────
  add({
    cat: cCereal,
    name: 'Old Fashioned Rolled Oats',
    brand: 'Quaker',
    barcode: '030000010419',
    image: 'https://images.openfoodfacts.org/images/products/003/000/001/0419/front_en.3.400.jpg',
    ingredients: ['100% Natural Whole Grain Rolled Oats'],
    tags: ['whole-grain', 'oats', 'fiber'],
    score: 94,
    avoidIf: ['Coeliac disease (cross-contamination risk)'],
    goodFor: ['Heart health', 'High-fiber diets', 'Weight management'],
    factors: [
      {
        key: 'wholegrain',
        impact: 'positive',
        points: 25,
        reason: '+ 100% whole grain, rich in beta-glucan',
      },
      {
        key: 'single',
        impact: 'positive',
        points: 25,
        reason: '+ Single ingredient — zero additives',
      },
      { key: 'fiber', impact: 'positive', points: 18, reason: '+ 4g fibre lowers cholesterol' },
    ],
  });

  add({
    cat: cCereal,
    name: 'Honey Nut Cheerios',
    brand: 'General Mills',
    barcode: '016000275287',
    image: 'https://images.openfoodfacts.org/images/products/001/600/027/5287/front_en.3.400.jpg',
    ingredients: [
      'Whole Grain Oats',
      'Sugar',
      'Honey',
      'Brown Sugar Syrup',
      'Modified Corn Starch',
    ],
    tags: ['honey', 'oats', 'whole-grain', 'fortified'],
    score: 63,
    avoidIf: ['Diabetes', 'Added sugar sensitivity'],
    goodFor: ['Kids breakfast'],
    factors: [
      {
        key: 'wholegrain',
        impact: 'positive',
        points: 15,
        reason: '+ First ingredient whole grain oats',
      },
      {
        key: 'sugar',
        impact: 'negative',
        points: -18,
        reason: '- 9g sugar including added sugars',
      },
      { key: 'additives', impact: 'negative', points: -8, reason: '- Modified corn starch' },
    ],
  });

  // ── PROTEIN ───────────────────────────────────────────────────────────────
  add({
    cat: cProtein,
    name: 'Gold Standard 100% Whey',
    brand: 'Optimum Nutrition',
    barcode: '748927024890',
    image: 'https://images.openfoodfacts.org/images/products/074/892/702/4890/front_en.3.400.jpg',
    ingredients: [
      'Whey Protein Isolate',
      'Whey Protein Concentrate',
      'Cocoa',
      'Lecithin',
      'Acesulfame Potassium',
      'Sucralose',
    ],
    tags: ['whey', 'protein', 'post-workout'],
    score: 79,
    avoidIf: ['Lactose intolerance', 'Artificial sweetener sensitivity'],
    goodFor: ['Muscle building', 'Post-workout recovery'],
    factors: [
      {
        key: 'protein',
        impact: 'positive',
        points: 25,
        reason: '+ 24g whey isolate — fast absorbing',
      },
      { key: 'bcaa', impact: 'positive', points: 15, reason: '+ 5.5g BCAAs per serving' },
      { key: 'artificial', impact: 'negative', points: -12, reason: '- Acesulfame K + sucralose' },
    ],
  });

  await Prod.insertMany(products);
  console.log(`✅ ${products.length} products`);

  await Sc.insertMany(scores);
  console.log(`✅ ${scores.length} scores`);

  // ── RANKINGS ──────────────────────────────────────────────────────────────
  const byCat: Record<string, { pid: string; score: number }[]> = {};
  for (const e of entries) {
    (byCat[e.cat] ??= []).push({ pid: e.pid, score: e.score });
  }

  const rankings: any[] = [];
  for (const [cat, list] of Object.entries(byCat)) {
    list
      .sort((a, b) => b.score - a.score)
      .forEach((e, i) => {
        rankings.push({
          _id: id(),
          categoryId: cat,
          productId: e.pid,
          rank: i + 1,
          score: e.score,
          computedAt: now(),
        });
      });
  }

  await Rank.insertMany(rankings);
  console.log(`✅ ${rankings.length} rankings`);

  await mongoose.disconnect();
  console.log('\n🌿 Fern seed complete!');
}

main().catch((e) => {
  console.error('❌', e);
  process.exit(1);
});
