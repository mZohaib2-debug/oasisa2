import { TAXONOMY } from './taxonomy';

/**
 * DEMO product catalog. Prices are illustrative sample data, not real OasisA2
 * prices. Every product created from this file is stored with `isDemo: true`.
 */

export type SeedUnitType = 'EACH' | 'WEIGHT';
export type SeedHalal = 'HALAL_CERTIFIED' | 'HALAL' | 'NOT_APPLICABLE';
export type SeedTax = 'TAXABLE' | 'EXEMPT';
export type ButcherKind = 'beef' | 'goat' | 'lamb' | 'chicken';

export interface SeedVariant {
  sku: string;
  name: string;
  packageSize: string;
  priceDeltaCents: number;
  isDefault?: boolean;
}

export interface SeedStoreOverride {
  /** cents; creates an active sale at this store */
  salePriceCents?: number;
  /** starting on-hand quantity at this store */
  quantityOnHand?: number;
  /** force an inventory state (e.g. OUT_OF_STOCK in one branch only) */
  state?: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'TEMPORARILY_UNAVAILABLE';
}

export interface SeedProduct {
  sku: string;
  slug: string;
  name: string;
  shortDescription: string;
  description?: string;
  departmentSlug: string;
  categorySlug: string;
  subcategorySlug?: string;
  brandSlug?: string;
  unitType: SeedUnitType;
  packageSize?: string;
  netWeightLb?: number;
  /** required for EACH items; WEIGHT items use pricePerPoundCents instead */
  basePriceCents?: number;
  compareAtPriceCents?: number;
  pricePerPoundCents?: number;
  averageWeightLb?: number;
  taxStatus?: SeedTax;
  halalStatus?: SeedHalal;
  countryOfOrigin?: string;
  storageInstructions?: string;
  ingredients?: string;
  allergens?: string[];
  keywords: string[];
  featured?: boolean;
  newArrival?: boolean;
  butcher?: ButcherKind;
  variants?: SeedVariant[];
  glenBurnie?: SeedStoreOverride;
  fredericksburg?: SeedStoreOverride;
}

const RICE_BAG_VARIANTS = (sku: string, base: number): SeedVariant[] => [
  { sku: `${sku}-2`, name: '2 lb', packageSize: '2 lb', priceDeltaCents: 0, isDefault: false },
  { sku: `${sku}-5`, name: '5 lb', packageSize: '5 lb', priceDeltaCents: base, isDefault: true },
  { sku: `${sku}-10`, name: '10 lb', packageSize: '10 lb', priceDeltaCents: base * 3 },
  { sku: `${sku}-20`, name: '20 lb', packageSize: '20 lb', priceDeltaCents: base * 7 },
  { sku: `${sku}-40`, name: '40 lb', packageSize: '40 lb', priceDeltaCents: base * 15 },
];

export const HERO_PRODUCTS: SeedProduct[] = [
  // --- Halal meat (weighted, butcher-enabled) ------------------------------
  {
    sku: 'MEAT-BEEF-GROUND',
    slug: 'halal-ground-beef',
    name: 'Halal Ground Beef',
    shortDescription: 'Fresh-ground 80/20 halal beef.',
    description:
      'Ground fresh in-store daily from 100% halal beef. Choose your approximate weight; final price is set from the actual prepared weight at pack time.',
    departmentSlug: 'meat-poultry',
    categorySlug: 'beef',
    subcategorySlug: 'ground-beef',
    unitType: 'WEIGHT',
    pricePerPoundCents: 649,
    averageWeightLb: 2,
    halalStatus: 'HALAL',
    storageInstructions: 'Keep refrigerated at or below 40°F. Freeze for longer storage.',
    countryOfOrigin: 'USA',
    keywords: ['keema', 'qeema', 'mince', 'ground beef', 'gosht'],
    featured: true,
    butcher: 'beef',
    glenBurnie: { salePriceCents: 599, quantityOnHand: 60 },
    fredericksburg: { quantityOnHand: 45 },
  },
  {
    sku: 'MEAT-GOAT-CURRY',
    slug: 'halal-goat-curry-cut',
    name: 'Halal Goat — Curry Cut',
    shortDescription: 'Bone-in goat, cut fresh for curry.',
    description:
      'Whole-muscle halal goat, cut to order. Select piece size and bone preference, and leave a note for the butcher.',
    departmentSlug: 'meat-poultry',
    categorySlug: 'goat',
    subcategorySlug: 'goat-curry-cut',
    unitType: 'WEIGHT',
    pricePerPoundCents: 999,
    averageWeightLb: 3,
    halalStatus: 'HALAL',
    storageInstructions: 'Keep refrigerated at or below 40°F.',
    countryOfOrigin: 'USA',
    keywords: ['bakra', 'goat', 'mutton', 'gosht', 'curry cut', 'bone-in'],
    featured: true,
    butcher: 'goat',
    glenBurnie: { quantityOnHand: 30 },
    fredericksburg: { quantityOnHand: 22 },
  },
  {
    sku: 'MEAT-LAMB-CHOPS',
    slug: 'halal-lamb-chops',
    name: 'Halal Lamb Chops',
    shortDescription: 'Frenched halal lamb rib chops.',
    departmentSlug: 'meat-poultry',
    categorySlug: 'lamb',
    subcategorySlug: 'lamb-chops',
    unitType: 'WEIGHT',
    pricePerPoundCents: 1299,
    averageWeightLb: 2,
    halalStatus: 'HALAL',
    countryOfOrigin: 'Australia',
    keywords: ['lamb', 'chops', 'raan', 'gosht'],
    butcher: 'lamb',
    glenBurnie: { quantityOnHand: 18 },
    fredericksburg: { quantityOnHand: 14 },
  },
  {
    sku: 'MEAT-CHKN-WHOLE',
    slug: 'halal-whole-chicken',
    name: 'Halal Whole Chicken',
    shortDescription: 'Air-chilled halal whole chicken.',
    departmentSlug: 'meat-poultry',
    categorySlug: 'chicken',
    subcategorySlug: 'whole-chicken',
    unitType: 'WEIGHT',
    pricePerPoundCents: 279,
    averageWeightLb: 4,
    halalStatus: 'HALAL_CERTIFIED',
    countryOfOrigin: 'USA',
    keywords: ['murgh', 'chicken', 'whole chicken', 'poultry'],
    featured: true,
    butcher: 'chicken',
    glenBurnie: { salePriceCents: 239, quantityOnHand: 80 },
    fredericksburg: { quantityOnHand: 65 },
  },
  {
    sku: 'MEAT-CHKN-BONELESS',
    slug: 'halal-boneless-chicken-breast',
    name: 'Halal Boneless Chicken Breast',
    shortDescription: 'Trimmed boneless, skinless halal chicken breast.',
    departmentSlug: 'meat-poultry',
    categorySlug: 'chicken',
    subcategorySlug: 'boneless-chicken',
    unitType: 'WEIGHT',
    pricePerPoundCents: 499,
    averageWeightLb: 2.5,
    halalStatus: 'HALAL_CERTIFIED',
    countryOfOrigin: 'USA',
    keywords: ['murgh', 'boneless', 'chicken breast', 'tikka'],
    butcher: 'chicken',
    glenBurnie: { quantityOnHand: 50 },
    fredericksburg: { quantityOnHand: 0, state: 'OUT_OF_STOCK' },
  },
  {
    sku: 'MEAT-BEEF-BONES',
    slug: 'halal-beef-soup-bones',
    name: 'Halal Beef Soup Bones (Nihari / Paya)',
    shortDescription: 'Marrow and knuckle bones for nihari and paya.',
    departmentSlug: 'meat-poultry',
    categorySlug: 'beef',
    subcategorySlug: 'beef-bones',
    unitType: 'WEIGHT',
    pricePerPoundCents: 349,
    averageWeightLb: 3,
    halalStatus: 'HALAL',
    keywords: ['nihari', 'paya', 'bones', 'marrow', 'nalli'],
    butcher: 'beef',
    glenBurnie: { quantityOnHand: 25 },
    fredericksburg: { quantityOnHand: 20 },
  },
  {
    sku: 'MEAT-FROZEN-SEEKH',
    slug: 'frozen-halal-seekh-kabab',
    name: 'Frozen Halal Seekh Kabab',
    shortDescription: 'Ready-to-cook beef seekh kababs, 12 ct.',
    departmentSlug: 'meat-poultry',
    categorySlug: 'frozen-halal-meat',
    subcategorySlug: 'seekh-kabab',
    brandSlug: 'oasisa2-kitchen',
    unitType: 'EACH',
    packageSize: '12 ct / 800 g',
    netWeightLb: 1.76,
    basePriceCents: 899,
    halalStatus: 'HALAL',
    allergens: ['none'],
    keywords: ['seekh', 'kabab', 'kebab', 'frozen', 'beef'],
    glenBurnie: { quantityOnHand: 40 },
    fredericksburg: { quantityOnHand: 35 },
  },

  // --- Rice & grains (EACH with bag-size variants) -------------------------
  {
    sku: 'RICE-BASMATI-WHITE',
    slug: 'white-basmati-rice',
    name: 'White Basmati Rice',
    shortDescription: 'Long-grain aromatic basmati.',
    departmentSlug: 'rice-grains',
    categorySlug: 'basmati-rice',
    subcategorySlug: 'white-basmati',
    brandSlug: 'sun-valley',
    unitType: 'EACH',
    packageSize: '5 lb',
    basePriceCents: 799,
    compareAtPriceCents: 999,
    countryOfOrigin: 'Pakistan',
    keywords: ['chawal', 'basmati', 'rice', 'long grain'],
    featured: true,
    variants: RICE_BAG_VARIANTS('RICE-BASMATI-WHITE', 600),
    glenBurnie: { salePriceCents: 699, quantityOnHand: 120 },
    fredericksburg: { quantityOnHand: 90 },
  },
  {
    sku: 'RICE-SELLA',
    slug: 'golden-sella-basmati-rice',
    name: 'Golden Sella Basmati Rice',
    shortDescription: 'Parboiled sella basmati — stays separate for biryani.',
    departmentSlug: 'rice-grains',
    categorySlug: 'specialty-rice',
    subcategorySlug: 'sella-rice',
    brandSlug: 'sun-valley',
    unitType: 'EACH',
    packageSize: '5 lb',
    basePriceCents: 899,
    countryOfOrigin: 'India',
    keywords: ['sella', 'biryani', 'parboiled', 'chawal'],
    variants: RICE_BAG_VARIANTS('RICE-SELLA', 700),
    glenBurnie: { quantityOnHand: 70 },
    fredericksburg: { quantityOnHand: 55 },
  },

  // --- Flour & atta -------------------------------------------------------
  {
    sku: 'ATTA-CHAKKI',
    slug: 'chakki-fresh-atta',
    name: 'Chakki Fresh Whole Wheat Atta',
    shortDescription: 'Stone-ground whole wheat flour for soft rotis.',
    departmentSlug: 'flour-atta',
    categorySlug: 'wheat-flour',
    subcategorySlug: 'chakki-atta',
    brandSlug: 'dawn',
    unitType: 'EACH',
    packageSize: '10 lb',
    basePriceCents: 1099,
    keywords: ['atta', 'flour', 'wheat', 'roti', 'chapati'],
    featured: true,
    variants: [
      { sku: 'ATTA-CHAKKI-10', name: '10 lb', packageSize: '10 lb', priceDeltaCents: 0, isDefault: true },
      { sku: 'ATTA-CHAKKI-20', name: '20 lb', packageSize: '20 lb', priceDeltaCents: 900 },
    ],
    glenBurnie: { quantityOnHand: 60 },
    fredericksburg: { quantityOnHand: 48 },
  },
  {
    sku: 'FLOUR-BESAN',
    slug: 'besan-gram-flour',
    name: 'Besan (Gram Flour)',
    shortDescription: 'Fine chickpea flour for pakora and kadhi.',
    departmentSlug: 'flour-atta',
    categorySlug: 'refined-and-specialty-flour',
    subcategorySlug: 'besan',
    brandSlug: 'dawn',
    unitType: 'EACH',
    packageSize: '2 lb',
    basePriceCents: 449,
    keywords: ['besan', 'gram flour', 'chickpea flour', 'pakora'],
    glenBurnie: { quantityOnHand: 40 },
    fredericksburg: { quantityOnHand: 30 },
  },

  // --- Lentils ---------------------------------------------------------
  {
    sku: 'DAL-MASOOR',
    slug: 'masoor-dal-red-lentils',
    name: 'Masoor Dal (Red Lentils)',
    shortDescription: 'Split red lentils, quick-cooking.',
    departmentSlug: 'lentils-pulses',
    categorySlug: 'dal',
    subcategorySlug: 'masoor-dal',
    unitType: 'EACH',
    packageSize: '4 lb',
    basePriceCents: 599,
    keywords: ['masoor', 'dal', 'daal', 'red lentil', 'lentil'],
    featured: true,
    glenBurnie: { quantityOnHand: 55 },
    fredericksburg: { quantityOnHand: 40 },
  },
  {
    sku: 'DAL-CHANA',
    slug: 'chana-dal',
    name: 'Chana Dal',
    shortDescription: 'Split Bengal gram.',
    departmentSlug: 'lentils-pulses',
    categorySlug: 'dal',
    subcategorySlug: 'chana-dal',
    unitType: 'EACH',
    packageSize: '4 lb',
    basePriceCents: 649,
    keywords: ['chana', 'channa', 'dal', 'bengal gram', 'chickpea'],
    glenBurnie: { quantityOnHand: 45 },
    fredericksburg: { quantityOnHand: 35 },
  },

  // --- Spices & masalas -------------------------------------------------
  {
    sku: 'MASALA-SHAN-BIRYANI',
    slug: 'shan-biryani-masala',
    name: 'Shan Bombay Biryani Masala',
    shortDescription: 'Recipe mix for classic biryani.',
    departmentSlug: 'spices-masalas',
    categorySlug: 'recipe-masala-mixes',
    subcategorySlug: 'biryani-masala',
    brandSlug: 'shan',
    unitType: 'EACH',
    packageSize: '60 g',
    basePriceCents: 199,
    allergens: ['mustard'],
    keywords: ['biryani', 'masala', 'shan', 'spice mix'],
    featured: true,
    newArrival: true,
    glenBurnie: { quantityOnHand: 90 },
    fredericksburg: { quantityOnHand: 75 },
  },
  {
    sku: 'MASALA-NATIONAL-NIHARI',
    slug: 'national-nihari-masala',
    name: 'National Nihari Masala',
    shortDescription: 'Slow-cook nihari spice blend.',
    departmentSlug: 'spices-masalas',
    categorySlug: 'recipe-masala-mixes',
    subcategorySlug: 'nihari-masala',
    brandSlug: 'national',
    unitType: 'EACH',
    packageSize: '40 g',
    basePriceCents: 189,
    keywords: ['nihari', 'masala', 'national'],
    glenBurnie: { quantityOnHand: 70 },
    fredericksburg: { quantityOnHand: 60 },
  },
  {
    sku: 'SPICE-TURMERIC',
    slug: 'ground-turmeric-haldi',
    name: 'Ground Turmeric (Haldi)',
    shortDescription: 'Pure ground turmeric.',
    departmentSlug: 'spices-masalas',
    categorySlug: 'ground-spices',
    subcategorySlug: 'turmeric',
    brandSlug: 'mdh',
    unitType: 'EACH',
    packageSize: '400 g',
    basePriceCents: 399,
    keywords: ['haldi', 'turmeric', 'ground spice'],
    glenBurnie: { quantityOnHand: 80 },
    fredericksburg: { quantityOnHand: 64 },
  },
  {
    sku: 'SPICE-REDCHILI',
    slug: 'red-chili-powder-lal-mirch',
    name: 'Red Chili Powder (Lal Mirch)',
    shortDescription: 'Medium-hot ground red chili.',
    departmentSlug: 'spices-masalas',
    categorySlug: 'ground-spices',
    subcategorySlug: 'red-chili-powder',
    brandSlug: 'mdh',
    unitType: 'EACH',
    packageSize: '400 g',
    basePriceCents: 429,
    keywords: ['lal mirch', 'mirch', 'chili powder', 'red chili'],
    glenBurnie: { quantityOnHand: 75 },
    fredericksburg: { quantityOnHand: 58 },
  },
  {
    sku: 'SPICE-CUMIN-SEED',
    slug: 'cumin-seeds-zeera',
    name: 'Cumin Seeds (Zeera)',
    shortDescription: 'Whole cumin seed.',
    departmentSlug: 'spices-masalas',
    categorySlug: 'whole-spices',
    subcategorySlug: 'cumin-seeds',
    brandSlug: 'everest',
    unitType: 'EACH',
    packageSize: '200 g',
    basePriceCents: 349,
    keywords: ['zeera', 'jeera', 'cumin', 'whole spice'],
    glenBurnie: { quantityOnHand: 66 },
    fredericksburg: { quantityOnHand: 50 },
  },

  // --- Oils & ghee ----------------------------------------------------
  {
    sku: 'GHEE-PURE',
    slug: 'pure-desi-ghee',
    name: 'Pure Desi Ghee',
    shortDescription: 'Clarified butter, rich aroma.',
    departmentSlug: 'oils-ghee',
    categorySlug: 'ghee',
    subcategorySlug: 'pure-ghee',
    brandSlug: 'dawn',
    unitType: 'EACH',
    packageSize: '1.8 kg',
    basePriceCents: 1699,
    compareAtPriceCents: 1899,
    allergens: ['milk'],
    keywords: ['ghee', 'desi ghee', 'clarified butter'],
    featured: true,
    glenBurnie: { salePriceCents: 1499, quantityOnHand: 40 },
    fredericksburg: { quantityOnHand: 30 },
  },

  // --- Dairy --------------------------------------------------------
  {
    sku: 'DAIRY-YOGURT-PLAIN',
    slug: 'plain-whole-milk-yogurt',
    name: 'Plain Whole Milk Yogurt',
    shortDescription: 'Thick unsweetened dahi.',
    departmentSlug: 'dairy-eggs',
    categorySlug: 'yogurt-and-paneer',
    subcategorySlug: 'plain-yogurt',
    unitType: 'EACH',
    packageSize: '32 oz',
    basePriceCents: 399,
    allergens: ['milk'],
    keywords: ['dahi', 'yogurt', 'curd'],
    glenBurnie: { quantityOnHand: 50 },
    fredericksburg: { quantityOnHand: 44 },
  },
  {
    sku: 'DAIRY-PANEER',
    slug: 'fresh-paneer',
    name: 'Fresh Paneer',
    shortDescription: 'Firm Indian cottage cheese.',
    departmentSlug: 'dairy-eggs',
    categorySlug: 'yogurt-and-paneer',
    subcategorySlug: 'paneer',
    brandSlug: 'oasisa2-kitchen',
    unitType: 'EACH',
    packageSize: '14 oz',
    basePriceCents: 549,
    allergens: ['milk'],
    keywords: ['paneer', 'cheese', 'cottage cheese'],
    newArrival: true,
    glenBurnie: { quantityOnHand: 24 },
    fredericksburg: { quantityOnHand: 18 },
  },
  {
    sku: 'DAIRY-EGGS-LARGE',
    slug: 'large-eggs-dozen',
    name: 'Large Eggs, Dozen',
    shortDescription: 'Grade A large eggs.',
    departmentSlug: 'dairy-eggs',
    categorySlug: 'eggs',
    subcategorySlug: 'large-eggs',
    unitType: 'EACH',
    packageSize: '12 ct',
    basePriceCents: 349,
    allergens: ['egg'],
    keywords: ['eggs', 'anda', 'dozen'],
    glenBurnie: { quantityOnHand: 90 },
    fredericksburg: { quantityOnHand: 80 },
  },

  // --- Produce (mix of EACH and WEIGHT) -----------------------------
  {
    sku: 'PROD-ONION-YELLOW',
    slug: 'yellow-onions',
    name: 'Yellow Onions',
    shortDescription: 'Everyday cooking onions, sold by the pound.',
    departmentSlug: 'produce',
    categorySlug: 'vegetables',
    subcategorySlug: 'onions',
    unitType: 'WEIGHT',
    pricePerPoundCents: 99,
    averageWeightLb: 3,
    keywords: ['pyaz', 'onion', 'vegetable'],
    featured: true,
    glenBurnie: { quantityOnHand: 200 },
    fredericksburg: { quantityOnHand: 160 },
  },
  {
    sku: 'PROD-TOMATO-ROMA',
    slug: 'roma-tomatoes',
    name: 'Roma Tomatoes',
    shortDescription: 'Firm plum tomatoes for curry and salan.',
    departmentSlug: 'produce',
    categorySlug: 'vegetables',
    subcategorySlug: 'tomatoes',
    unitType: 'WEIGHT',
    pricePerPoundCents: 149,
    averageWeightLb: 2,
    keywords: ['tamatar', 'tomato', 'vegetable'],
    glenBurnie: { quantityOnHand: 150 },
    fredericksburg: { quantityOnHand: 120 },
  },
  {
    sku: 'PROD-GINGER',
    slug: 'fresh-ginger',
    name: 'Fresh Ginger',
    shortDescription: 'Young ginger root.',
    departmentSlug: 'produce',
    categorySlug: 'vegetables',
    subcategorySlug: 'ginger-and-garlic',
    unitType: 'WEIGHT',
    pricePerPoundCents: 299,
    averageWeightLb: 0.5,
    keywords: ['adrak', 'ginger'],
    glenBurnie: { quantityOnHand: 60 },
    fredericksburg: { quantityOnHand: 45 },
  },
  {
    sku: 'PROD-CILANTRO',
    slug: 'fresh-cilantro-bunch',
    name: 'Fresh Cilantro (Bunch)',
    shortDescription: 'Green coriander, sold per bunch.',
    departmentSlug: 'produce',
    categorySlug: 'herbs',
    subcategorySlug: 'cilantro',
    unitType: 'EACH',
    packageSize: '1 bunch',
    basePriceCents: 99,
    keywords: ['dhania', 'cilantro', 'coriander', 'hara dhania'],
    glenBurnie: { quantityOnHand: 80 },
    fredericksburg: { quantityOnHand: 70 },
  },
  {
    sku: 'PROD-OKRA',
    slug: 'fresh-okra-bhindi',
    name: 'Fresh Okra (Bhindi)',
    shortDescription: 'Tender young okra pods.',
    departmentSlug: 'produce',
    categorySlug: 'vegetables',
    subcategorySlug: 'okra',
    unitType: 'WEIGHT',
    pricePerPoundCents: 249,
    averageWeightLb: 1,
    keywords: ['bhindi', 'okra', 'ladyfinger'],
    glenBurnie: { quantityOnHand: 40 },
    fredericksburg: { quantityOnHand: 30 },
  },
  {
    sku: 'PROD-MANGO-CASE',
    slug: 'kesar-mango-case',
    name: 'Kesar Mango (Case)',
    shortDescription: 'Seasonal sweet Kesar mangoes, full case.',
    departmentSlug: 'produce',
    categorySlug: 'fruits',
    subcategorySlug: 'mangoes',
    unitType: 'EACH',
    packageSize: '1 case (~9 ct)',
    basePriceCents: 2499,
    keywords: ['aam', 'mango', 'kesar', 'seasonal'],
    featured: true,
    newArrival: true,
    glenBurnie: { quantityOnHand: 20 },
    fredericksburg: { quantityOnHand: 15 },
  },

  // --- Frozen -------------------------------------------------------
  {
    sku: 'FROZ-PARATHA',
    slug: 'frozen-plain-paratha-5pk',
    name: 'Frozen Plain Paratha (5-pack)',
    shortDescription: 'Flaky layered paratha, ready in minutes.',
    departmentSlug: 'frozen',
    categorySlug: 'frozen-breads',
    subcategorySlug: 'paratha',
    brandSlug: 'dawn',
    unitType: 'EACH',
    packageSize: '5 ct',
    basePriceCents: 449,
    allergens: ['wheat'],
    keywords: ['paratha', 'frozen bread', 'roti'],
    featured: true,
    glenBurnie: { quantityOnHand: 100 },
    fredericksburg: { quantityOnHand: 85 },
  },
  {
    sku: 'FROZ-SAMOSA',
    slug: 'frozen-vegetable-samosa-20pk',
    name: 'Frozen Vegetable Samosa (20-pack)',
    shortDescription: 'Party-size box of veg samosas.',
    departmentSlug: 'frozen',
    categorySlug: 'frozen-snacks',
    subcategorySlug: 'samosa',
    brandSlug: 'dawn',
    unitType: 'EACH',
    packageSize: '20 ct',
    basePriceCents: 799,
    allergens: ['wheat'],
    keywords: ['samosa', 'frozen snack', 'ramadan'],
    glenBurnie: { quantityOnHand: 60 },
    fredericksburg: { quantityOnHand: 50 },
  },

  // --- Beverages / Ramadan ---------------------------------------
  {
    sku: 'BEV-ROSE-SYRUP',
    slug: 'rose-syrup-sharbat',
    name: 'Rose Syrup (Sharbat)',
    shortDescription: 'Rose-flavored drink syrup for iftar.',
    departmentSlug: 'beverages',
    categorySlug: 'syrups-and-squash',
    subcategorySlug: 'rose-syrup',
    brandSlug: 'laziza',
    unitType: 'EACH',
    packageSize: '800 ml',
    basePriceCents: 599,
    keywords: ['rooh afza', 'rose syrup', 'sharbat', 'ramadan', 'iftar'],
    featured: true,
    glenBurnie: { quantityOnHand: 70 },
    fredericksburg: { quantityOnHand: 55 },
  },
  {
    sku: 'BEV-MANGO-JUICE',
    slug: 'mango-juice-1l',
    name: 'Mango Juice 1L',
    shortDescription: 'Alphonso mango nectar.',
    departmentSlug: 'beverages',
    categorySlug: 'juice-and-nectar',
    subcategorySlug: 'mango-juice',
    brandSlug: 'nestle',
    unitType: 'EACH',
    packageSize: '1 L',
    basePriceCents: 299,
    keywords: ['mango juice', 'nectar', 'aam'],
    glenBurnie: { quantityOnHand: 120 },
    fredericksburg: { quantityOnHand: 100 },
  },

  // --- Tea ------------------------------------------------------
  {
    sku: 'TEA-TAPAL-DANEDAR',
    slug: 'tapal-danedar-black-tea',
    name: 'Tapal Danedar Black Tea',
    shortDescription: 'Granular black tea for strong doodh patti.',
    departmentSlug: 'tea-coffee',
    categorySlug: 'tea',
    subcategorySlug: 'black-loose-tea',
    brandSlug: 'tapal',
    unitType: 'EACH',
    packageSize: '900 g',
    basePriceCents: 1299,
    keywords: ['chai', 'tea', 'tapal', 'danedar', 'doodh patti'],
    featured: true,
    glenBurnie: { quantityOnHand: 60 },
    fredericksburg: { quantityOnHand: 48 },
  },

  // --- Snacks ---------------------------------------------------
  {
    sku: 'SNK-BHUJIA',
    slug: 'bikaneri-bhujia',
    name: 'Bikaneri Bhujia',
    shortDescription: 'Crispy spiced gram-flour namkeen.',
    departmentSlug: 'snacks-sweets',
    categorySlug: 'namkeen-and-chips',
    subcategorySlug: 'bhujia',
    brandSlug: 'everest',
    unitType: 'EACH',
    packageSize: '400 g',
    basePriceCents: 399,
    taxStatus: 'TAXABLE',
    allergens: ['peanut'],
    keywords: ['bhujia', 'namkeen', 'snack', 'sev'],
    glenBurnie: { quantityOnHand: 80 },
    fredericksburg: { quantityOnHand: 65 },
  },
  {
    sku: 'SWT-GULAB-JAMUN',
    slug: 'gulab-jamun-tin',
    name: 'Gulab Jamun (Tin)',
    shortDescription: 'Ready-to-serve gulab jamun in syrup.',
    departmentSlug: 'snacks-sweets',
    categorySlug: 'sweets-and-mithai',
    subcategorySlug: 'gulab-jamun',
    brandSlug: 'laziza',
    unitType: 'EACH',
    packageSize: '1 kg tin',
    basePriceCents: 699,
    taxStatus: 'TAXABLE',
    allergens: ['milk'],
    keywords: ['gulab jamun', 'mithai', 'sweet', 'eid', 'dessert'],
    glenBurnie: { quantityOnHand: 40 },
    fredericksburg: { quantityOnHand: 32 },
  },

  // --- Household / personal care (taxable) ---------------------
  {
    sku: 'HH-DISH-SOAP',
    slug: 'lemon-dish-soap',
    name: 'Lemon Dish Soap',
    shortDescription: 'Grease-cutting dishwashing liquid.',
    departmentSlug: 'household-cleaning',
    categorySlug: 'cleaning',
    subcategorySlug: 'dish-soap',
    unitType: 'EACH',
    packageSize: '25 fl oz',
    basePriceCents: 349,
    taxStatus: 'TAXABLE',
    halalStatus: 'NOT_APPLICABLE',
    keywords: ['dish soap', 'cleaning', 'washing liquid'],
    glenBurnie: { quantityOnHand: 60 },
    fredericksburg: { quantityOnHand: 50 },
  },
  {
    sku: 'PC-COCONUT-OIL',
    slug: 'parachute-coconut-hair-oil',
    name: 'Coconut Hair Oil',
    shortDescription: 'Pure coconut oil for hair and skin.',
    departmentSlug: 'personal-care-baby',
    categorySlug: 'personal-care',
    subcategorySlug: 'hair-oil',
    unitType: 'EACH',
    packageSize: '500 ml',
    basePriceCents: 599,
    taxStatus: 'TAXABLE',
    halalStatus: 'NOT_APPLICABLE',
    keywords: ['coconut oil', 'hair oil', 'nariyal tel'],
    glenBurnie: { quantityOnHand: 45 },
    fredericksburg: { quantityOnHand: 38 },
  },

  // --- Pantry -------------------------------------------------
  {
    sku: 'PANTRY-CHICKPEAS-CAN',
    slug: 'canned-chickpeas',
    name: 'Canned Chickpeas',
    shortDescription: 'Ready-to-use chholay.',
    departmentSlug: 'pantry-canned',
    categorySlug: 'canned-goods',
    subcategorySlug: 'canned-chickpeas',
    unitType: 'EACH',
    packageSize: '15.5 oz',
    basePriceCents: 149,
    keywords: ['chholay', 'chana', 'chickpea', 'garbanzo', 'canned'],
    glenBurnie: { quantityOnHand: 150 },
    fredericksburg: { quantityOnHand: 120 },
  },
  {
    sku: 'PANTRY-SUGAR',
    slug: 'granulated-sugar-4lb',
    name: 'Granulated Sugar 4 lb',
    shortDescription: 'Fine white sugar.',
    departmentSlug: 'pantry-canned',
    categorySlug: 'baking-and-essentials',
    subcategorySlug: 'sugar',
    unitType: 'EACH',
    packageSize: '4 lb',
    basePriceCents: 399,
    keywords: ['sugar', 'cheeni', 'baking'],
    glenBurnie: { quantityOnHand: 100 },
    fredericksburg: { quantityOnHand: 85 },
  },

  // --- Sauces & pickles -------------------------------------
  {
    sku: 'SAUCE-GG-PASTE',
    slug: 'ginger-garlic-paste',
    name: 'Ginger Garlic Paste',
    shortDescription: 'Blended aromatic base paste.',
    departmentSlug: 'sauces-pickles',
    categorySlug: 'sauces-and-pastes',
    subcategorySlug: 'ginger-garlic-paste',
    brandSlug: 'shan',
    unitType: 'EACH',
    packageSize: '700 g',
    basePriceCents: 449,
    keywords: ['adrak lehsun', 'ginger garlic paste', 'base'],
    glenBurnie: { quantityOnHand: 55 },
    fredericksburg: { quantityOnHand: 42 },
  },
  {
    sku: 'PICKLE-MANGO',
    slug: 'punjabi-mango-pickle',
    name: 'Punjabi Mango Pickle (Achaar)',
    shortDescription: 'Oil-cured spicy mango pickle.',
    departmentSlug: 'sauces-pickles',
    categorySlug: 'pickles',
    subcategorySlug: 'mango-pickle',
    brandSlug: 'national',
    unitType: 'EACH',
    packageSize: '1 kg',
    basePriceCents: 599,
    keywords: ['achaar', 'pickle', 'aam ka achar', 'mango pickle'],
    glenBurnie: { quantityOnHand: 40 },
    fredericksburg: { quantityOnHand: 33 },
  },

  // --- Bakery ----------------------------------------------
  {
    sku: 'BKY-BREAD',
    slug: 'soft-sandwich-bread',
    name: 'Soft Sandwich Bread',
    shortDescription: 'Bakery-fresh white sandwich loaf.',
    departmentSlug: 'bakery',
    categorySlug: 'bread-and-buns',
    subcategorySlug: 'sandwich-bread',
    brandSlug: 'oasisa2-kitchen',
    unitType: 'EACH',
    packageSize: '20 oz',
    basePriceCents: 279,
    allergens: ['wheat', 'soy'],
    keywords: ['bread', 'double roti', 'loaf'],
    glenBurnie: { quantityOnHand: 40 },
    fredericksburg: { quantityOnHand: 35 },
  },
];

// ---------------------------------------------------------------------------
// Generated filler products — one per subcategory that no hero product covers,
// so every subcategory has at least one item and the catalog exceeds 100.
// ---------------------------------------------------------------------------

const PRICE_BY_DEPARTMENT: Record<string, [number, number]> = {
  'meat-poultry': [499, 1499],
  produce: [99, 499],
  'rice-grains': [499, 1999],
  'flour-atta': [349, 1299],
  'lentils-pulses': [399, 899],
  'spices-masalas': [149, 599],
  'oils-ghee': [499, 1899],
  'dairy-eggs': [199, 799],
  frozen: [299, 999],
  bakery: [199, 599],
  'sauces-pickles': [199, 699],
  'snacks-sweets': [149, 799],
  beverages: [99, 699],
  'tea-coffee': [399, 1499],
  'household-cleaning': [199, 999],
  'personal-care-baby': [199, 1299],
  'pantry-canned': [99, 599],
};

const TAXABLE_DEPARTMENTS = new Set(['household-cleaning', 'personal-care-baby']);

function hashCents(seed: string, [min, max]: [number, number]): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xffffffff;
  const span = Math.floor((max - min) / 10);
  return min + (Math.abs(h) % (span + 1)) * 10 - 1; // ends in 9
}

export function buildFillerProducts(): SeedProduct[] {
  const covered = new Set(HERO_PRODUCTS.map((p) => `${p.categorySlug}/${p.subcategorySlug ?? ''}`));
  const out: SeedProduct[] = [];

  for (const dept of TAXONOMY) {
    const priceRange = PRICE_BY_DEPARTMENT[dept.slug] ?? [199, 799];
    for (const category of dept.categories) {
      for (const subcat of category.subcategories) {
        const key = `${category.slug}/${subcat.slug}`;
        if (covered.has(key)) continue;
        const isMeat = dept.slug === 'meat-poultry';
        const weightSub =
          isMeat ||
          (dept.slug === 'produce' && category.slug === 'vegetables') ||
          (dept.slug === 'produce' && category.slug === 'fruits');
        const sku = `GEN-${category.slug}-${subcat.slug}`.toUpperCase().replace(/[^A-Z0-9-]/g, '');
        const cents = hashCents(sku, priceRange);
        const butcher: ButcherKind | undefined = isMeat
          ? (['beef', 'goat', 'lamb', 'chicken'] as const).find((k) => category.slug.includes(k))
          : undefined;

        out.push({
          sku,
          slug: `${subcat.slug}-${dept.slug}`.replace(/--+/g, '-'),
          name: subcat.name,
          shortDescription: `${subcat.name} — ${dept.name.toLowerCase()}.`,
          departmentSlug: dept.slug,
          categorySlug: category.slug,
          subcategorySlug: subcat.slug,
          unitType: weightSub ? 'WEIGHT' : 'EACH',
          ...(weightSub
            ? { pricePerPoundCents: cents, averageWeightLb: isMeat ? 2 : 1.5 }
            : { basePriceCents: cents, packageSize: 'each' }),
          taxStatus: TAXABLE_DEPARTMENTS.has(dept.slug) ? 'TAXABLE' : 'EXEMPT',
          halalStatus: isMeat ? 'HALAL' : 'NOT_APPLICABLE',
          keywords: [subcat.name.toLowerCase(), category.name.toLowerCase()],
          ...(butcher ? { butcher } : {}),
          glenBurnie: { quantityOnHand: 24 },
          fredericksburg: { quantityOnHand: 20 },
        } as SeedProduct);
      }
    }
  }
  return out;
}

export const ALL_SEED_PRODUCTS: SeedProduct[] = [...HERO_PRODUCTS, ...buildFillerProducts()];
