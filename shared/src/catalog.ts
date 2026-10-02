import { packsBaseUnit, type BaseUnit } from './units';

// labels match the picker tabs in the design handoff
export const PRODUCT_CATEGORIES = [
  { slug: 'dairy', label: 'Dairy' }, { slug: 'atta-rice', label: 'Atta & Rice' }, { slug: 'dal', label: 'Dal' },
  { slug: 'oil-ghee', label: 'Oil & Ghee' }, { slug: 'masala', label: 'Masala' }, { slug: 'sabzi', label: 'Sabzi' },
  { slug: 'fruits', label: 'Fruits' }, { slug: 'bakery-eggs', label: 'Bakery & Eggs' }, { slug: 'snacks', label: 'Snacks' },
  { slug: 'beverages', label: 'Beverages' }, { slug: 'dry-fruits', label: 'Dry Fruits' }, { slug: 'cleaning', label: 'Cleaning' },
  { slug: 'personal-care', label: 'Personal Care' }, { slug: 'pooja', label: 'Pooja' }, { slug: 'baby', label: 'Baby' },
  { slug: 'kitchen', label: 'Kitchen' },
] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]['slug'];

export interface CatalogProduct {
  slug: string; name: string; aliases: string[]; category: string; emoji: string;
  baseUnit: BaseUnit; packSizes: string[]; brands: string[];
}

const p = (category: ProductCategory, slug: string, name: string, aliases: string, emoji: string, packs: string, brands = ''): CatalogProduct => {
  const packSizes = packs.split(',').map(s => s.trim());
  return {
    slug, name, category, emoji, packSizes, aliases: aliases ? aliases.split('|') : [],
    brands: brands ? brands.split('|') : [], baseUnit: packsBaseUnit(packSizes)!,
  };
};

const VEG = '250 g,500 g,1 kg,2 kg';
const LEAFY = '1 pcs,2 pcs,3 pcs';

export const CATALOG: CatalogProduct[] = [
  // Dairy
  p('dairy', 'milk', 'Milk', 'doodh|dudh', '🥛', '500 ml,1 L,6 L', 'Amul|Mother Dairy|Gokul|Chitale|Nandini'),
  p('dairy', 'curd', 'Curd', 'dahi', '🥣', '200 g,400 g,1 kg', 'Amul|Mother Dairy|Gokul|Chitale'),
  p('dairy', 'paneer', 'Paneer', 'panir', '🧀', '200 g,500 g,1 kg', 'Amul|Mother Dairy|Gokul|Chitale'),
  p('dairy', 'butter', 'Butter', 'makkhan|loni', '🧈', '100 g,500 g', 'Amul|Mother Dairy|Britannia'),
  p('dairy', 'cheese-slices', 'Cheese slices', 'cheese', '🧀', '10 pcs,20 pcs', 'Amul|Britannia|Go'),
  p('dairy', 'cheese-block', 'Cheese block', 'cheese', '🧀', '200 g,500 g,1 kg', 'Amul|Britannia|Go'),
  p('dairy', 'buttermilk', 'Buttermilk', 'chaas|taak', '🥛', '200 ml,500 ml,1 L', 'Amul|Mother Dairy|Gokul|Chitale'),
  p('dairy', 'lassi', 'Lassi', 'lassi', '🥛', '200 ml,1 L', 'Amul|Mother Dairy'),
  p('dairy', 'fresh-cream', 'Fresh cream', 'malai|sai', '🥛', '200 ml,1 L', 'Amul|Mother Dairy'),
  p('dairy', 'shrikhand', 'Shrikhand', 'shrikhand', '🍮', '250 g,500 g,1 kg', 'Amul|Chitale|Warana'),
  p('dairy', 'khoa', 'Khoa', 'mawa|khava', '🧀', '250 g,500 g,1 kg'),
  p('dairy', 'flavoured-milk', 'Flavoured milk', 'masala doodh', '🥛', '180 ml,200 ml', 'Amul|Mother Dairy'),
  p('dairy', 'condensed-milk', 'Condensed milk', 'milkmaid', '🥫', '200 g,400 g', 'Nestle|Amul'),
  p('dairy', 'milk-powder', 'Milk powder', 'doodh powder', '🥛', '200 g,500 g,1 kg', 'Amul|Nestle'),
  p('dairy', 'curd-cup', 'Dahi cup', 'dahi', '🥣', '80 g,200 g', 'Amul|Mother Dairy'),
  p('dairy', 'greek-yogurt', 'Greek yogurt', 'dahi', '🥣', '100 g,400 g', 'Epigamia|Amul'),

  // Atta & Rice
  p('atta-rice', 'atta', 'Wheat atta', 'gehu ka atta|kanik|peeth', '🌾', '1 kg,5 kg,10 kg', 'Aashirvaad|Pillsbury|Fortune|Annapurna'),
  p('atta-rice', 'basmati-rice', 'Basmati rice', 'chawal|tandul', '🍚', '1 kg,5 kg,10 kg', 'India Gate|Daawat|Fortune|Kohinoor'),
  p('atta-rice', 'kolam-rice', 'Kolam rice', 'chawal|tandul', '🍚', '1 kg,5 kg,10 kg,25 kg'),
  p('atta-rice', 'sona-masoori', 'Sona masoori rice', 'chawal|tandul', '🍚', '1 kg,5 kg,10 kg,25 kg'),
  p('atta-rice', 'indrayani-rice', 'Indrayani rice', 'chawal|tandul', '🍚', '1 kg,5 kg,10 kg'),
  p('atta-rice', 'maida', 'Maida', 'maida', '🌾', '500 g,1 kg', 'Aashirvaad|Pillsbury'),
  p('atta-rice', 'sooji', 'Sooji / Rava', 'rava|rawa|suji', '🌾', '500 g,1 kg', 'Aashirvaad|Fortune'),
  p('atta-rice', 'besan', 'Besan', 'chana atta|besan peeth', '🌾', '500 g,1 kg', 'Rajdhani|Tata Sampann|Fortune'),
  p('atta-rice', 'poha', 'Poha', 'pohe|chivda', '🍚', '500 g,1 kg'),
  p('atta-rice', 'jowar-atta', 'Jowar atta', 'jowar|jwari peeth', '🌾', '500 g,1 kg'),
  p('atta-rice', 'bajra-atta', 'Bajra atta', 'bajra|bajri peeth', '🌾', '500 g,1 kg'),
  p('atta-rice', 'ragi-atta', 'Ragi atta', 'nachni|nachani', '🌾', '500 g,1 kg'),
  p('atta-rice', 'rice-flour', 'Rice flour', 'chawal ka atta|tandul peeth', '🌾', '500 g,1 kg'),
  p('atta-rice', 'sabudana', 'Sabudana', 'sago|sabudana', '⚪', '250 g,500 g,1 kg'),
  p('atta-rice', 'dalia', 'Dalia', 'broken wheat|lapsi', '🌾', '500 g,1 kg'),
  p('atta-rice', 'oats', 'Oats', 'oats', '🥣', '500 g,1 kg', 'Quaker|Saffola'),
  p('atta-rice', 'vermicelli', 'Vermicelli', 'sevai|shevaya', '🍜', '200 g,500 g', 'Bambino|MTR'),

  // Dal
  p('dal', 'toor-dal', 'Toor dal', 'arhar|tur dal|turichi dal', '🫘', '500 g,1 kg,2 kg,5 kg', 'Tata Sampann|Fortune|Rajdhani'),
  p('dal', 'moong-dal', 'Moong dal', 'mung dal', '🫘', '500 g,1 kg', 'Tata Sampann|Fortune'),
  p('dal', 'masoor-dal', 'Masoor dal', 'lal dal|masur', '🫘', '500 g,1 kg', 'Tata Sampann|Fortune'),
  p('dal', 'chana-dal', 'Chana dal', 'harbhara dal', '🫘', '500 g,1 kg', 'Tata Sampann|Fortune'),
  p('dal', 'urad-dal', 'Urad dal', 'udid dal|udad', '🫘', '500 g,1 kg', 'Tata Sampann|Fortune'),
  p('dal', 'kabuli-chana', 'Kabuli chana', 'chole|kabuli harbhara', '🫘', '500 g,1 kg'),
  p('dal', 'kala-chana', 'Kala chana', 'harbhara|desi chana', '🫘', '500 g,1 kg'),
  p('dal', 'rajma', 'Rajma', 'rajma', '🫘', '500 g,1 kg'),
  p('dal', 'whole-moong', 'Whole moong', 'sabut moong|mug', '🫘', '500 g,1 kg'),
  p('dal', 'matki', 'Matki', 'moth|matki', '🫘', '500 g,1 kg'),
  p('dal', 'chawli', 'Chawli', 'lobia|chavli', '🫘', '500 g,1 kg'),
  p('dal', 'green-peas-dry', 'Dry green peas', 'vatana|matar', '🫛', '500 g,1 kg'),
  p('dal', 'white-peas', 'White peas', 'safed vatana|ragda', '🫛', '500 g,1 kg'),
  p('dal', 'whole-masoor', 'Whole masoor', 'sabut masoor|akkha masur', '🫘', '500 g,1 kg'),
  p('dal', 'kulith', 'Kulith', 'horse gram|kulthi', '🫘', '500 g,1 kg'),
  p('dal', 'soya-chunks', 'Soya chunks', 'soya badi', '🟤', '200 g,500 g', 'Nutrela|Fortune'),

  // Oil & Ghee
  p('oil-ghee', 'sunflower-oil', 'Sunflower oil', 'tel|surajmukhi tel', '🌻', '1 L,5 L,15 L', 'Fortune|Saffola|Sundrop|Gemini'),
  p('oil-ghee', 'groundnut-oil', 'Groundnut oil', 'mungfali tel|shengdana tel', '🥜', '1 L,5 L,15 L', 'Fortune|Dhara|Engine'),
  p('oil-ghee', 'mustard-oil', 'Mustard oil', 'sarson tel|mohari tel', '🛢️', '1 L,5 L', 'Fortune|Patanjali|Dhara'),
  p('oil-ghee', 'soyabean-oil', 'Soyabean oil', 'soya tel', '🛢️', '1 L,5 L,15 L', 'Fortune|Dhara|Gemini'),
  p('oil-ghee', 'rice-bran-oil', 'Rice bran oil', 'tel', '🛢️', '1 L,5 L', 'Fortune|Saffola'),
  p('oil-ghee', 'coconut-oil-cooking', 'Coconut oil', 'nariyal tel|khobrel tel', '🥥', '500 ml,1 L', 'Parachute|KLF'),
  p('oil-ghee', 'olive-oil', 'Olive oil', 'jaitun tel', '🫒', '500 ml,1 L', 'Figaro|Borges'),
  p('oil-ghee', 'sesame-oil', 'Sesame oil', 'til tel', '🛢️', '500 ml,1 L', 'Idhayam'),
  p('oil-ghee', 'cow-ghee', 'Cow ghee', 'ghee|toop|tup', '🧈', '200 ml,500 ml,1 L', 'Amul|Gowardhan|Mother Dairy|Patanjali'),
  p('oil-ghee', 'buffalo-ghee', 'Buffalo ghee', 'ghee|toop', '🧈', '500 ml,1 L', 'Amul'),
  p('oil-ghee', 'vanaspati', 'Vanaspati', 'dalda', '🧈', '500 ml,1 L', 'Dalda|Gagan'),
  p('oil-ghee', 'cottonseed-oil', 'Cottonseed oil', 'sarki tel', '🛢️', '1 L,5 L,15 L'),
  p('oil-ghee', 'safflower-oil', 'Safflower oil', 'kardi tel|kusum tel', '🛢️', '1 L,5 L'),
  p('oil-ghee', 'blended-oil', 'Blended oil', 'tel', '🛢️', '1 L,5 L', 'Saffola|Fortune'),
  p('oil-ghee', 'filtered-groundnut-oil', 'Filtered groundnut oil', 'kachi ghani|shengdana tel', '🥜', '1 L,5 L,15 L'),
  p('oil-ghee', 'mustard-oil-kachi', 'Kachi ghani mustard oil', 'sarson tel', '🛢️', '1 L,5 L', 'Fortune|Engine'),

  // Masala
  p('masala', 'salt', 'Salt', 'namak|meeth', '🧂', '1 kg', 'Tata|Aashirvaad|Catch'),
  p('masala', 'sugar', 'Sugar', 'cheeni|shakkar|sakhar', '🍬', '1 kg,5 kg', 'Madhur|Uttam'),
  p('masala', 'jaggery', 'Jaggery', 'gud|gul', '🟫', '500 g,1 kg'),
  p('masala', 'turmeric', 'Turmeric powder', 'haldi|halad', '🟡', '100 g,200 g,500 g', 'Everest|MDH|Catch|Rajesh'),
  p('masala', 'chilli-powder', 'Red chilli powder', 'lal mirch|mirchi powder|tikhat', '🌶️', '100 g,200 g,500 g', 'Everest|MDH|Catch'),
  p('masala', 'coriander-powder', 'Coriander powder', 'dhaniya powder|dhane pud', '🟢', '100 g,200 g,500 g', 'Everest|MDH|Catch'),
  p('masala', 'cumin-seeds', 'Cumin seeds', 'jeera|jire', '🟤', '100 g,200 g,500 g', 'Everest|Catch'),
  p('masala', 'mustard-seeds', 'Mustard seeds', 'rai|mohari', '⚫', '100 g,200 g,500 g'),
  p('masala', 'garam-masala', 'Garam masala', 'garam masala', '🟤', '50 g,100 g,200 g', 'Everest|MDH|Badshah'),
  p('masala', 'goda-masala', 'Goda masala', 'kala masala', '🟤', '100 g,200 g', 'Pravin|Chitale|Suhana'),
  p('masala', 'kanda-lasun-masala', 'Kanda lasun masala', 'kolhapuri masala', '🌶️', '100 g,200 g,500 g', 'Pravin|Suhana'),
  p('masala', 'hing', 'Hing', 'asafoetida|hing', '🟡', '25 g,50 g,100 g', 'LG|Everest'),
  p('masala', 'pav-bhaji-masala', 'Pav bhaji masala', 'pav bhaji', '🟤', '50 g,100 g', 'Everest|MDH|Badshah'),
  p('masala', 'chhole-masala', 'Chhole masala', 'chole masala', '🟤', '50 g,100 g', 'Everest|MDH'),
  p('masala', 'black-pepper', 'Black pepper', 'kali mirch|miri', '⚫', '50 g,100 g,200 g'),
  p('masala', 'cardamom', 'Cardamom', 'elaichi|velchi', '🟢', '25 g,50 g,100 g'),
  p('masala', 'cloves', 'Cloves', 'laung|lavang', '🟤', '25 g,50 g,100 g'),
  p('masala', 'cinnamon', 'Cinnamon', 'dalchini', '🟤', '50 g,100 g'),
  p('masala', 'methi-seeds', 'Fenugreek seeds', 'methi dana', '🟡', '100 g,200 g'),
  p('masala', 'ajwain', 'Ajwain', 'ova|carom seeds', '🟤', '50 g,100 g'),
  p('masala', 'tea-masala', 'Chai masala', 'chai masala', '🟤', '50 g,100 g', 'Everest|MDH'),
  p('masala', 'kasuri-methi', 'Kasuri methi', 'dried methi', '🌿', '25 g,50 g,100 g', 'MDH|Everest'),

  // Sabzi
  p('sabzi', 'onion', 'Onion', 'pyaz|kanda', '🧅', '500 g,1 kg,2 kg,5 kg'),
  p('sabzi', 'potato', 'Potato', 'aloo|batata', '🥔', '500 g,1 kg,2 kg,5 kg'),
  p('sabzi', 'tomato', 'Tomato', 'tamatar', '🍅', '250 g,500 g,1 kg,2 kg'),
  p('sabzi', 'garlic', 'Garlic', 'lehsun|lasun', '🧄', '100 g,250 g,500 g'),
  p('sabzi', 'ginger', 'Ginger', 'adrak|aale', '🫚', '100 g,250 g,500 g'),
  p('sabzi', 'green-chilli', 'Green chilli', 'hari mirch|hirvi mirchi', '🌶️', '100 g,250 g'),
  p('sabzi', 'coriander-leaves', 'Coriander leaves', 'dhaniya|kothimbir', '🌿', LEAFY),
  p('sabzi', 'curry-leaves', 'Curry leaves', 'kadi patta|kadipatta', '🌿', LEAFY),
  p('sabzi', 'methi-leaves', 'Methi leaves', 'methi', '🌿', LEAFY),
  p('sabzi', 'spinach', 'Spinach', 'palak', '🥬', LEAFY),
  p('sabzi', 'cabbage', 'Cabbage', 'patta gobhi|kobi', '🥬', '1 pcs,2 pcs'),
  p('sabzi', 'cauliflower', 'Cauliflower', 'phool gobhi|flower', '🥦', '1 pcs,2 pcs'),
  p('sabzi', 'brinjal', 'Brinjal', 'baingan|vangi', '🍆', VEG),
  p('sabzi', 'lady-finger', 'Lady finger', 'bhindi|bhendi', '🫛', VEG),
  p('sabzi', 'capsicum', 'Capsicum', 'shimla mirch|dhobli mirchi', '🫑', VEG),
  p('sabzi', 'carrot', 'Carrot', 'gajar', '🥕', VEG),
  p('sabzi', 'cucumber', 'Cucumber', 'kheera|kakdi', '🥒', VEG),
  p('sabzi', 'bottle-gourd', 'Bottle gourd', 'lauki|dudhi', '🥒', '1 pcs,2 pcs'),
  p('sabzi', 'bitter-gourd', 'Bitter gourd', 'karela|karle', '🥒', VEG),
  p('sabzi', 'green-peas', 'Green peas', 'matar|vatana', '🫛', VEG),
  p('sabzi', 'french-beans', 'French beans', 'beans|farasbi', '🫛', VEG),
  p('sabzi', 'lemon', 'Lemon', 'nimbu|limbu', '🍋', '4 pcs,6 pcs,12 pcs'),
  p('sabzi', 'sweet-potato', 'Sweet potato', 'shakarkand|ratale', '🍠', VEG),
  p('sabzi', 'drumstick', 'Drumstick', 'sahjan|shevga', '🥢', '2 pcs,4 pcs,6 pcs'),

  // Fruits
  p('fruits', 'banana', 'Banana', 'kela|keli', '🍌', '6 pcs,12 pcs'),
  p('fruits', 'apple', 'Apple', 'seb|safarchand', '🍎', '500 g,1 kg,2 kg'),
  p('fruits', 'mango', 'Mango', 'aam|amba', '🥭', '1 kg,2 kg,3 kg'),
  p('fruits', 'orange', 'Orange', 'santra|santre', '🍊', '500 g,1 kg,2 kg'),
  p('fruits', 'grapes', 'Grapes', 'angoor|draksha', '🍇', '250 g,500 g,1 kg'),
  p('fruits', 'papaya', 'Papaya', 'papita|papai', '🍈', '1 pcs,2 pcs'),
  p('fruits', 'pomegranate', 'Pomegranate', 'anaar|dalimb', '🍎', '500 g,1 kg'),
  p('fruits', 'watermelon', 'Watermelon', 'tarbooz|kalingad', '🍉', '1 pcs,2 pcs'),
  p('fruits', 'chikoo', 'Chikoo', 'sapota|chiku', '🟤', '500 g,1 kg'),
  p('fruits', 'guava', 'Guava', 'amrood|peru', '🍐', '500 g,1 kg'),
  p('fruits', 'pineapple', 'Pineapple', 'ananas', '🍍', '1 pcs,2 pcs'),
  p('fruits', 'muskmelon', 'Muskmelon', 'kharbooja|kharbuj', '🍈', '1 pcs,2 pcs'),
  p('fruits', 'pear', 'Pear', 'nashpati|naspati', '🍐', '500 g,1 kg'),
  p('fruits', 'sweet-lime', 'Sweet lime', 'mosambi', '🍋', '500 g,1 kg,2 kg'),
  p('fruits', 'custard-apple', 'Custard apple', 'sitaphal', '🍏', '500 g,1 kg'),
  p('fruits', 'coconut', 'Coconut', 'nariyal|naral', '🥥', '1 pcs,2 pcs,4 pcs'),

  // Bakery & Eggs
  p('bakery-eggs', 'eggs', 'Eggs', 'anda|andi', '🥚', '6 pcs,12 pcs,30 pcs'),
  p('bakery-eggs', 'white-bread', 'White bread', 'bread|pav', '🍞', '1 pcs,2 pcs', 'Britannia|Modern|Harvest Gold'),
  p('bakery-eggs', 'brown-bread', 'Brown bread', 'bread', '🍞', '1 pcs,2 pcs', 'Britannia|Modern|Harvest Gold'),
  p('bakery-eggs', 'pav', 'Pav', 'ladi pav', '🥖', '6 pcs,12 pcs'),
  p('bakery-eggs', 'bun', 'Bun', 'bun', '🍔', '4 pcs,6 pcs'),
  p('bakery-eggs', 'rusk', 'Rusk', 'toast|khari', '🍞', '200 g,300 g', 'Britannia|Parle'),
  p('bakery-eggs', 'khari', 'Khari', 'khari biscuit', '🥐', '200 g,400 g'),
  p('bakery-eggs', 'cake', 'Cake', 'cake', '🍰', '1 pcs,2 pcs', 'Britannia|Winkies'),
  p('bakery-eggs', 'brown-eggs', 'Brown eggs', 'desi anda|gavran andi', '🥚', '6 pcs,12 pcs'),
  p('bakery-eggs', 'multigrain-bread', 'Multigrain bread', 'bread', '🍞', '1 pcs', 'Britannia|Harvest Gold'),
  p('bakery-eggs', 'burger-bun', 'Burger bun', 'bun', '🍔', '2 pcs,4 pcs'),
  p('bakery-eggs', 'cupcake', 'Cup cake', 'muffin', '🧁', '1 pcs,6 pcs', 'Britannia'),

  // Snacks
  p('snacks', 'glucose-biscuits', 'Glucose biscuits', 'parle g|biscuit', '🍪', '100 g,250 g,800 g', 'Parle|Britannia'),
  p('snacks', 'marie-biscuits', 'Marie biscuits', 'biscuit', '🍪', '120 g,250 g', 'Britannia|Parle'),
  p('snacks', 'cream-biscuits', 'Cream biscuits', 'biscuit', '🍪', '100 g,300 g', 'Britannia|Sunfeast|Parle'),
  p('snacks', 'namkeen', 'Namkeen', 'chivda|farsan', '🥨', '200 g,400 g,1 kg', 'Haldiram|Bikaji|Balaji'),
  p('snacks', 'potato-chips', 'Potato chips', 'wafers', '🥔', '50 g,100 g,200 g', 'Lays|Balaji|Bingo'),
  p('snacks', 'bhujia', 'Aloo bhujia', 'bhujia|shev', '🥨', '200 g,400 g,1 kg', 'Haldiram|Bikaji'),
  p('snacks', 'instant-noodles', 'Instant noodles', 'maggi', '🍜', '70 g,280 g,560 g', 'Maggi|Yippee|Top Ramen'),
  p('snacks', 'chocolate', 'Chocolate', 'chocolate', '🍫', '50 g,100 g', 'Cadbury|Amul|Nestle'),
  p('snacks', 'cornflakes', 'Cornflakes', 'cereal', '🥣', '250 g,500 g,1 kg', 'Kelloggs'),
  p('snacks', 'peanut-butter', 'Peanut butter', 'peanut butter', '🥜', '340 g,1 kg', 'Pintola|Sundrop'),
  p('snacks', 'jam', 'Jam', 'jam', '🍓', '200 g,500 g', 'Kissan|Mapro'),
  p('snacks', 'ketchup', 'Tomato ketchup', 'sauce', '🍅', '500 g,1 kg', 'Kissan|Maggi'),
  p('snacks', 'papad', 'Papad', 'papad|papad', '🫓', '200 g,500 g', 'Lijjat'),
  p('snacks', 'pickle', 'Pickle', 'achar|lonche', '🫙', '200 g,500 g,1 kg', 'Mothers|Pravin|Bedekar'),
  p('snacks', 'pasta', 'Pasta', 'pasta', '🍝', '500 g,1 kg', 'Borges|Del Monte'),
  p('snacks', 'honey', 'Honey', 'shahad|madh', '🍯', '250 g,500 g,1 kg', 'Dabur|Saffola'),
  p('snacks', 'cookies', 'Cookies', 'biscuit', '🍪', '75 g,200 g', 'Good Day|Hide & Seek|Unibic'),

  // Beverages
  p('beverages', 'tea', 'Tea', 'chai patti|chaha', '🍵', '250 g,500 g,1 kg', 'Tata Tea|Red Label|Wagh Bakri|Society'),
  p('beverages', 'coffee', 'Instant coffee', 'coffee', '☕', '50 g,100 g,200 g', 'Nescafe|Bru'),
  p('beverages', 'filter-coffee', 'Filter coffee', 'coffee', '☕', '200 g,500 g', 'Bru|Coffee Day'),
  p('beverages', 'green-tea', 'Green tea', 'green tea', '🍵', '25 pcs,100 pcs', 'Lipton|Tetley'),
  p('beverages', 'health-drink', 'Health drink', 'bournvita|horlicks', '🥤', '500 g,1 kg', 'Bournvita|Horlicks|Boost'),
  p('beverages', 'soft-drink', 'Soft drink', 'cold drink', '🥤', '750 ml,1.25 L,2 L', 'Coca-Cola|Pepsi|Thums Up|Sprite'),
  p('beverages', 'juice', 'Fruit juice', 'juice|ras', '🧃', '200 ml,1 L', 'Real|Tropicana|Paper Boat'),
  p('beverages', 'water', 'Packaged water', 'pani', '💧', '1 L,2 L,20 L', 'Bisleri|Kinley|Aquafina'),
  p('beverages', 'kokum-sherbet', 'Kokum sherbet', 'kokum sarbat', '🧃', '750 ml,1 L', 'Mapro|Bedekar'),
  p('beverages', 'rooh-afza', 'Rose syrup', 'rooh afza|sharbat', '🌹', '750 ml', 'Hamdard'),
  p('beverages', 'glucose-powder', 'Glucose powder', 'glucon d', '🥤', '500 g,1 kg', 'Glucon-D'),
  p('beverages', 'coconut-water', 'Coconut water', 'nariyal pani|shahale', '🥥', '200 ml,1 L'),
  p('beverages', 'energy-drink', 'Energy drink', 'energy drink', '⚡', '250 ml,500 ml', 'Red Bull|Sting'),
  p('beverages', 'squash', 'Squash', 'sharbat', '🍋', '750 ml,1 L', 'Kissan|Mapro'),
  p('beverages', 'cocoa-powder', 'Cocoa powder', 'cocoa', '🍫', '50 g,150 g', 'Cadbury|Hershey'),
  p('beverages', 'tea-bags', 'Tea bags', 'chai', '🍵', '25 pcs,100 pcs', 'Tata Tea|Red Label|Lipton'),

  // Dry Fruits
  p('dry-fruits', 'almonds', 'Almonds', 'badam', '🌰', '100 g,250 g,500 g,1 kg'),
  p('dry-fruits', 'cashews', 'Cashews', 'kaju', '🌰', '100 g,250 g,500 g,1 kg'),
  p('dry-fruits', 'raisins', 'Raisins', 'kishmish|manuka|bedana', '🍇', '100 g,250 g,500 g'),
  p('dry-fruits', 'walnuts', 'Walnuts', 'akhrot|akrod', '🌰', '100 g,250 g,500 g'),
  p('dry-fruits', 'pistachios', 'Pistachios', 'pista', '🥜', '100 g,250 g'),
  p('dry-fruits', 'dates', 'Dates', 'khajur', '🟤', '250 g,500 g,1 kg'),
  p('dry-fruits', 'figs', 'Dried figs', 'anjeer', '🟤', '100 g,250 g'),
  p('dry-fruits', 'peanuts', 'Peanuts', 'mungfali|shengdane', '🥜', '250 g,500 g,1 kg'),
  p('dry-fruits', 'dry-coconut', 'Dry coconut', 'khopra|suka khobra', '🥥', '100 g,250 g,500 g'),
  p('dry-fruits', 'makhana', 'Makhana', 'fox nuts|phool makhana', '⚪', '100 g,250 g'),
  p('dry-fruits', 'flax-seeds', 'Flax seeds', 'alsi|javas', '🟤', '100 g,250 g'),
  p('dry-fruits', 'sesame-seeds', 'Sesame seeds', 'til', '⚪', '100 g,250 g,500 g'),
  p('dry-fruits', 'chia-seeds', 'Chia seeds', 'sabja', '⚫', '100 g,250 g'),
  p('dry-fruits', 'apricots', 'Dried apricots', 'khubani|jardalu', '🟠', '100 g,250 g'),
  p('dry-fruits', 'mixed-dry-fruits', 'Mixed dry fruits', 'mewa|sukha mewa', '🌰', '250 g,500 g'),
  p('dry-fruits', 'charoli', 'Charoli', 'chironji', '🟤', '50 g,100 g'),

  // Cleaning
  p('cleaning', 'detergent-powder', 'Detergent powder', 'surf|kapde dhone ka powder', '🧺', '500 g,1 kg,2 kg,4 kg', 'Surf Excel|Ariel|Tide|Wheel|Rin'),
  p('cleaning', 'liquid-detergent', 'Liquid detergent', 'surf', '🧴', '500 ml,1 L,2 L', 'Surf Excel|Ariel|Tide'),
  p('cleaning', 'detergent-bar', 'Detergent bar', 'kapde ka sabun|dhuvayacha sabun', '🧼', '1 pcs,4 pcs', 'Rin|Surf Excel|Wheel'),
  p('cleaning', 'dishwash-bar', 'Dishwash bar', 'bartan sabun|bhandi sabun', '🧽', '1 pcs,3 pcs', 'Vim|Exo|Pril'),
  p('cleaning', 'dishwash-liquid', 'Dishwash liquid', 'vim liquid', '🧴', '250 ml,500 ml,1 L', 'Vim|Pril|Exo'),
  p('cleaning', 'floor-cleaner', 'Floor cleaner', 'phenyl|lizol', '🧹', '500 ml,1 L,2 L', 'Lizol|Domex'),
  p('cleaning', 'toilet-cleaner', 'Toilet cleaner', 'harpic', '🚽', '500 ml,1 L', 'Harpic|Domex'),
  p('cleaning', 'phenyl', 'Phenyl', 'phenyl', '🧴', '1 L,5 L'),
  p('cleaning', 'glass-cleaner', 'Glass cleaner', 'colin', '🪟', '250 ml,500 ml', 'Colin'),
  p('cleaning', 'scrub-pad', 'Scrub pad', 'juna|ghasni', '🧽', '1 pcs,3 pcs', 'Scotch-Brite|Vim'),
  p('cleaning', 'garbage-bags', 'Garbage bags', 'kachra bag', '🗑️', '15 pcs,30 pcs', 'Ezee|Presto'),
  p('cleaning', 'fabric-softener', 'Fabric conditioner', 'comfort', '🧴', '200 ml,860 ml', 'Comfort'),
  p('cleaning', 'mosquito-repellent', 'Mosquito repellent', 'good knight|all out', '🦟', '1 pcs,2 pcs', 'Good Knight|All Out|Mortein'),
  p('cleaning', 'naphthalene-balls', 'Naphthalene balls', 'dambar goli|dambar', '⚪', '100 g,200 g'),
  p('cleaning', 'broom', 'Broom', 'jhadu|kharata', '🧹', '1 pcs'),
  p('cleaning', 'mop', 'Mop', 'pocha|podda', '🧹', '1 pcs'),

  // Personal Care
  p('personal-care', 'bath-soap', 'Bath soap', 'sabun|angholicha sabun', '🧼', '1 pcs,4 pcs', 'Lux|Dettol|Lifebuoy|Santoor|Medimix'),
  p('personal-care', 'shampoo', 'Shampoo', 'shampoo', '🧴', '180 ml,340 ml,650 ml', 'Clinic Plus|Head & Shoulders|Dove|Sunsilk'),
  p('personal-care', 'toothpaste', 'Toothpaste', 'manjan|dant manjan', '🪥', '100 g,150 g,200 g', 'Colgate|Pepsodent|Dabur Red|Sensodyne'),
  p('personal-care', 'toothbrush', 'Toothbrush', 'brush', '🪥', '1 pcs,4 pcs', 'Colgate|Oral-B'),
  p('personal-care', 'hair-oil', 'Hair oil', 'baalon ka tel|kesh tel', '🥥', '100 ml,200 ml,500 ml', 'Parachute|Dabur Amla|Bajaj'),
  p('personal-care', 'handwash', 'Handwash', 'hand wash', '🧴', '200 ml,750 ml', 'Dettol|Lifebuoy|Savlon'),
  p('personal-care', 'face-wash', 'Face wash', 'face wash', '🧴', '50 ml,100 ml', 'Himalaya|Garnier|Ponds'),
  p('personal-care', 'body-lotion', 'Body lotion', 'lotion', '🧴', '100 ml,400 ml', 'Vaseline|Nivea'),
  p('personal-care', 'talc', 'Talcum powder', 'powder', '🧴', '100 g,300 g', 'Ponds|Navratna'),
  p('personal-care', 'deodorant', 'Deodorant', 'deo|spray', '🧴', '150 ml', 'Fogg|Nivea|Axe'),
  p('personal-care', 'sanitary-pads', 'Sanitary pads', 'pads', '🩷', '7 pcs,15 pcs,30 pcs', 'Whisper|Stayfree'),
  p('personal-care', 'shaving-cream', 'Shaving cream', 'shaving', '🪒', '70 g,100 g', 'Gillette|Old Spice'),
  p('personal-care', 'razor', 'Razor', 'blade', '🪒', '1 pcs,3 pcs', 'Gillette'),
  p('personal-care', 'coconut-hair-oil', 'Coconut hair oil', 'khobrel tel', '🥥', '100 ml,250 ml,500 ml', 'Parachute'),
  p('personal-care', 'cotton', 'Cotton', 'kapus', '☁️', '50 g,100 g'),
  p('personal-care', 'antiseptic', 'Antiseptic liquid', 'dettol', '🧴', '125 ml,250 ml,500 ml', 'Dettol|Savlon'),

  // Pooja
  p('pooja', 'agarbatti', 'Agarbatti', 'incense|udbatti', '🪔', '1 pcs,3 pcs', 'Cycle|Mangaldeep|Zed Black'),
  p('pooja', 'camphor', 'Camphor', 'kapoor|kapur', '⚪', '25 g,50 g,100 g', 'Mangaldeep'),
  p('pooja', 'diya-oil', 'Diya oil', 'deep tel|panati tel', '🪔', '500 ml,1 L'),
  p('pooja', 'cotton-wicks', 'Cotton wicks', 'baati|vaat|phulvat', '🕯️', '50 pcs,100 pcs'),
  p('pooja', 'kumkum', 'Kumkum', 'kumkum|kunku', '🔴', '25 g,50 g'),
  p('pooja', 'haldi-pooja', 'Pooja haldi', 'halad', '🟡', '25 g,50 g'),
  p('pooja', 'flowers', 'Flowers', 'phool|phula', '🌼', '1 pcs,2 pcs'),
  p('pooja', 'garland', 'Garland', 'mala|haar', '💐', '1 pcs,2 pcs'),
  p('pooja', 'dhoop', 'Dhoop', 'dhoop', '🪔', '1 pcs,2 pcs', 'Cycle|Mangaldeep'),
  p('pooja', 'matchbox', 'Matchbox', 'machis|kadepeti', '🔥', '1 pcs,10 pcs'),
  p('pooja', 'sandalwood-paste', 'Sandalwood', 'chandan|gandh', '🟤', '25 g,50 g'),
  p('pooja', 'betel-nut', 'Betel nut', 'supari', '🟤', '50 g,100 g'),
  p('pooja', 'betel-leaves', 'Betel leaves', 'paan|vidyache pan', '🍃', '10 pcs,20 pcs'),
  p('pooja', 'akshata', 'Akshata rice', 'akshat|akshata', '🍚', '100 g,250 g'),
  p('pooja', 'candles', 'Candles', 'mombatti|menbatti', '🕯️', '6 pcs,12 pcs'),
  p('pooja', 'gulal', 'Gulal', 'gulal|rang', '🟣', '50 g,100 g'),

  // Baby
  p('baby', 'diapers', 'Diapers', 'diaper', '👶', '20 pcs,40 pcs,80 pcs', 'Pampers|Huggies|MamyPoko'),
  p('baby', 'baby-wipes', 'Baby wipes', 'wipes', '🧻', '72 pcs,144 pcs', 'Pampers|Himalaya|Mamaearth'),
  p('baby', 'baby-soap', 'Baby soap', 'baby sabun', '🧼', '1 pcs,3 pcs', 'Johnsons|Himalaya'),
  p('baby', 'baby-shampoo', 'Baby shampoo', 'shampoo', '🧴', '100 ml,200 ml', 'Johnsons|Himalaya'),
  p('baby', 'baby-oil', 'Baby oil', 'malish tel', '🧴', '100 ml,200 ml', 'Johnsons|Dabur Lal Tail|Himalaya'),
  p('baby', 'baby-powder', 'Baby powder', 'powder', '🧴', '100 g,200 g', 'Johnsons|Himalaya'),
  p('baby', 'baby-lotion', 'Baby lotion', 'lotion', '🧴', '100 ml,200 ml', 'Johnsons|Himalaya'),
  p('baby', 'baby-food', 'Baby cereal', 'cerelac', '🥣', '300 g', 'Cerelac|Nestum'),
  p('baby', 'infant-formula', 'Infant formula', 'formula|lactogen', '🍼', '400 g', 'Lactogen|Nan Pro'),
  p('baby', 'baby-rash-cream', 'Rash cream', 'diaper cream', '🧴', '20 g,50 g', 'Himalaya|Sudocrem'),
  p('baby', 'feeding-bottle', 'Feeding bottle', 'bottle', '🍼', '1 pcs', 'Pigeon|Philips Avent'),
  p('baby', 'baby-detergent', 'Baby detergent', 'baby surf', '🧺', '500 ml,1 L', 'Mamaearth|Chicco'),

  // Kitchen
  p('kitchen', 'aluminium-foil', 'Aluminium foil', 'foil', '🧻', '1 pcs', 'Hindalco|Freshwrapp'),
  p('kitchen', 'cling-wrap', 'Cling wrap', 'wrap', '🧻', '1 pcs', 'Freshwrapp'),
  p('kitchen', 'tissue-paper', 'Tissue paper', 'napkin', '🧻', '1 pcs,4 pcs', 'Origami|Selpak'),
  p('kitchen', 'kitchen-towel', 'Kitchen towel', 'paper towel', '🧻', '1 pcs,2 pcs', 'Origami'),
  p('kitchen', 'zip-bags', 'Zip lock bags', 'zip bag', '🛍️', '10 pcs,25 pcs'),
  p('kitchen', 'baking-soda', 'Baking soda', 'khane ka soda|khaycha soda', '⚪', '100 g,200 g'),
  p('kitchen', 'baking-powder', 'Baking powder', 'baking powder', '⚪', '50 g,100 g'),
  p('kitchen', 'vinegar', 'Vinegar', 'sirka', '🫙', '500 ml,1 L'),
  p('kitchen', 'soy-sauce', 'Soy sauce', 'soya sauce', '🫙', '200 ml,700 ml', 'Chings'),
  p('kitchen', 'tamarind', 'Tamarind', 'imli|chinch', '🟤', '200 g,500 g'),
  p('kitchen', 'kokum', 'Kokum', 'aamsul', '🟣', '100 g,250 g'),
  p('kitchen', 'ginger-garlic-paste', 'Ginger garlic paste', 'adrak lehsun paste|aale lasun', '🫙', '100 g,200 g,500 g', 'Smith & Jones|Dabur'),
  p('kitchen', 'cornflour', 'Cornflour', 'corn starch', '🌽', '100 g,500 g', 'Weikfield'),
  p('kitchen', 'custard-powder', 'Custard powder', 'custard', '🍮', '100 g,500 g', 'Weikfield|Brown & Polson'),
  p('kitchen', 'idli-batter', 'Idli dosa batter', 'peeth|batter', '🫙', '500 g,1 kg', 'iD|Tazaa'),
  p('kitchen', 'ready-to-eat', 'Ready to eat meal', 'instant', '🍛', '250 g,300 g', 'MTR|Haldiram|Gits'),
];

export function searchProducts<T extends { name: string; aliases: string[] }>(q: string, items: T[]): T[] {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  const score = (t: T) => {
    const words = [t.name, ...t.aliases].map(w => w.toLowerCase());
    if (words.some(w => w === s)) return 0;
    if (words.some(w => w.startsWith(s))) return 1;
    if (words.some(w => w.includes(s))) return 2;
    return -1;
  };
  return items.map(t => [t, score(t)] as const).filter(([, sc]) => sc >= 0).sort((a, b) => a[1] - b[1]).map(([t]) => t);
}
