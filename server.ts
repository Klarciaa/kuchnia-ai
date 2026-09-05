import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "20mb" }));

// Lazy-initialized Gemini instance
let aiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

// Helper to generate content with model fallback
async function generateGeminiContent(contents: any, responseMimeType = "application/json"): Promise<string> {
  const ai = getGemini();
  if (!ai) throw new Error("GEMINI_API_KEY not configured");

  const candidateModels = ["gemini-3.6-flash", "gemini-3.1-flash-lite", "gemini-3.8-flash"];
  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: responseMimeType ? { responseMimeType } : undefined,
      });
      if (response.text) {
        return response.text;
      }
    } catch (err: any) {
      console.warn(`Model ${model} failed, trying next candidate:`, err?.message || err);
      lastError = err;
    }
  }

  throw lastError || new Error("All Gemini models failed to respond");
}

// Curated Polish retail products catalog (especially store private labels that OpenFoodFacts lacks)
const POLISH_PRODUCTS_CATALOG: Record<string, {
  name: string;
  brand: string;
  quantity: string;
  kcalPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
  category: string;
  zone: string;
}> = {
  // Be Power Energy Drinks (Biedronka / Krynica Vitamin)
  "5907180339836": {
    name: "Be Power Energy Drink Zero Sugar",
    brand: "Be Power (Biedronka / Krynica Vitamin)",
    quantity: "500 ml",
    kcalPer100g: 3,
    proteinPer100g: 0,
    fatPer100g: 0,
    carbsPer100g: 0,
    category: "Napoje",
    zone: "fridge"
  },
  "5907180339812": {
    name: "Be Power Energy Drink Classic",
    brand: "Be Power (Biedronka)",
    quantity: "500 ml",
    kcalPer100g: 46,
    proteinPer100g: 0,
    fatPer100g: 0,
    carbsPer100g: 11,
    category: "Napoje",
    zone: "fridge"
  },
  "5907180339829": {
    name: "Be Power Energy Drink Mango",
    brand: "Be Power (Biedronka)",
    quantity: "500 ml",
    kcalPer100g: 45,
    proteinPer100g: 0,
    fatPer100g: 0,
    carbsPer100g: 10.8,
    category: "Napoje",
    zone: "fridge"
  },
  "5907180339843": {
    name: "Be Power Energy Drink Mojito",
    brand: "Be Power (Biedronka)",
    quantity: "500 ml",
    kcalPer100g: 45,
    proteinPer100g: 0,
    fatPer100g: 0,
    carbsPer100g: 10.8,
    category: "Napoje",
    zone: "fridge"
  },
  // Popular Polish staples
  "5900512300124": {
    name: "Mleko Świeże Łaciate 2.0% 1L",
    brand: "Mlekpol",
    quantity: "1 L",
    kcalPer100g: 50,
    proteinPer100g: 3.3,
    fatPer100g: 2.0,
    carbsPer100g: 4.8,
    category: "Nabiał",
    zone: "fridge"
  },
  "5900512100014": {
    name: "Masło Ekstra Łaciate 200g",
    brand: "Mlekpol",
    quantity: "200 g",
    kcalPer100g: 748,
    proteinPer100g: 0.7,
    fatPer100g: 82.0,
    carbsPer100g: 0.7,
    category: "Nabiał",
    zone: "fridge"
  },
  "5900512200103": {
    name: "Serek wiejski naturalny 200g",
    brand: "Piątnica",
    quantity: "200 g",
    kcalPer100g: 97,
    proteinPer100g: 11.0,
    fatPer100g: 5.0,
    carbsPer100g: 2.0,
    category: "Nabiał",
    zone: "fridge"
  },
  "5900820000010": {
    name: "Majonez Kielecki 310ml",
    brand: "WSP Społem",
    quantity: "310 ml",
    kcalPer100g: 631,
    proteinPer100g: 1.3,
    fatPer100g: 68.0,
    carbsPer100g: 2.6,
    category: "Sosy i dodatki",
    zone: "fridge"
  },
  "5900334002626": {
    name: "Makaron Spaghetti 500g",
    brand: "Lubella",
    quantity: "500 g",
    kcalPer100g: 351,
    proteinPer100g: 13.0,
    fatPer100g: 1.4,
    carbsPer100g: 70.0,
    category: "Suche",
    zone: "pantry"
  },
  "5907180333766": {
    name: "Baza owocowa z sokiem z cytryny",
    brand: "GoBio (Biedronka)",
    quantity: "100 g",
    kcalPer100g: 21,
    proteinPer100g: 0.1,
    fatPer100g: 0,
    carbsPer100g: 0.4,
    category: "Owoce i warzywa",
    zone: "fridge"
  }
};

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Gemini Zero Waste Recipe generator based on expiring/available pantry products
app.post("/api/gemini/zero-waste-recipe", async (req, res) => {
  try {
    const { expiringItems = [], availableItems = [], mealType = "dowolny" } = req.body;
    const ai = getGemini();

    const expiringList = (expiringItems as Array<{ name: string; amount: number; unit: string }>)
      .map(i => `${i.name} (${i.amount} ${i.unit})`)
      .join(", ");

    const availableList = (availableItems as Array<{ name: string; amount: number; unit: string }>)
      .map(i => `${i.name} (${i.amount} ${i.unit})`)
      .join(", ");

    if (!ai) {
      // Fallback generator when API key is not yet set
      return res.json({
        title: "Zapiekanka z patelni Zero Waste",
        category: "Obiad",
        prepTime: "25 min",
        kcal: 460,
        protein: 26,
        fat: 18,
        carbs: 48,
        description: "Błyskawiczne, pożywne danie patelniane skomponowane tak, by w pierwszej kolejności wykorzystać produkty z krótką datą przydatności.",
        ingredients: expiringItems.length > 0 ? expiringItems.map((item: any) => ({
          name: item.name,
          amount: item.amount || 100,
          unit: item.unit || "g"
        })) : [
          { name: "Jajka", amount: 2, unit: "szt" },
          { name: "Ser żółty", amount: 50, unit: "g" },
          { name: "Pomidorki", amount: 100, unit: "g" }
        ],
        instructions: [
          "Rozgrzej patelnię z kroplą oliwy lub masła.",
          "Podduś składniki wymagające podsmażenia, w tym te z krótką datą przydatności.",
          "Dodaj resztę składników, przypraw solą, pieprzem i ziołami do smaku.",
          "Smaż lub zapiecz pod przykryciem na małym ogniu przez 10-12 minut aż do ścięcia i rozpuszczenia sera."
        ]
      });
    }

    const prompt = `Jesteś genialnym szefem kuchni oraz ekspertem Zero Waste i dietetykiem.
Użytkownik ma w spiżarni produkty, z których część ma status 'Kończy się' lub 'Termin mija':
Produkty pilne (kończące się / z krótką datą): ${expiringList || "brak specyficznych, wykorzystaj dostępne"}
Pozostałe produkty w domu: ${availableList || "podstawowe zapasy kuchenne"}
Pożądany posiłek: ${mealType}

Stwórz 1 pyszny, praktyczny przepis kulinarny, który MAKSYMALNIE zużyje pilne produkty i zapobiegnie marnowaniu jedzenia.
Zwróć odpowiedź WYŁĄCZNIE jako czysty JSON w następującym formacie bez znaczników markdown:
{
  "title": "Nazwa dania po polsku",
  "category": "Śniadanie" | "Obiad" | "Kolacja" | "Przekąska",
  "prepTime": "np. 20 min",
  "kcal": 450,
  "protein": 24,
  "fat": 16,
  "carbs": 52,
  "description": "Krótki, apetyczny opis dania (1-2 zdania)",
  "ingredients": [
    { "name": "Nazwa składnika", "amount": 100, "unit": "g" | "ml" | "szt" }
  ],
  "instructions": [
    "Krok 1...",
    "Krok 2..."
  ]
}`;

    const text = await generateGeminiContent(prompt, "application/json");
    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (error: any) {
    console.error("Gemini recipe error:", error);
    res.status(500).json({
      error: "Nie udało się wygenerować przepisu przez AI. Sprawdź połączenie.",
      details: error?.message || String(error)
    });
  }
});

// Gemini Import Recipe from text / notes
app.post("/api/gemini/import-recipe", async (req, res) => {
  try {
    const { rawText } = req.body;
    if (!rawText || typeof rawText !== "string") {
      return res.status(400).json({ error: "Brak tekstu przepisu do zaimportowania" });
    }

    const ai = getGemini();
    if (!ai) {
      // Fallback simple parser
      return res.json({
        title: rawText.slice(0, 30).trim() || "Nowy przepis",
        category: "Obiad",
        prepTime: "30 min",
        kcal: 450,
        protein: 20,
        fat: 15,
        carbs: 55,
        description: "Zaimportowany przepis kulinarny.",
        ingredients: [
          { name: "Składnik główny", amount: 150, unit: "g" },
          { name: "Przyprawy i dodatki", amount: 1, unit: "szt" }
        ],
        instructions: rawText.split("\n").filter(l => l.trim().length > 0)
      });
    }

    const prompt = `Przeanalizuj poniższy tekst z przepisem kulinarnym i wyodrębnij z niego ustrukturyzowane dane.
Oszacuj kaloryczność i makroskładniki na 1 porcję jeśli nie są podane bezpośrednio.
Dopasuj nazwy składników w prostej mianownikowej formie (np. "Cebula", "Mąka pszenna", "Pierś z kurczaka").

Tekst przepisu:
${rawText}

Zwróć WYŁĄCZNIE poprawny JSON bez formatowania markdown:
{
  "title": "Nazwa potrawy",
  "category": "Śniadanie" | "Obiad" | "Kolacja" | "Przekąska",
  "prepTime": "np. 35 min",
  "kcal": 520,
  "protein": 30,
  "fat": 18,
  "carbs": 60,
  "description": "Krótkie streszczenie potrawy",
  "ingredients": [
    { "name": "Nazwa", "amount": 100, "unit": "g" | "ml" | "szt" }
  ],
  "instructions": [
    "Krok 1",
    "Krok 2"
  ]
}`;

    const text = await generateGeminiContent(prompt, "application/json");
    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (error: any) {
    console.error("Gemini import error:", error);
    res.status(500).json({ error: "Błąd parsowania przepisu przez AI." });
  }
});

// Proxy for OpenFoodFacts Search (with fallback popular polish groceries)
app.get("/api/openfoodfacts/search", async (req, res) => {
  const query = (req.query.q as string || "").trim();
  if (!query) {
    return res.json({ products: [] });
  }

  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=10&fields=code,product_name,product_name_pl,nutriments,quantity,brands,image_small_url`;
    const response = await fetch(url, {
      headers: { "User-Agent": "MojaKuchniaAssistant/2.0 (contact@mojakuchnia.app)" }
    });

    if (!response.ok) {
      throw new Error(`OpenFoodFacts status: ${response.status}`);
    }

    const data = await response.json();
    const products = (data.products || []).map((p: any) => {
      const nutriments = p.nutriments || {};
      const kcal = Math.round(nutriments["energy-kcal_100g"] || (nutriments["energy-kj_100g"] ? nutriments["energy-kj_100g"] / 4.184 : 0));
      const protein = Number((nutriments["proteins_100g"] || 0).toFixed(1));
      const fat = Number((nutriments["fat_100g"] || 0).toFixed(1));
      const carbs = Number((nutriments["carbohydrates_100g"] || 0).toFixed(1));

      return {
        code: p.code || "",
        name: p.product_name_pl || p.product_name || query,
        brand: p.brands || "",
        kcalPer100g: kcal,
        proteinPer100g: protein,
        fatPer100g: fat,
        carbsPer100g: carbs,
        image: p.image_small_url || ""
      };
    });

    return res.json({ products });
  } catch (err) {
    console.warn("OpenFoodFacts search error, using fallback matching:", err);
    // Fallback dictionary for common polish items
    const fallbackDB = [
      { name: "Serek wiejski naturalny", kcalPer100g: 97, proteinPer100g: 11.0, fatPer100g: 5.0, carbsPer100g: 2.0 },
      { name: "Skyr naturalny", kcalPer100g: 65, proteinPer100g: 12.0, fatPer100g: 0.2, carbsPer100g: 4.1 },
      { name: "Pierś z kurczaka", kcalPer100g: 120, proteinPer100g: 22.5, fatPer100g: 2.5, carbsPer100g: 0.0 },
      { name: "Banan", kcalPer100g: 89, proteinPer100g: 1.1, fatPer100g: 0.3, carbsPer100g: 22.8 },
      { name: "Jajka kurze całe (szt)", kcalPer100g: 143, proteinPer100g: 12.6, fatPer100g: 9.5, carbsPer100g: 0.7 },
      { name: "Chleb żytni na zakwasie", kcalPer100g: 235, proteinPer100g: 6.0, fatPer100g: 1.5, carbsPer100g: 48.0 },
      { name: "Oliwa z oliwek", kcalPer100g: 884, proteinPer100g: 0.0, fatPer100g: 100.0, carbsPer100g: 0.0 },
      { name: "Pomidor malinowy", kcalPer100g: 18, proteinPer100g: 0.9, fatPer100g: 0.2, carbsPer100g: 3.9 },
      { name: "Płatki owsiane górskie", kcalPer100g: 366, proteinPer100g: 13.5, fatPer100g: 7.0, carbsPer100g: 63.0 },
      { name: "Mleko 2.0% świeże", kcalPer100g: 50, proteinPer100g: 3.3, fatPer100g: 2.0, carbsPer100g: 4.8 },
      { name: "Ser Gouda", kcalPer100g: 356, proteinPer100g: 25.0, fatPer100g: 28.0, carbsPer100g: 0.0 },
      { name: "Makaron spaghetti (suchy)", kcalPer100g: 350, proteinPer100g: 12.0, fatPer100g: 1.5, carbsPer100g: 72.0 },
      { name: "Ryż basmati (suchy)", kcalPer100g: 355, proteinPer100g: 8.5, fatPer100g: 0.8, carbsPer100g: 78.0 },
      { name: "Awokado Hass", kcalPer100g: 160, proteinPer100g: 2.0, fatPer100g: 14.7, carbsPer100g: 8.5 }
    ];

    const filtered = fallbackDB
      .filter(item => item.name.toLowerCase().includes(query.toLowerCase()))
      .map(item => ({ ...item, code: "sample-" + Math.random().toString(36).slice(2, 7) }));

    return res.json({ products: filtered.length ? filtered : [
      {
        code: "custom",
        name: query,
        kcalPer100g: 100,
        proteinPer100g: 5,
        fatPer100g: 3,
        carbsPer100g: 12
      }
    ] });
  }
});

// Proxy for Barcode Lookup (Catalog -> OpenFoodFacts -> Gemini AI Fallback)
app.get("/api/openfoodfacts/barcode/:code", async (req, res) => {
  const { code } = req.params;
  const cleanCode = code.trim().replace(/\s+/g, "");

  // 1. First check curated Polish products catalog (covers private store labels like Biedronka Be Power)
  if (POLISH_PRODUCTS_CATALOG[cleanCode]) {
    const item = POLISH_PRODUCTS_CATALOG[cleanCode];
    return res.json({
      found: true,
      source: "catalog",
      product: {
        code: cleanCode,
        name: item.name,
        brand: item.brand,
        quantity: item.quantity,
        kcalPer100g: item.kcalPer100g,
        proteinPer100g: item.proteinPer100g,
        fatPer100g: item.fatPer100g,
        carbsPer100g: item.carbsPer100g,
        category: item.category,
        zone: item.zone,
        image: ""
      }
    });
  }

  // 2. Query OpenFoodFacts API
  try {
    const url = `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(cleanCode)}.json`;
    const response = await fetch(url, {
      headers: { "User-Agent": "MojaKuchniaAssistant/2.0 (contact@mojakuchnia.app)" }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.status === 1 && data.product) {
        const p = data.product;
        const nutriments = p.nutriments || {};
        const kcal = Math.round(nutriments["energy-kcal_100g"] || (nutriments["energy-kj_100g"] ? nutriments["energy-kj_100g"] / 4.184 : 0));
        const protein = Number((nutriments["proteins_100g"] || 0).toFixed(1));
        const fat = Number((nutriments["fat_100g"] || 0).toFixed(1));
        const carbs = Number((nutriments["carbohydrates_100g"] || 0).toFixed(1));

        // Extract meaningful name
        let resolvedName = (p.product_name_pl || p.product_name || p.generic_name_pl || p.generic_name || "").trim();
        if (!resolvedName && p.categories) {
          resolvedName = p.categories.split(',')[0].trim();
        }
        if (!resolvedName && p.brands) {
          resolvedName = `${p.brands} produkt`;
        }

        // Only return if we have a real name, otherwise fall through to Gemini
        if (resolvedName && resolvedName.toLowerCase() !== "produkt zeskanowany") {
          return res.json({
            found: true,
            source: "openfoodfacts",
            product: {
              code: p.code || cleanCode,
              name: resolvedName,
              brand: p.brands || "",
              quantity: p.quantity || "100g",
              kcalPer100g: kcal,
              proteinPer100g: protein,
              fatPer100g: fat,
              carbsPer100g: carbs,
              category: "Inne",
              zone: "fridge",
              image: p.image_small_url || ""
            }
          });
        }
      }
    }
  } catch (err: any) {
    console.warn("OpenFoodFacts query error:", err?.message);
  }

  // 3. Fallback: Ask Gemini to identify the Polish EAN barcode
  try {
    const prompt = `Jesteś ekspertem produktów spożywczych na polskim rynku (Biedronka, Lidl, Dino, Żabka, itp.).
Podaj dokładne informacje o produkcie o kodzie kreskowym EAN: "${cleanCode}".
Zwróć WYŁĄCZNIE poprawny format JSON z polami:
{
  "name": "Pełna nazwa produktu",
  "brand": "Marka lub sieć (np. Biedronka / Be Power)",
  "quantity": "Gramatura np. 500 ml lub 250 g",
  "kcalPer100g": liczba (kcal na 100g lub 100ml),
  "proteinPer100g": liczba (g),
  "fatPer100g": liczba (g),
  "carbsPer100g": liczba (g),
  "category": "Napoje" | "Nabiał" | "Warzywa" | "Owoce" | "Pieczywo" | "Mięso i ryby" | "Sosy i dodatki" | "Suche" | "Przekąski" | "Inne",
  "zone": "fridge" | "freezer" | "pantry"
}`;

    const text = await generateGeminiContent(prompt, "application/json");
    const parsed = JSON.parse(text);

    if (parsed && parsed.name) {
      return res.json({
        found: true,
        source: "gemini",
        product: {
          code: cleanCode,
          name: parsed.name,
          brand: parsed.brand || "",
          quantity: parsed.quantity || "500 ml",
          kcalPer100g: Number(parsed.kcalPer100g) || 0,
          proteinPer100g: Number(parsed.proteinPer100g) || 0,
          fatPer100g: Number(parsed.fatPer100g) || 0,
          carbsPer100g: Number(parsed.carbsPer100g) || 0,
          category: parsed.category || "Inne",
          zone: parsed.zone || "fridge",
          image: ""
        }
      });
    }
  } catch (geminiErr: any) {
    console.warn("Gemini barcode identification error:", geminiErr?.message);
  }

  return res.json({ found: false, code: cleanCode });
});

// Gemini Vision: Recognize Product Directly from Camera Photo
app.post("/api/gemini/scan-photo", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg" } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "Brak zdjęcia (imageBase64)" });
    }

    const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z0-9.+]+);base64,/);
    const effectiveMime = mimeMatch ? mimeMatch[1] : (mimeType || "image/jpeg");
    const cleanBase64 = imageBase64.replace(/^data:image\/[^;]+;base64,/, "");

    const prompt = `Jesteś zaawansowanym asystentem rozpoznawania artykułów spożywczych ze zdjęć (opakowania, puszki, butelki, etykiety) na rynku polskim (np. Biedronka, Lidl, Żabka, Carrefour).
Przeanalizuj to zdjęcie i zidentyfikuj dokładnie produkt (np. 'Be Power Zero Sugar Napój energetyzujący 500ml', 'Mleko Łaciate 2% 1L', itp.).
Zwróć WYŁĄCZNIE poprawny format JSON z polami:
{
  "name": "Pełna nazwa produktu",
  "brand": "Marka producenta lub sieci",
  "quantity": "Waga lub objętość (np. 500 ml, 250 g)",
  "currentAmount": liczba gramów lub mililitrów (np. 500),
  "unit": "ml" | "g" | "szt",
  "kcalPer100g": liczba,
  "proteinPer100g": liczba,
  "fatPer100g": liczba,
  "carbsPer100g": liczba,
  "category": "Napoje" | "Nabiał" | "Warzywa" | "Owoce" | "Pieczywo" | "Mięso i ryby" | "Sosy i dodatki" | "Suche" | "Przekąski" | "Inne",
  "zone": "fridge" | "freezer" | "pantry",
  "estimatedShelfLifeDays": liczba dni trwałości (np. 14 dla nabiału, 180 dla napoju w puszce, 3 dla pieczywa),
  "barcode": "opcjonalnie kod kreskowy jeśli jest czytelny"
}`;

    const contents = [
      prompt,
      {
        inlineData: {
          mimeType,
          data: cleanBase64,
        },
      },
    ];

    const text = await generateGeminiContent(contents, "application/json");
    const parsed = JSON.parse(text);

    return res.json({ success: true, product: parsed });
  } catch (error: any) {
    console.error("Gemini photo scan error:", error);
    return res.status(500).json({
      error: "Nie udało się rozpoznać produktu ze zdjęcia.",
      details: error?.message || String(error)
    });
  }
});

// Fitatu-style AI nutrition lookup for ingredients
app.post("/api/nutrition/estimate", async (req, res) => {
  try {
    const { ingredientName } = req.body;
    if (!ingredientName || typeof ingredientName !== "string") {
      return res.status(400).json({ error: "Brak nazwy składnika" });
    }

    const ai = getGemini();
    if (!ai) {
      return res.json({
        name: ingredientName,
        kcalPer100g: 100,
        proteinPer100g: 5,
        fatPer100g: 3,
        carbsPer100g: 12,
        pieceWeightG: 100
      });
    }

    const prompt = `Jesteś dietetyczną bazą wartości odżywczych jak w Fitatu/MyFitnessPal.
Dla podanego składnika: "${ingredientName.trim()}"
Oszacuj typowe wartości odżywcze na 100g oraz typową wagę 1 sztuki (jeśli dotyczy, np. banan=120g, jajko=55g, kromka=35g, jabłko=160g, pomidor=120g; jeśli sypkie lub płynne daj 100).
Zwróć WYŁĄCZNIE czysty JSON:
{
  "name": "${ingredientName.trim()}",
  "kcalPer100g": liczba,
  "proteinPer100g": liczba,
  "fatPer100g": liczba,
  "carbsPer100g": liczba,
  "pieceWeightG": liczba
}`;

    const text = await generateGeminiContent(prompt, "application/json");
    const parsed = JSON.parse(text);
    return res.json({
      name: parsed.name || ingredientName,
      kcalPer100g: Number(parsed.kcalPer100g) || 0,
      proteinPer100g: Number(parsed.proteinPer100g) || 0,
      fatPer100g: Number(parsed.fatPer100g) || 0,
      carbsPer100g: Number(parsed.carbsPer100g) || 0,
      pieceWeightG: Number(parsed.pieceWeightG) || 100
    });
  } catch (err: any) {
    console.error("Estimate ingredient error:", err);
    return res.json({
      name: req.body?.ingredientName || "Składnik",
      kcalPer100g: 100,
      proteinPer100g: 5,
      fatPer100g: 3,
      carbsPer100g: 12,
      pieceWeightG: 100
    });
  }
});

// Vite middleware & Static SPA handling
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Moja Kuchnia Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
