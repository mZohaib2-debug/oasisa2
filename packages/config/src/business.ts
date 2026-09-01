/**
 * Platform-wide business constants. Anything a store manager might reasonably
 * want to change lives on a DB row instead; this file is for values that are
 * either legal/technical or genuinely global defaults.
 */

export const CURRENCY = 'usd' as const;

/**
 * Sales tax. Most unprepared groceries are tax-exempt in MD and VA; prepared
 * foods and non-food items are taxable. Product.taxStatus decides per item.
 * These rates are PLACEHOLDERS — confirm with an accountant before go-live.
 */
export const TAX_RATES_BY_STATE: Record<string, number> = {
  MD: 0.06, // placeholder
  VA: 0.053, // placeholder
};
export const DEFAULT_TAX_RATE = 0.06;

/** Order number format: OA2-<6 digits>, starting here. */
export const ORDER_NUMBER_PREFIX = 'OA2-';
export const ORDER_NUMBER_START = 100000;

/** Fulfillment slot generation defaults. */
export const SLOT_CONFIG = {
  /** How many days ahead to expose slots. */
  horizonDays: 7,
  /** Slot length in minutes. */
  slotMinutes: 120,
  /** Default orders per slot. */
  defaultCapacity: 12,
  /** Earliest slot start (local) and latest slot end. */
  dayStart: '10:00',
  dayEnd: '20:00',
};

/** Weighted-item UI: quick-pick pound options. */
export const WEIGHT_QUICK_PICKS_LB = [1, 2, 3, 5];

/**
 * How far an actual prepared weight may drift from the estimate before the
 * order requires customer re-confirmation (fraction of estimate).
 */
export const WEIGHT_RECONFIRM_THRESHOLD = 0.2;

/** Cart hold: minutes a checkout reservation stays valid before release. */
export const RESERVATION_TTL_MINUTES = 20;

export const SUPPORTED_FULFILLMENT = ['PICKUP', 'DELIVERY'] as const;

/** South Asian / grocery synonym map used to expand search queries. */
export const SEARCH_SYNONYMS: Record<string, string[]> = {
  atta: ['flour', 'wheat flour', 'chakki'],
  maida: ['white flour', 'all purpose flour'],
  besan: ['gram flour', 'chickpea flour'],
  chana: ['chickpea', 'garbanzo'],
  channa: ['chickpea', 'garbanzo'],
  dhania: ['coriander', 'cilantro'],
  jeera: ['cumin'],
  zeera: ['cumin'],
  haldi: ['turmeric'],
  mirch: ['chili', 'chilli', 'pepper'],
  lal: ['red'],
  keema: ['ground meat', 'mince', 'qeema'],
  qeema: ['ground meat', 'mince', 'keema'],
  gosht: ['meat', 'goat', 'lamb', 'mutton'],
  murgh: ['chicken'],
  dal: ['lentil', 'daal', 'pulse'],
  daal: ['lentil', 'dal', 'pulse'],
  masoor: ['red lentil'],
  moong: ['mung bean', 'green gram'],
  toor: ['pigeon pea', 'arhar'],
  urad: ['black gram'],
  ghee: ['clarified butter'],
  dahi: ['yogurt', 'curd'],
  paneer: ['cottage cheese', 'indian cheese'],
  roti: ['flatbread', 'chapati'],
  sooji: ['semolina', 'rava'],
  imli: ['tamarind'],
  elaichi: ['cardamom'],
  dalchini: ['cinnamon'],
  laung: ['clove'],
  methi: ['fenugreek'],
  saunf: ['fennel'],
  namak: ['salt'],
  chawal: ['rice'],
  aloo: ['potato'],
  pyaz: ['onion'],
  tamatar: ['tomato'],
  adrak: ['ginger'],
  lehsun: ['garlic'],
  bhindi: ['okra', 'ladyfinger'],
  baingan: ['eggplant', 'brinjal', 'aubergine'],
  karela: ['bitter melon', 'bitter gourd'],
  lauki: ['bottle gourd', 'opo squash'],
  palak: ['spinach'],
  gobi: ['cauliflower', 'cabbage'],
};
