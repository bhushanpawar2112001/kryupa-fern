/**
 * Plain-Language Product Summary
 *
 * Converts raw product data into a short, jargon-free summary that any
 * normal person — not a nutritionist or medical student — can understand.
 *
 * Tone: like a knowledgeable friend explaining something over chai.
 * Focus: What is this? Is it good for me? What should I watch out for?
 */

import { CatalogProduct } from './open-food-facts.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function round1(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

// ─── NOVA plain language ──────────────────────────────────────────────────────

const NOVA_PLAIN: Record<number, string> = {
  1: 'minimally processed (e.g. fresh/dried ingredients)',
  2: 'processed culinary ingredient (e.g. oil, flour, sugar)',
  3: 'processed food (has some additives)',
  4: 'ultra-processed — made mostly in a factory with many additives',
};

// ─── Nutri-Score plain language ───────────────────────────────────────────────

const NUTRISCORE_PLAIN: Record<string, string> = {
  a: 'very good nutritional quality',
  b: 'good nutritional quality',
  c: 'average nutritional quality',
  d: 'below average nutritional quality',
  e: 'poor nutritional quality',
};

// ─── Well-known Indian brand descriptions ─────────────────────────────────────

const INDIAN_BRAND_NOTES: Record<string, string> = {
  amul: 'Amul is India\'s largest dairy cooperative, known for milk, butter, cheese and ice cream.',
  parle: 'Parle is one of India\'s oldest biscuit and snack brands.',
  haldirams: "Haldiram's is a popular Indian snack brand known for namkeen, sweets and ready-to-eat snacks.",
  haldiram: "Haldiram's is a popular Indian snack brand known for namkeen, sweets and ready-to-eat snacks.",
  dabur: 'Dabur is a leading Indian FMCG brand making health foods, juices and Ayurvedic products.',
  patanjali: 'Patanjali is an Indian brand focused on natural and Ayurvedic products.',
  'britannia industries': "Britannia is one of India's largest food companies, known for biscuits and dairy.",
  britannia: "Britannia is one of India's largest food companies, known for biscuits and dairy.",
  itc: 'ITC is a major Indian conglomerate whose food brands include Aashirvaad, Sunfeast and Bingo.',
  aashirvaad: 'Aashirvaad (ITC) is India\'s No. 1 atta (wheat flour) brand.',
  sunfeast: 'Sunfeast (ITC) is a popular Indian biscuit and noodle brand.',
  maggi: 'Maggi (Nestlé India) is the iconic instant noodle brand in India.',
  nestle: 'Nestlé India makes popular products like Maggi, KitKat, and Munch.',
  maaza: 'Maaza (Coca-Cola India) is a popular mango drink brand.',
  frooti: 'Frooti (Parle Agro) is India\'s well-known mango fruit drink.',
  appy: 'Appy (Parle Agro) is a popular apple juice drink in India.',
  lijjat: 'Lijjat Papad is a famous Indian cooperative brand known for papads.',
  mtr: 'MTR Foods is a Bangalore-based brand known for ready-to-eat meals and spice mixes.',
  eastern: 'Eastern Condiments is a popular Kerala-based spice brand.',
  priya: 'Priya (ITC) is a well-known brand for pickles and condiments.',
  kissan: 'Kissan (HUL) makes jams, ketchups and squashes popular across India.',
  complan: 'Complan (Kraft Heinz) is a nutrition drink popular for children in India.',
  horlicks: 'Horlicks (HUL) is a popular malt-based health drink widely consumed in India.',
  boost: 'Boost (HUL) is an energy and sports drink popular among children in India.',
  bournvita: "Bournvita (Mondelez) is one of India's most popular chocolate health drinks.",
  dettol: 'Dettol (Reckitt) is a trusted antiseptic and hygiene brand in India.',
  lifebuoy: 'Lifebuoy (HUL) is one of the oldest and most popular soap brands in India.',
  himalaya: 'Himalaya Drug Company makes natural and Ayurvedic personal care and health products.',
  'vicco': 'Vicco is an Indian brand known for Ayurvedic personal care products like Vicco Vajradanti.',
  'cavinkare': 'CavinKare is an Indian FMCG brand known for Chik shampoo and Fairever cream.',
  sunsilk: 'Sunsilk (HUL) is a popular hair care brand across India.',
  clinic: 'Clinic Plus (HUL) is a widely used shampoo brand in Indian households.',
  meswak: 'Meswak (Dabur) is an Ayurvedic toothpaste based on the miswak herb.',
  'colgate': 'Colgate is the most widely used toothpaste brand in India.',
  pepsodent: 'Pepsodent (HUL) is a popular toothpaste brand known for germ protection.',
};

function getBrandNote(brand: string): string | null {
  const key = brand.toLowerCase().trim();
  for (const [brandKey, note] of Object.entries(INDIAN_BRAND_NOTES)) {
    if (key.includes(brandKey)) return note;
  }
  return null;
}

// ─── Category plain names ─────────────────────────────────────────────────────

function kindLabel(kind: CatalogProduct['kind']): string {
  if (kind === 'beauty') return 'personal care product';
  if (kind === 'pharma') return 'medicine / health product';
  return 'food product';
}

// ─── Main export ──────────────────────────────────────────────────────────────

export interface PlainSummary {
  /** One-line "what is this" statement */
  whatIsThis: string;
  /** 2-3 sentences a regular person can understand */
  overview: string;
  /** Up to 3 positive highlights in plain language */
  goodPoints: string[];
  /** Up to 3 things to watch out for */
  watchOut: string[];
  /** Brand context (especially useful for Indian brands) */
  brandNote: string | null;
  /** Simple advice line */
  bottomLine: string;
}

export function buildPlainSummary(catalog: CatalogProduct): PlainSummary {
  const { name, brand, kind, nutriscoreGrade, novaGroup, nutriments, allergens, additivesCount } =
    catalog;

  const goodPoints: string[] = [];
  const watchOut: string[] = [];

  // ── What is this ────────────────────────────────────────────────────────
  const whatIsThis = `${name} by ${brand} — a ${kindLabel(kind)}.`;

  // ── Overview sentences ──────────────────────────────────────────────────
  const parts: string[] = [];

  if (nutriscoreGrade) {
    parts.push(
      `It has a Nutri-Score of ${nutriscoreGrade.toUpperCase()}, which means ${NUTRISCORE_PLAIN[nutriscoreGrade.toLowerCase()] ?? 'its nutritional quality has been rated'}.`,
    );
  }

  if (novaGroup) {
    parts.push(`Processing level: ${NOVA_PLAIN[novaGroup] ?? `NOVA group ${novaGroup}`}.`);
  }

  if (kind === 'pharma') {
    parts.push(
      'This is a health or medicine product — always follow the dosage on the pack or ask your doctor/pharmacist.',
    );
  }

  // ── Good points ─────────────────────────────────────────────────────────
  const protein = nutriments['proteins_100g'];
  if (protein != null && protein >= 10) {
    goodPoints.push(`High in protein (${round1(protein)}g per 100g) — good for muscles and keeping you full.`);
  }

  const fiber = nutriments['fiber_100g'];
  if (fiber != null && fiber >= 4) {
    goodPoints.push(`Good source of fibre (${round1(fiber)}g per 100g) — helps digestion and keeps you full longer.`);
  }

  if (additivesCount === 0) {
    goodPoints.push('No additives — what you see on the label is what you get.');
  } else if (additivesCount != null && additivesCount <= 2) {
    goodPoints.push('Very few additives — relatively clean formula.');
  }

  const sugars = nutriments['sugars_100g'];
  if (sugars != null && sugars <= 5) {
    goodPoints.push(`Low sugar (${round1(sugars)}g per 100g) — a good choice if you\'re watching your sugar intake.`);
  }

  const sodium = nutriments['sodium_100g'] ?? (nutriments['salt_100g'] ? nutriments['salt_100g'] * 0.4 : null);
  if (sodium != null && sodium <= 0.1) {
    goodPoints.push('Very low sodium — a heart-friendly choice.');
  }

  if (nutriscoreGrade && ['a', 'b'].includes(nutriscoreGrade.toLowerCase())) {
    if (!goodPoints.length) {
      goodPoints.push('Nutritionally well-balanced overall.');
    }
  }

  if (catalog.labels.some((l) => /organic/i.test(l))) {
    goodPoints.push('Certified organic — no synthetic pesticides.');
  }
  if (catalog.labels.some((l) => /vegan/i.test(l))) {
    goodPoints.push('Vegan — contains no animal products.');
  }

  // ── Watch out ────────────────────────────────────────────────────────────
  if (sugars != null && sugars >= 15) {
    watchOut.push(`High in sugar (${round1(sugars)}g per 100g) — people with diabetes or those watching calories should be careful.`);
  }

  const salt = nutriments['salt_100g'];
  if (salt != null && salt >= 1.5) {
    watchOut.push(`High in salt (${round1(salt)}g per 100g) — not ideal if you have high blood pressure.`);
  }

  if (additivesCount != null && additivesCount >= 5) {
    watchOut.push(`Contains ${additivesCount} additives — people sensitive to food additives may want to check the ingredient list.`);
  }

  if (novaGroup === 4) {
    watchOut.push('Heavily processed — best enjoyed occasionally rather than every day.');
  }

  // Add allergens in plain language (first 3)
  for (const allergen of allergens.slice(0, 3)) {
    watchOut.push(`Contains ${allergen} — avoid if you have a ${allergen} allergy.`);
  }

  // ── Bottom line ──────────────────────────────────────────────────────────
  let bottomLine: string;
  if (kind === 'pharma') {
    bottomLine = 'Always use as directed on the pack. When in doubt, consult a doctor or pharmacist.';
  } else if (nutriscoreGrade && ['a', 'b'].includes(nutriscoreGrade.toLowerCase())) {
    bottomLine = 'A solid choice — fits well into a balanced daily diet.';
  } else if (nutriscoreGrade === 'c') {
    bottomLine = 'Decent choice — fine in moderation as part of a varied diet.';
  } else if (nutriscoreGrade && ['d', 'e'].includes(nutriscoreGrade.toLowerCase())) {
    bottomLine = 'Best as an occasional treat rather than an everyday staple.';
  } else if (kind === 'beauty') {
    bottomLine = 'Check the ingredient list if you have sensitive skin or known allergies.';
  } else {
    bottomLine = 'Check the ingredients and nutrition label to decide if it fits your needs.';
  }

  return {
    whatIsThis,
    overview: parts.join(' ') || `This is a ${kindLabel(kind)} made by ${brand}.`,
    goodPoints: goodPoints.slice(0, 4),
    watchOut: watchOut.slice(0, 4),
    brandNote: getBrandNote(brand),
    bottomLine,
  };
}
