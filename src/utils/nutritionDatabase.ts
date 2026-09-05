import { PantryItem, RecipeIngredient, UnitType } from '../types';

export interface FoodNutritionItem {
  name: string;
  aliases: string[];
  category?: string;
  kcalPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
  pieceWeightG?: number; // Weight in grams for 1 'szt'
  densityGPerMl?: number; // Weight in grams for 1 'ml'
}

// Extensive, reliable Polish food database (Fitatu style)
export const FOOD_NUTRITION_DATABASE: FoodNutritionItem[] = [
  // --- JAJKA I NABIAŁ ---
  {
    name: 'Jajka kurze',
    aliases: ['jajko', 'jaja', 'jajka', 'jajko z wolnego wybiegu', 'jajka z wolnego wybiegu', 'jajo', 'białko jaja', 'żółtko'],
    kcalPer100g: 143,
    proteinPer100g: 12.6,
    fatPer100g: 9.5,
    carbsPer100g: 0.7,
    pieceWeightG: 55, // 1 jajko L = ~55g (~79 kcal)
  },
  {
    name: 'Mleko 2.0% świeże',
    aliases: ['mleko', 'mleko 2%', 'mleko 2.0%', 'mleko świeże', 'mleko krowie'],
    kcalPer100g: 50,
    proteinPer100g: 3.3,
    fatPer100g: 2.0,
    carbsPer100g: 4.8,
    densityGPerMl: 1.03,
  },
  {
    name: 'Mleko 3.2%',
    aliases: ['mleko 3.2%', 'mleko tłuste'],
    kcalPer100g: 61,
    proteinPer100g: 3.2,
    fatPer100g: 3.2,
    carbsPer100g: 4.7,
    densityGPerMl: 1.03,
  },
  {
    name: 'Napój owsiany',
    aliases: ['mleko owsiane', 'napoj owsiany'],
    kcalPer100g: 45,
    proteinPer100g: 1.0,
    fatPer100g: 1.5,
    carbsPer100g: 6.8,
    densityGPerMl: 1.0,
  },
  {
    name: 'Napój migdałowy',
    aliases: ['mleko migdałowe', 'napoj migdalowy'],
    kcalPer100g: 24,
    proteinPer100g: 0.8,
    fatPer100g: 1.8,
    carbsPer100g: 0.9,
    densityGPerMl: 1.0,
  },
  {
    name: 'Jogurt Grecki 0%',
    aliases: ['jogurt grecki', 'jogurt grecki 0%', 'jogurt grecki lekki'],
    kcalPer100g: 58,
    proteinPer100g: 10.0,
    fatPer100g: 0.2,
    carbsPer100g: 4.0,
  },
  {
    name: 'Jogurt naturalny',
    aliases: ['jogurt naturalny', 'jogurt'],
    kcalPer100g: 61,
    proteinPer100g: 4.3,
    fatPer100g: 2.0,
    carbsPer100g: 6.2,
  },
  {
    name: 'Skyr naturalny',
    aliases: ['skyr', 'skyr naturalny', 'jogurt skyr'],
    kcalPer100g: 65,
    proteinPer100g: 12.0,
    fatPer100g: 0.2,
    carbsPer100g: 4.1,
  },
  {
    name: 'Twaróg chudy',
    aliases: ['twaróg', 'twarog', 'twaróg chudy', 'twarozek chudy'],
    kcalPer100g: 86,
    proteinPer100g: 19.8,
    fatPer100g: 0.5,
    carbsPer100g: 3.5,
  },
  {
    name: 'Twaróg półtłusty',
    aliases: ['twaróg półtłusty', 'twarog poltlusty', 'ser biały'],
    kcalPer100g: 110,
    proteinPer100g: 18.7,
    fatPer100g: 4.0,
    carbsPer100g: 3.7,
  },
  {
    name: 'Serek wiejski',
    aliases: ['serek wiejski', 'serek wiejski naturalny', 'cottage cheese'],
    kcalPer100g: 97,
    proteinPer100g: 11.0,
    fatPer100g: 5.0,
    carbsPer100g: 2.0,
  },
  {
    name: 'Ser Feta',
    aliases: ['feta', 'ser feta', 'ser grecki feta'],
    kcalPer100g: 264,
    proteinPer100g: 14.2,
    fatPer100g: 21.3,
    carbsPer100g: 4.1,
  },
  {
    name: 'Ser Mozzarella',
    aliases: ['mozzarella', 'ser mozzarella', 'kulka mozzarelli'],
    kcalPer100g: 280,
    proteinPer100g: 22.0,
    fatPer100g: 21.0,
    carbsPer100g: 1.0,
    pieceWeightG: 125,
  },
  {
    name: 'Ser Mozzarella light',
    aliases: ['mozzarella light', 'ser mozzarella lekki'],
    kcalPer100g: 165,
    proteinPer100g: 21.0,
    fatPer100g: 8.5,
    carbsPer100g: 1.5,
    pieceWeightG: 125,
  },
  {
    name: 'Ser żółty Gouda / Edam',
    aliases: ['ser żółty', 'ser gouda', 'ser edam', 'ser', 'ser zolty'],
    kcalPer100g: 356,
    proteinPer100g: 25.0,
    fatPer100g: 28.0,
    carbsPer100g: 0.1,
  },
  {
    name: 'Ser Parmezan / Grana Padano',
    aliases: ['parmezan', 'grana padano', 'parmigiano'],
    kcalPer100g: 431,
    proteinPer100g: 38.0,
    fatPer100g: 29.0,
    carbsPer100g: 4.1,
  },
  {
    name: 'Masło ekstra 82%',
    aliases: ['masło', 'maslo', 'masło ekstra', 'maslo ekstra'],
    kcalPer100g: 748,
    proteinPer100g: 0.7,
    fatPer100g: 82.5,
    carbsPer100g: 0.7,
  },

  // --- MIĘSO, RYBY I OWOCE MORZA ---
  {
    name: 'Pierś z kurczaka',
    aliases: ['pierś z kurczaka', 'filet z kurczaka', 'kurczak', 'piers z kurczaka'],
    kcalPer100g: 120,
    proteinPer100g: 22.5,
    fatPer100g: 2.5,
    carbsPer100g: 0.0,
  },
  {
    name: 'Pierś z indyka (filet)',
    aliases: ['pierś z indyka', 'indyk', 'filet z indyka', 'piers z indyka'],
    kcalPer100g: 110,
    proteinPer100g: 24.0,
    fatPer100g: 1.5,
    carbsPer100g: 0.0,
  },
  {
    name: 'Mięso mielone z indyka',
    aliases: ['mielone z indyka', 'mięso mielone z indyka', 'mieso mielone z indyka'],
    kcalPer100g: 145,
    proteinPer100g: 19.5,
    fatPer100g: 7.5,
    carbsPer100g: 0.0,
  },
  {
    name: 'Mięso mielone wołowe',
    aliases: ['mielone wołowe', 'wołowina mielona', 'mieso mielone wolowe'],
    kcalPer100g: 215,
    proteinPer100g: 20.0,
    fatPer100g: 15.0,
    carbsPer100g: 0.0,
  },
  {
    name: 'Łosoś świeży filet',
    aliases: ['łosoś', 'losos', 'filet z łososia', 'łosoś atlantycki'],
    kcalPer100g: 208,
    proteinPer100g: 20.0,
    fatPer100g: 14.0,
    carbsPer100g: 0.0,
  },
  {
    name: 'Dorsz świeży',
    aliases: ['dorsz', 'filet z dorsza', 'ryba dorsz'],
    kcalPer100g: 82,
    proteinPer100g: 17.8,
    fatPer100g: 0.7,
    carbsPer100g: 0.0,
  },
  {
    name: 'Tuńczyk w sosie własnym',
    aliases: ['tuńczyk', 'tunczyk', 'tuńczyk w wodzie', 'tuńczyk w puszce'],
    kcalPer100g: 101,
    proteinPer100g: 23.5,
    fatPer100g: 0.8,
    carbsPer100g: 0.0,
    pieceWeightG: 130, // 1 standard can drained
  },
  {
    name: 'Krewetki mrożone / świeże',
    aliases: ['krewetki', 'krewetki mrożone', 'krewetki black tiger', 'krewetki tygrysie'],
    kcalPer100g: 85,
    proteinPer100g: 19.0,
    fatPer100g: 1.0,
    carbsPer100g: 0.0,
  },
  {
    name: 'Tofu naturalne',
    aliases: ['tofu', 'tofu naturalne', 'tofu sojowe'],
    kcalPer100g: 125,
    proteinPer100g: 12.5,
    fatPer100g: 7.5,
    carbsPer100g: 1.8,
  },

  // --- ZBOŻA, KASZE, MAKARONY, MĄKI ---
  {
    name: 'Płatki owsiane górskie',
    aliases: ['płatki owsiane', 'platki owsiane', 'płatki owsiane górskie', 'owsianka'],
    kcalPer100g: 366,
    proteinPer100g: 13.5,
    fatPer100g: 7.0,
    carbsPer100g: 63.0,
  },
  {
    name: 'Ryż biały / basmati (suchy)',
    aliases: ['ryż', 'ryz', 'ryż biały', 'ryż basmati', 'ryż jaśminowy', 'ryż arborio'],
    kcalPer100g: 355,
    proteinPer100g: 7.5,
    fatPer100g: 0.8,
    carbsPer100g: 78.0,
  },
  {
    name: 'Makaron pełnoziarnisty Penne',
    aliases: ['makaron pełnoziarnisty', 'makaron penne', 'makaron razowy', 'makaron'],
    kcalPer100g: 352,
    proteinPer100g: 13.0,
    fatPer100g: 2.0,
    carbsPer100g: 68.0,
  },
  {
    name: 'Kasza gryczana',
    aliases: ['kasza gryczana', 'kasza gryczana palona', 'gryka'],
    kcalPer100g: 343,
    proteinPer100g: 12.6,
    fatPer100g: 3.1,
    carbsPer100g: 69.0,
  },
  {
    name: 'Kasza jaglana',
    aliases: ['kasza jaglana', 'jaglanka'],
    kcalPer100g: 350,
    proteinPer100g: 10.5,
    fatPer100g: 2.9,
    carbsPer100g: 71.0,
  },
  {
    name: 'Mąka pszenna typ 500',
    aliases: ['mąka', 'maka', 'mąka pszenna', 'maka pszenna'],
    kcalPer100g: 345,
    proteinPer100g: 10.0,
    fatPer100g: 1.2,
    carbsPer100g: 74.0,
  },
  {
    name: 'Mąka owsiana',
    aliases: ['mąka owsiana', 'maka owsiana'],
    kcalPer100g: 366,
    proteinPer100g: 13.5,
    fatPer100g: 7.0,
    carbsPer100g: 63.0,
  },
  {
    name: 'Chleb pełnoziarnisty',
    aliases: ['chleb pełnoziarnisty', 'chleb żytni', 'chleb', 'chleb razowy', 'pieczywo'],
    kcalPer100g: 235,
    proteinPer100g: 7.5,
    fatPer100g: 1.8,
    carbsPer100g: 45.0,
    pieceWeightG: 35, // 1 kromka = ~35g
  },
  {
    name: 'Tortilla pełnoziarnista',
    aliases: ['tortilla', 'tortilla pełnoziarnista', 'wrap', 'placek tortilli'],
    kcalPer100g: 295,
    proteinPer100g: 8.5,
    fatPer100g: 5.5,
    carbsPer100g: 51.0,
    pieceWeightG: 62, // 1 szt = ~62g (~180 kcal)
  },

  // --- WARZYWA I STRĄCZKI ---
  {
    name: 'Pomidorki koktajlowe',
    aliases: ['pomidorki', 'pomidory', 'pomidor', 'pomidorki koktajlowe'],
    kcalPer100g: 20,
    proteinPer100g: 1.0,
    fatPer100g: 0.2,
    carbsPer100g: 3.9,
    pieceWeightG: 15,
  },
  {
    name: 'Passata pomidorowa',
    aliases: ['passata', 'passata pomidorowa', 'przecier pomidorowy', 'pomidory w puszce', 'sos pomidorowy'],
    kcalPer100g: 24,
    proteinPer100g: 1.3,
    fatPer100g: 0.2,
    carbsPer100g: 4.5,
    densityGPerMl: 1.0,
  },
  {
    name: 'Ogórek zielony / gruntowy',
    aliases: ['ogórek', 'ogorek', 'ogórek zielony'],
    kcalPer100g: 14,
    proteinPer100g: 0.7,
    fatPer100g: 0.1,
    carbsPer100g: 2.6,
    pieceWeightG: 180,
  },
  {
    name: 'Cukinia',
    aliases: ['cukinia', 'kabaczek'],
    kcalPer100g: 17,
    proteinPer100g: 1.2,
    fatPer100g: 0.3,
    carbsPer100g: 3.1,
    pieceWeightG: 250,
  },
  {
    name: 'Czosnek świeży',
    aliases: ['czosnek', 'czosnek świeży', 'ząbek czosnku', 'zabek czosnku'],
    kcalPer100g: 149,
    proteinPer100g: 6.4,
    fatPer100g: 0.5,
    carbsPer100g: 33.0,
    pieceWeightG: 5, // 1 ząbek = ~5g (~7 kcal)
  },
  {
    name: 'Cebula',
    aliases: ['cebula', 'cebula czerwona', 'cebula biała'],
    kcalPer100g: 40,
    proteinPer100g: 1.1,
    fatPer100g: 0.1,
    carbsPer100g: 9.3,
    pieceWeightG: 100, // 1 średnia = ~100g
  },
  {
    name: 'Szpinak świeży',
    aliases: ['szpinak', 'szpinak świeży', 'baby szpinak'],
    kcalPer100g: 23,
    proteinPer100g: 2.9,
    fatPer100g: 0.4,
    carbsPer100g: 3.6,
  },
  {
    name: 'Bataty',
    aliases: ['batat', 'bataty', 'słodki ziemniak', 'slodkie ziemniaki'],
    kcalPer100g: 86,
    proteinPer100g: 1.6,
    fatPer100g: 0.1,
    carbsPer100g: 20.0,
    pieceWeightG: 200,
  },
  {
    name: 'Ziemniaki',
    aliases: ['ziemniak', 'ziemniaki', 'kartofle'],
    kcalPer100g: 77,
    proteinPer100g: 2.0,
    fatPer100g: 0.1,
    carbsPer100g: 17.5,
    pieceWeightG: 90,
  },
  {
    name: 'Marchew',
    aliases: ['marchew', 'marchewka', 'marchewki'],
    kcalPer100g: 41,
    proteinPer100g: 0.9,
    fatPer100g: 0.2,
    carbsPer100g: 9.6,
    pieceWeightG: 75,
  },
  {
    name: 'Pieczarki świeże',
    aliases: ['pieczarki', 'pieczarka', 'grzyby pieczarki'],
    kcalPer100g: 22,
    proteinPer100g: 3.1,
    fatPer100g: 0.3,
    carbsPer100g: 3.3,
  },
  {
    name: 'Mieszanka warzyw na patelnię',
    aliases: ['warzywa na patelnię', 'warzywa na patelnie', 'mieszanka warzyw'],
    kcalPer100g: 45,
    proteinPer100g: 2.0,
    fatPer100g: 0.5,
    carbsPer100g: 7.5,
  },
  {
    name: 'Ciecierzyca gotowana',
    aliases: ['ciecierzyca', 'ciecierzyca gotowana', 'cieciorka'],
    kcalPer100g: 164,
    proteinPer100g: 8.9,
    fatPer100g: 2.6,
    carbsPer100g: 27.4,
  },
  {
    name: 'Fasola czerwona z puszki',
    aliases: ['fasola czerwona', 'fasola', 'czerwona fasola'],
    kcalPer100g: 110,
    proteinPer100g: 8.0,
    fatPer100g: 0.6,
    carbsPer100g: 16.5,
  },
  {
    name: 'Kukurydza konserwowa',
    aliases: ['kukurydza', 'kukurydza konserwowa'],
    kcalPer100g: 102,
    proteinPer100g: 3.2,
    fatPer100g: 1.2,
    carbsPer100g: 19.0,
  },
  {
    name: 'Dynia hokkaido',
    aliases: ['dynia', 'dynia hokkaido', 'dynia piżmowa'],
    kcalPer100g: 37,
    proteinPer100g: 1.2,
    fatPer100g: 0.2,
    carbsPer100g: 8.5,
  },

  // --- OWOCE ---
  {
    name: 'Banan',
    aliases: ['banan', 'banany'],
    kcalPer100g: 89,
    proteinPer100g: 1.1,
    fatPer100g: 0.3,
    carbsPer100g: 22.8,
    pieceWeightG: 120, // 1 średni banan bez skórki = ~120g (~107 kcal)
  },
  {
    name: 'Awokado Hass',
    aliases: ['awokado', 'awokado hass', 'avocado'],
    kcalPer100g: 160,
    proteinPer100g: 2.0,
    fatPer100g: 14.7,
    carbsPer100g: 8.5,
    pieceWeightG: 140, // 1 szt bez pestki = ~140g (~224 kcal)
  },
  {
    name: 'Jabłko',
    aliases: ['jabłko', 'jablko', 'jabłka'],
    kcalPer100g: 52,
    proteinPer100g: 0.3,
    fatPer100g: 0.2,
    carbsPer100g: 13.8,
    pieceWeightG: 160,
  },
  {
    name: 'Cytryna',
    aliases: ['cytryna', 'sok z cytryny'],
    kcalPer100g: 29,
    proteinPer100g: 1.1,
    fatPer100g: 0.3,
    carbsPer100g: 9.3,
    pieceWeightG: 80,
  },
  {
    name: 'Maliny mrożone / świeże',
    aliases: ['maliny', 'maliny mrożone', 'maliny świeże'],
    kcalPer100g: 52,
    proteinPer100g: 1.2,
    fatPer100g: 0.6,
    carbsPer100g: 12.0,
  },
  {
    name: 'Truskawki',
    aliases: ['truskawki', 'truskawka'],
    kcalPer100g: 33,
    proteinPer100g: 0.7,
    fatPer100g: 0.3,
    carbsPer100g: 7.7,
  },
  {
    name: 'Borówki amerykańskie',
    aliases: ['borówki', 'borowki', 'jagody'],
    kcalPer100g: 57,
    proteinPer100g: 0.7,
    fatPer100g: 0.3,
    carbsPer100g: 14.5,
  },

  // --- TŁUSZCZE, NASIONA, ORZECHY, DODATKI ---
  {
    name: 'Oliwa z oliwek Extra Virgin',
    aliases: ['oliwa', 'oliwa z oliwek', 'oliwa extra virgin', 'olej z oliwek'],
    kcalPer100g: 884,
    proteinPer100g: 0.0,
    fatPer100g: 100.0,
    carbsPer100g: 0.0,
    densityGPerMl: 0.92,
  },
  {
    name: 'Olej rzepakowy',
    aliases: ['olej', 'olej rzepakowy'],
    kcalPer100g: 884,
    proteinPer100g: 0.0,
    fatPer100g: 100.0,
    carbsPer100g: 0.0,
    densityGPerMl: 0.92,
  },
  {
    name: 'Masło orzechowe 100%',
    aliases: ['masło orzechowe', 'maslo orzechowe', 'krem z orzechów'],
    kcalPer100g: 588,
    proteinPer100g: 25.0,
    fatPer100g: 50.0,
    carbsPer100g: 20.0,
  },
  {
    name: 'Nasiona chia',
    aliases: ['chia', 'nasiona chia', 'szałwia hiszpańska'],
    kcalPer100g: 486,
    proteinPer100g: 16.5,
    fatPer100g: 30.7,
    carbsPer100g: 42.1,
  },
  {
    name: 'Orzechy włoskie',
    aliases: ['orzechy', 'orzechy włoskie', 'orzechy wloskie'],
    kcalPer100g: 654,
    proteinPer100g: 15.2,
    fatPer100g: 65.2,
    carbsPer100g: 13.7,
  },
  {
    name: 'Migdały',
    aliases: ['migdały', 'migdaly', 'płatki migdałów'],
    kcalPer100g: 579,
    proteinPer100g: 21.2,
    fatPer100g: 49.9,
    carbsPer100g: 21.6,
  },
  {
    name: 'Miód pszczeli',
    aliases: ['miód', 'miod', 'miód pszczeli'],
    kcalPer100g: 304,
    proteinPer100g: 0.3,
    fatPer100g: 0.0,
    carbsPer100g: 82.4,
  },
  {
    name: 'Cynamon mielony',
    aliases: ['cynamon', 'cynamon mielony'],
    kcalPer100g: 247,
    proteinPer100g: 4.0,
    fatPer100g: 1.2,
    carbsPer100g: 80.0,
  },
  {
    name: 'Odżywka białkowa WPC',
    aliases: ['białko wpc', 'odżywka białkowa', 'wpc', 'protein powder'],
    kcalPer100g: 395,
    proteinPer100g: 78.0,
    fatPer100g: 6.0,
    carbsPer100g: 7.5,
  },
];

// Normalize text for fuzzy matching
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove polish diacritics for robust matching
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ');
}

// Find nutrition in pantry first, then in standard database
export function findFoodNutrition(
  name: string,
  pantry?: PantryItem[]
): {
  kcalPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
  pieceWeightG?: number;
  matchedName: string;
  source: 'pantry' | 'database';
} | null {
  if (!name || !name.trim()) return null;
  const norm = normalizeText(name);

  // 1. Check pantry items
  if (pantry && pantry.length > 0) {
    const matchedPantry = pantry.find(p => {
      const pNorm = normalizeText(p.name);
      return pNorm === norm || pNorm.includes(norm) || norm.includes(pNorm);
    });

    if (matchedPantry && (matchedPantry.kcalPer100g || matchedPantry.proteinPer100g)) {
      return {
        kcalPer100g: matchedPantry.kcalPer100g || 0,
        proteinPer100g: matchedPantry.proteinPer100g || 0,
        fatPer100g: matchedPantry.fatPer100g || 0,
        carbsPer100g: matchedPantry.carbsPer100g || 0,
        matchedName: matchedPantry.name,
        source: 'pantry',
      };
    }
  }

  // 2. Check standard nutrition database
  for (const item of FOOD_NUTRITION_DATABASE) {
    const itemNorm = normalizeText(item.name);
    if (itemNorm === norm) {
      return {
        ...item,
        matchedName: item.name,
        source: 'database',
      };
    }

    for (const alias of item.aliases) {
      const aliasNorm = normalizeText(alias);
      if (aliasNorm === norm || norm.includes(aliasNorm) || aliasNorm.includes(norm)) {
        return {
          ...item,
          matchedName: item.name,
          source: 'database',
        };
      }
    }
  }

  return null;
}

// Calculate macros for an ingredient given its amount, unit and optional custom overrides
export function calculateIngredientNutrition(
  name: string,
  amount: number,
  unit: UnitType,
  pantry?: PantryItem[],
  customPer100g?: { kcal?: number; protein?: number; fat?: number; carbs?: number }
): {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  source: 'custom' | 'pantry' | 'database' | 'default';
  matchedName?: string;
  calculatedWeightG: number;
} {
  const safeAmount = Number(amount) || 0;
  const match = findFoodNutrition(name, pantry);

  const k100 = customPer100g?.kcal ?? match?.kcalPer100g ?? 0;
  const p100 = customPer100g?.protein ?? match?.proteinPer100g ?? 0;
  const f100 = customPer100g?.fat ?? match?.fatPer100g ?? 0;
  const c100 = customPer100g?.carbs ?? match?.carbsPer100g ?? 0;

  // Calculate equivalent weight in grams
  let weightInG = safeAmount;
  if (unit === 'szt') {
    const pieceWeight = match?.pieceWeightG || 100;
    weightInG = safeAmount * pieceWeight;
  } else if (unit === 'opak') {
    weightInG = safeAmount * 250; // standard container estimate
  } else if (unit === 'ml') {
    const density = (match as any)?.densityGPerMl || 1.0;
    weightInG = safeAmount * density;
  }

  const factor = weightInG / 100;

  return {
    kcal: Math.round(k100 * factor),
    protein: Number((p100 * factor).toFixed(1)),
    fat: Number((f100 * factor).toFixed(1)),
    carbs: Number((c100 * factor).toFixed(1)),
    source: customPer100g ? 'custom' : match ? match.source : 'default',
    matchedName: match?.matchedName,
    calculatedWeightG: Math.round(weightInG),
  };
}

// Sum recipe ingredients and calculate per-serving values and macro breakdown (Fitatu style)
export function calculateRecipeNutritionTotals(
  ingredients: RecipeIngredient[],
  servings: number = 1
): {
  totalKcal: number;
  totalProtein: number;
  totalFat: number;
  totalCarbs: number;
  perServingKcal: number;
  perServingProtein: number;
  perServingFat: number;
  perServingCarbs: number;
  macroPercent: {
    protein: number; // percentage of energy
    fat: number;
    carbs: number;
  };
} {
  const safeServings = Math.max(1, servings || 1);

  let totalKcal = 0;
  let totalProtein = 0;
  let totalFat = 0;
  let totalCarbs = 0;

  ingredients.forEach(ing => {
    totalKcal += Number(ing.kcal) || 0;
    totalProtein += Number(ing.protein) || 0;
    totalFat += Number(ing.fat) || 0;
    totalCarbs += Number(ing.carbs) || 0;
  });

  // Calculate percentage of calories: Protein=4kcal/g, Fat=9kcal/g, Carbs=4kcal/g
  const kcalFromProtein = totalProtein * 4;
  const kcalFromFat = totalFat * 9;
  const kcalFromCarbs = totalCarbs * 4;
  const macroKcalSum = kcalFromProtein + kcalFromFat + kcalFromCarbs || 1;

  const proteinPct = Math.round((kcalFromProtein / macroKcalSum) * 100);
  const fatPct = Math.round((kcalFromFat / macroKcalSum) * 100);
  const carbsPct = Math.max(0, 100 - proteinPct - fatPct);

  return {
    totalKcal: Math.round(totalKcal),
    totalProtein: Number(totalProtein.toFixed(1)),
    totalFat: Number(totalFat.toFixed(1)),
    totalCarbs: Number(totalCarbs.toFixed(1)),
    perServingKcal: Math.round(totalKcal / safeServings),
    perServingProtein: Number((totalProtein / safeServings).toFixed(1)),
    perServingFat: Number((totalFat / safeServings).toFixed(1)),
    perServingCarbs: Number((totalCarbs / safeServings).toFixed(1)),
    macroPercent: {
      protein: proteinPct,
      fat: fatPct,
      carbs: carbsPct,
    },
  };
}
