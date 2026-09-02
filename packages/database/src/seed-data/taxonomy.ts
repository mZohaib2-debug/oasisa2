/**
 * OasisA2 catalog taxonomy — DEMO DATA.
 * Department -> Category -> Subcategory. Slugs are stable identifiers used by
 * storefront navigation and by the product generator.
 */

export interface SeedSubcategory {
  slug: string;
  name: string;
}
export interface SeedCategory {
  slug: string;
  name: string;
  subcategories: SeedSubcategory[];
}
export interface SeedDepartment {
  slug: string;
  name: string;
  iconName: string;
  description: string;
  categories: SeedCategory[];
}

const sub = (name: string): SeedSubcategory => ({
  slug: name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, ''),
  name,
});
const cat = (name: string, subs: string[]): SeedCategory => ({
  slug: name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, ''),
  name,
  subcategories: subs.map(sub),
});

export const TAXONOMY: SeedDepartment[] = [
  {
    slug: 'meat-poultry',
    name: 'Meat & Poultry',
    iconName: 'beef',
    description: '100% halal beef, goat, lamb, veal and chicken — fresh butcher service.',
    categories: [
      cat('Beef', [
        'Ground Beef',
        'Beef Cubes',
        'Beef Stew',
        'Ribeye',
        'Sirloin',
        'Chuck',
        'Brisket',
        'Beef Ribs',
        'Beef Shank',
        'Beef Bones',
        'Beef Liver',
        'Beef Offal',
      ]),
      cat('Goat', [
        'Whole Goat',
        'Goat Leg',
        'Goat Shoulder',
        'Goat Chops',
        'Goat Cubes',
        'Goat Curry Cut',
        'Goat Ribs',
        'Goat Liver',
        'Goat Feet',
      ]),
      cat('Lamb', [
        'Lamb Leg',
        'Lamb Shoulder',
        'Lamb Chops',
        'Lamb Shank',
        'Lamb Cubes',
        'Lamb Ribs',
        'Ground Lamb',
      ]),
      cat('Chicken', [
        'Whole Chicken',
        'Chicken Breast',
        'Chicken Thigh',
        'Chicken Drumsticks',
        'Chicken Wings',
        'Chicken Leg Quarters',
        'Boneless Chicken',
        'Chicken Keema',
        'Chicken Liver',
        'Chicken Gizzards',
      ]),
      cat('Veal & Specialty', ['Veal', 'Marinated Meat', 'Halal Deli Meat', 'Specialty Cuts']),
      cat('Frozen Halal Meat', ['Frozen Beef', 'Frozen Goat', 'Frozen Chicken', 'Seekh Kabab']),
    ],
  },
  {
    slug: 'produce',
    name: 'Produce',
    iconName: 'apple',
    description: 'Fresh fruits and vegetables, restocked daily.',
    categories: [
      cat('Fruits', [
        'Apples',
        'Bananas',
        'Mangoes',
        'Oranges',
        'Grapes',
        'Berries',
        'Melons',
        'Dates',
        'Seasonal Fruit',
      ]),
      cat('Vegetables', [
        'Tomatoes',
        'Potatoes',
        'Onions',
        'Green Chili',
        'Ginger & Garlic',
        'Leafy Greens',
        'Okra',
        'Eggplant',
        'Gourds',
        'Cauliflower & Cabbage',
        'Carrots & Peppers',
        'Cucumber',
      ]),
      cat('Herbs', ['Cilantro', 'Mint', 'Curry Leaves', 'Fenugreek Leaves']),
    ],
  },
  {
    slug: 'rice-grains',
    name: 'Rice & Grains',
    iconName: 'wheat',
    description: 'Basmati, sella, jasmine and everyday rice in every bag size.',
    categories: [
      cat('Basmati Rice', ['White Basmati', 'Aged Basmati', 'Brown Basmati']),
      cat('Specialty Rice', ['Sella Rice', 'Jasmine Rice', 'Long Grain', 'Sona Masoori']),
      cat('Other Grains', ['Quinoa', 'Barley', 'Millet', 'Poha & Flattened Rice']),
    ],
  },
  {
    slug: 'flour-atta',
    name: 'Flour & Atta',
    iconName: 'wheat',
    description: 'Chakki atta, maida, besan and specialty flours.',
    categories: [
      cat('Wheat Flour', ['Whole Wheat Atta', 'Chakki Atta', 'Multigrain Atta']),
      cat('Refined & Specialty Flour', ['Maida', 'Besan', 'Corn Flour', 'Rice Flour', 'Semolina']),
    ],
  },
  {
    slug: 'lentils-pulses',
    name: 'Lentils & Pulses',
    iconName: 'bean',
    description: 'Dal, beans and pulses by the bag.',
    categories: [
      cat('Dal', ['Masoor Dal', 'Moong Dal', 'Chana Dal', 'Toor Dal', 'Urad Dal']),
      cat('Beans', ['Chickpeas', 'Kidney Beans', 'Black Beans', 'White Beans']),
      cat('Whole Lentils', ['Green Lentils', 'Black Lentils', 'Brown Lentils']),
    ],
  },
  {
    slug: 'spices-masalas',
    name: 'Spices & Masalas',
    iconName: 'flame',
    description: 'Whole spices, ground spices and recipe masala mixes.',
    categories: [
      cat('Whole Spices', [
        'Cumin Seeds',
        'Coriander Seeds',
        'Cardamom',
        'Cinnamon',
        'Cloves',
        'Bay Leaves',
        'Black Pepper',
        'Fennel',
        'Mustard Seeds',
        'Fenugreek Seeds',
      ]),
      cat('Ground Spices', [
        'Turmeric',
        'Red Chili Powder',
        'Cumin Powder',
        'Coriander Powder',
        'Garam Masala',
        'Paprika',
      ]),
      cat('Recipe Masala Mixes', [
        'Biryani Masala',
        'Chicken Masala',
        'Karahi Masala',
        'Nihari Masala',
        'Haleem Masala',
        'Tikka Masala',
        'Seekh Kabab Masala',
        'Butter Chicken Masala',
        'Chaat Masala',
        'Korma Masala',
        'Paya Masala',
        'Fish Masala',
      ]),
    ],
  },
  {
    slug: 'oils-ghee',
    name: 'Cooking Oils & Ghee',
    iconName: 'droplet',
    description: 'Ghee, vanaspati and cooking oils.',
    categories: [
      cat('Ghee', ['Pure Ghee', 'Vanaspati Ghee']),
      cat('Cooking Oil', ['Canola Oil', 'Sunflower Oil', 'Corn Oil', 'Olive Oil', 'Mustard Oil']),
    ],
  },
  {
    slug: 'dairy-eggs',
    name: 'Dairy & Eggs',
    iconName: 'egg',
    description: 'Milk, yogurt, paneer, cheese and eggs.',
    categories: [
      cat('Milk & Cream', ['Whole Milk', 'Evaporated Milk', 'Condensed Milk', 'Cream']),
      cat('Yogurt & Paneer', ['Plain Yogurt', 'Greek Yogurt', 'Paneer', 'Lassi']),
      cat('Cheese & Butter', ['Cheese', 'Butter']),
      cat('Eggs', ['Large Eggs', 'Brown Eggs']),
    ],
  },
  {
    slug: 'frozen',
    name: 'Frozen Foods',
    iconName: 'snowflake',
    description: 'Parathas, samosas, vegetables and frozen favorites.',
    categories: [
      cat('Frozen Breads', ['Paratha', 'Roti', 'Naan']),
      cat('Frozen Snacks', ['Samosa', 'Spring Roll', 'Kebab', 'Nuggets']),
      cat('Frozen Vegetables & Fruit', ['Frozen Vegetables', 'Frozen Fruit', 'Frozen Berries']),
    ],
  },
  {
    slug: 'bakery',
    name: 'Bakery',
    iconName: 'croissant',
    description: 'Fresh bread, buns and rusk.',
    categories: [cat('Bread & Buns', ['Sandwich Bread', 'Burger Buns', 'Pav', 'Rusk & Toast'])],
  },
  {
    slug: 'sauces-pickles',
    name: 'Sauces & Pickles',
    iconName: 'jar',
    description: 'Chutneys, pickles, pastes and condiments.',
    categories: [
      cat('Pickles', ['Mango Pickle', 'Mixed Pickle', 'Lime Pickle', 'Chili Pickle']),
      cat('Sauces & Pastes', ['Ginger Garlic Paste', 'Tamarind Paste', 'Hot Sauce', 'Ketchup']),
      cat('Chutneys', ['Mint Chutney', 'Tamarind Chutney', 'Mango Chutney']),
    ],
  },
  {
    slug: 'snacks-sweets',
    name: 'Snacks & Sweets',
    iconName: 'cookie',
    description: 'Namkeen, biscuits, chips and mithai.',
    categories: [
      cat('Namkeen & Chips', ['Namkeen', 'Chips', 'Bhujia', 'Chevda']),
      cat('Biscuits & Cookies', ['Tea Biscuits', 'Cream Biscuits', 'Rusk']),
      cat('Sweets & Mithai', ['Gulab Jamun', 'Rasgulla', 'Soan Papdi', 'Halwa Mix']),
    ],
  },
  {
    slug: 'beverages',
    name: 'Beverages',
    iconName: 'cup-soda',
    description: 'Juices, syrups, soft drinks and drink mixes.',
    categories: [
      cat('Juice & Nectar', ['Mango Juice', 'Mixed Fruit Juice', 'Fruit Nectar']),
      cat('Syrups & Squash', ['Rose Syrup', 'Fruit Squash', 'Falsa Syrup']),
      cat('Soft Drinks & Water', ['Soda', 'Sparkling Water', 'Bottled Water']),
    ],
  },
  {
    slug: 'tea-coffee',
    name: 'Tea & Coffee',
    iconName: 'coffee',
    description: 'Loose tea, tea bags, coffee and chai masala.',
    categories: [
      cat('Tea', ['Black Loose Tea', 'Tea Bags', 'Green Tea', 'Chai Masala']),
      cat('Coffee', ['Instant Coffee', 'Ground Coffee']),
    ],
  },
  {
    slug: 'household-cleaning',
    name: 'Household & Cleaning',
    iconName: 'spray-can',
    description: 'Cleaning supplies, paper goods and kitchen essentials.',
    categories: [
      cat('Cleaning', ['Dish Soap', 'Surface Cleaner', 'Laundry Detergent', 'Bleach']),
      cat('Paper & Foil', ['Paper Towels', 'Toilet Paper', 'Aluminum Foil', 'Trash Bags']),
    ],
  },
  {
    slug: 'personal-care-baby',
    name: 'Personal Care & Baby',
    iconName: 'baby',
    description: 'Soap, oral care, hair care and baby needs.',
    categories: [
      cat('Personal Care', ['Soap & Body Wash', 'Shampoo', 'Toothpaste', 'Hair Oil']),
      cat('Baby', ['Diapers', 'Baby Wipes', 'Baby Food']),
    ],
  },
  {
    slug: 'pantry-canned',
    name: 'Pantry & Canned',
    iconName: 'package',
    description: 'Canned goods, breakfast, sugar, salt and baking.',
    categories: [
      cat('Canned Goods', ['Canned Tomatoes', 'Canned Beans', 'Canned Chickpeas', 'Coconut Milk']),
      cat('Baking & Essentials', ['Sugar', 'Salt', 'Baking Powder', 'Custard Powder']),
      cat('Breakfast', ['Cereal', 'Oats', 'Honey', 'Jam']),
    ],
  },
];
