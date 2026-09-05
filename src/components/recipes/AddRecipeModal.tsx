import { useState, FormEvent, useEffect, useMemo } from 'react';
import { Recipe, RecipeIngredient, MealCategory, PantryItem, UnitType } from '../../types';
import { BottomSheet } from '../common/BottomSheet';
import { CustomSelect } from '../common/CustomSelect';
import {
  calculateIngredientNutrition,
  calculateRecipeNutritionTotals,
  FOOD_NUTRITION_DATABASE,
} from '../../utils/nutritionDatabase';
import {
  Plus,
  Trash2,
  Sparkles,
  Loader2,
  BookOpen,
  ShoppingBag,
  Calculator,
  Sliders,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface AddRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (recipe: Omit<Recipe, 'id'>, autoAddToShopping?: boolean) => void;
  pantry: PantryItem[];
  initialRecipe?: Recipe | null;
}

interface IngredientItemState extends RecipeIngredient {
  customKcal100?: number;
  customProtein100?: number;
  customFat100?: number;
  customCarbs100?: number;
  isCustomMacrosOpen?: boolean;
  isAiEstimating?: boolean;
  source?: string;
  matchedName?: string;
}

export function AddRecipeModal({
  isOpen,
  onClose,
  onSave,
  pantry,
  initialRecipe,
}: AddRecipeModalProps) {
  const [activeTab, setActiveTab] = useState<'manual' | 'import'>('manual');

  // Basic info
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<MealCategory>('Obiad');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCat, setIsCustomCat] = useState(false);
  const [prepTime, setPrepTime] = useState('20 min');
  const [description, setDescription] = useState('');

  // Fitatu-like calculation state
  const [calculationMode, setCalculationMode] = useState<'auto' | 'manual'>('auto');
  const [servings, setServings] = useState<number>(1);

  // Manual nutrition inputs (when calculationMode === 'manual')
  const [manualKcal, setManualKcal] = useState<number>(450);
  const [manualProtein, setManualProtein] = useState<number>(25);
  const [manualFat, setManualFat] = useState<number>(15);
  const [manualCarbs, setManualCarbs] = useState<number>(50);

  // Ingredients with enriched macro tracking
  const [ingredients, setIngredients] = useState<IngredientItemState[]>([
    { name: '', amount: 100, unit: 'g' },
  ]);

  const [instructions, setInstructions] = useState<string[]>(['']);
  const [autoAddToShopping, setAutoAddToShopping] = useState(false);

  // Import form state
  const [rawText, setRawText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // Combined product suggestions for datalist (Pantry + Fitatu Food Database)
  const productSuggestions = useMemo(() => {
    const list: { name: string; desc: string }[] = [];
    const seen = new Set<string>();

    // Pantry first
    pantry.forEach(p => {
      if (!seen.has(p.name.toLowerCase())) {
        seen.add(p.name.toLowerCase());
        list.push({
          name: p.name,
          desc: `W spiżarni: ${p.currentAmount} ${p.unit} · ${p.kcalPer100g || 0} kcal/100g`,
        });
      }
    });

    // Fitatu database
    FOOD_NUTRITION_DATABASE.forEach(f => {
      if (!seen.has(f.name.toLowerCase())) {
        seen.add(f.name.toLowerCase());
        list.push({
          name: f.name,
          desc: `Baza Fitatu: ${f.kcalPer100g} kcal/100g (B: ${f.proteinPer100g}g, T: ${f.fatPer100g}g, W: ${f.carbsPer100g}g)`,
        });
      }
    });

    return list;
  }, [pantry]);

  // Synchronize when initialRecipe changes or modal opens
  useEffect(() => {
    if (initialRecipe) {
      setTitle(initialRecipe.title || '');
      const standardCats = ['Śniadanie', 'Obiad', 'Kolacja', 'Zupa', 'Przekąska', 'Deser'];
      if (standardCats.includes(initialRecipe.category)) {
        setCategory(initialRecipe.category);
        setIsCustomCat(false);
        setCustomCategory('');
      } else {
        setCategory('Inna...');
        setIsCustomCat(true);
        setCustomCategory(initialRecipe.category);
      }
      setPrepTime(initialRecipe.prepTime || '20 min');
      setServings(initialRecipe.servings || 1);
      setManualKcal(initialRecipe.kcal || 0);
      setManualProtein(initialRecipe.protein || 0);
      setManualFat(initialRecipe.fat || 0);
      setManualCarbs(initialRecipe.carbs || 0);
      setDescription(initialRecipe.description || '');

      // Load ingredients and calculate their macros
      const loadedIngredients =
        initialRecipe.ingredients && initialRecipe.ingredients.length > 0
          ? initialRecipe.ingredients.map(ing => {
              const calc = calculateIngredientNutrition(ing.name, ing.amount, ing.unit, pantry);
              return {
                ...ing,
                kcal: ing.kcal ?? calc.kcal,
                protein: ing.protein ?? calc.protein,
                fat: ing.fat ?? calc.fat,
                carbs: ing.carbs ?? calc.carbs,
                source: calc.source,
                matchedName: calc.matchedName,
              };
            })
          : [{ name: '', amount: 100, unit: 'g' as UnitType }];

      setIngredients(loadedIngredients);
      setInstructions(
        initialRecipe.instructions && initialRecipe.instructions.length > 0
          ? initialRecipe.instructions
          : ['']
      );
      setAutoAddToShopping(false);
      setActiveTab('manual');
      setCalculationMode('auto');
    } else {
      // Reset to defaults for a new recipe
      setTitle('');
      setCategory('Obiad');
      setIsCustomCat(false);
      setCustomCategory('');
      setPrepTime('20 min');
      setServings(1);
      setManualKcal(450);
      setManualProtein(25);
      setManualFat(15);
      setManualCarbs(50);
      setDescription('');
      setIngredients([
        {
          name: '',
          amount: 100,
          unit: 'g',
          kcal: 0,
          protein: 0,
          fat: 0,
          carbs: 0,
        },
      ]);
      setInstructions(['']);
      setAutoAddToShopping(false);
      setActiveTab('manual');
      setCalculationMode('auto');
    }
  }, [initialRecipe, isOpen]);

  // Recalculate an ingredient's macros when its name, amount, unit, or custom values change
  const refreshIngredientMacros = (
    item: IngredientItemState,
    customOverride?: { kcal?: number; protein?: number; fat?: number; carbs?: number }
  ): IngredientItemState => {
    if (!item.name.trim() || !item.amount) {
      return { ...item, kcal: 0, protein: 0, fat: 0, carbs: 0, source: 'default' };
    }

    const custom = customOverride || (item.customKcal100 !== undefined
      ? {
          kcal: item.customKcal100,
          protein: item.customProtein100,
          fat: item.customFat100,
          carbs: item.customCarbs100,
        }
      : undefined);

    const calc = calculateIngredientNutrition(item.name, item.amount, item.unit, pantry, custom);

    return {
      ...item,
      kcal: calc.kcal,
      protein: calc.protein,
      fat: calc.fat,
      carbs: calc.carbs,
      source: calc.source,
      matchedName: calc.matchedName,
    };
  };

  const handleAddIngredient = () => {
    setIngredients([
      ...ingredients,
      {
        name: '',
        amount: 100,
        unit: 'g',
        kcal: 0,
        protein: 0,
        fat: 0,
        carbs: 0,
      },
    ]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleIngredientFieldChange = (
    index: number,
    field: keyof IngredientItemState,
    value: any
  ) => {
    setIngredients(prev => {
      const updated = [...prev];
      const target = { ...updated[index], [field]: value };
      updated[index] = refreshIngredientMacros(target);
      return updated;
    });
  };

  const handleCustomMacroChange = (
    index: number,
    macroKey: 'customKcal100' | 'customProtein100' | 'customFat100' | 'customCarbs100',
    val: number
  ) => {
    setIngredients(prev => {
      const updated = [...prev];
      const target = { ...updated[index], [macroKey]: val };
      updated[index] = refreshIngredientMacros(target, {
        kcal: macroKey === 'customKcal100' ? val : target.customKcal100,
        protein: macroKey === 'customProtein100' ? val : target.customProtein100,
        fat: macroKey === 'customFat100' ? val : target.customFat100,
        carbs: macroKey === 'customCarbs100' ? val : target.customCarbs100,
      });
      return updated;
    });
  };

  // Estimate ingredient with AI if not in database
  const handleEstimateIngredientWithAi = async (index: number) => {
    const item = ingredients[index];
    if (!item.name.trim()) return;

    setIngredients(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], isAiEstimating: true };
      return copy;
    });

    try {
      const res = await fetch('/api/nutrition/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredientName: item.name }),
      });

      if (res.ok) {
        const data = await res.json();
        setIngredients(prev => {
          const copy = [...prev];
          const updated = {
            ...copy[index],
            customKcal100: data.kcalPer100g,
            customProtein100: data.proteinPer100g,
            customFat100: data.fatPer100g,
            customCarbs100: data.carbsPer100g,
            isAiEstimating: false,
            isCustomMacrosOpen: true,
          };
          copy[index] = refreshIngredientMacros(updated, {
            kcal: data.kcalPer100g,
            protein: data.proteinPer100g,
            fat: data.fatPer100g,
            carbs: data.carbsPer100g,
          });
          return copy;
        });
      }
    } catch {
      setIngredients(prev => {
        const copy = [...prev];
        copy[index] = { ...copy[index], isAiEstimating: false };
        return copy;
      });
    }
  };

  const handleAddInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const handleRemoveInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index));
  };

  const handleInstructionChange = (index: number, val: string) => {
    const updated = [...instructions];
    updated[index] = val;
    setInstructions(updated);
  };

  // Recipe totals derived automatically from ingredients
  const autoTotals = useMemo(() => {
    return calculateRecipeNutritionTotals(ingredients, servings);
  }, [ingredients, servings]);

  // Current active values for submission
  const effectiveKcal = calculationMode === 'auto' ? autoTotals.perServingKcal : manualKcal;
  const effectiveProtein = calculationMode === 'auto' ? autoTotals.perServingProtein : manualProtein;
  const effectiveFat = calculationMode === 'auto' ? autoTotals.perServingFat : manualFat;
  const effectiveCarbs = calculationMode === 'auto' ? autoTotals.perServingCarbs : manualCarbs;

  // AI Recipe Import
  const handleImportRecipe = async () => {
    if (!rawText.trim()) return;
    setIsImporting(true);
    setImportError(null);

    try {
      const res = await fetch('/api/gemini/import-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText }),
      });

      if (!res.ok) throw new Error('Błąd serwera');
      const parsed = await res.json();

      if (parsed.title) setTitle(parsed.title);
      if (parsed.category) setCategory(parsed.category);
      if (parsed.prepTime) setPrepTime(parsed.prepTime);
      if (parsed.description) setDescription(parsed.description);

      if (Array.isArray(parsed.ingredients) && parsed.ingredients.length > 0) {
        const parsedIngs = parsed.ingredients.map((ing: any) => {
          const item: IngredientItemState = {
            name: ing.name || '',
            amount: Number(ing.amount) || 100,
            unit: (ing.unit as UnitType) || 'g',
          };
          return refreshIngredientMacros(item);
        });
        setIngredients(parsedIngs);
      }

      if (Array.isArray(parsed.instructions) && parsed.instructions.length > 0) {
        setInstructions(parsed.instructions);
      }

      setCalculationMode('auto');
      setActiveTab('manual');
    } catch {
      setImportError('Nie udało się zaimportować przepisu. Sprawdź tekst lub wpisz ręcznie.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalCategory = isCustomCat && customCategory.trim() ? customCategory.trim() : category;

    const validIngredients: RecipeIngredient[] = ingredients
      .filter(i => i.name.trim().length > 0)
      .map(i => ({
        name: i.name.trim(),
        amount: Number(i.amount) || 1,
        unit: i.unit,
        kcal: i.kcal,
        protein: i.protein,
        fat: i.fat,
        carbs: i.carbs,
      }));

    const validInstructions = instructions.filter(i => i.trim().length > 0);

    onSave(
      {
        title: title.trim(),
        category: finalCategory,
        prepTime,
        servings: Math.max(1, servings || 1),
        kcal: effectiveKcal,
        protein: effectiveProtein,
        fat: effectiveFat,
        carbs: effectiveCarbs,
        totalKcal: autoTotals.totalKcal,
        totalProtein: autoTotals.totalProtein,
        totalFat: autoTotals.totalFat,
        totalCarbs: autoTotals.totalCarbs,
        description: description.trim(),
        ingredients: validIngredients,
        instructions: validInstructions,
      },
      autoAddToShopping
    );

    onClose();
  };

  const categoryOptions = [
    { value: 'Śniadanie', label: '🥣 Śniadanie' },
    { value: 'Obiad', label: '🍲 Obiad' },
    { value: 'Kolacja', label: '🥗 Kolacja' },
    { value: 'Zupa', label: '🍵 Zupa' },
    { value: 'Przekąska', label: '🥪 Przekąska' },
    { value: 'Deser', label: '🍰 Deser' },
    { value: 'Inna...', label: '✏️ Inna kategoria...' },
  ];

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={initialRecipe ? 'Edytuj Przepis' : 'Nowy Przepis'}
      subtitle={
        initialRecipe
          ? 'Automatyczne liczenie kalorii i makro na wzór Fitatu'
          : 'Skomponuj przepis z automatycznym kalkulatorem kalorii i makroskładników'
      }
      id="modal-add-recipe"
    >
      <div className="space-y-4">
        {/* Tab switch only when creating a new recipe */}
        {!initialRecipe && (
          <div className="flex p-1 bg-[#FAF6F0] rounded-2xl border border-[#EBE6DF]">
            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'manual'
                  ? 'bg-white text-[#4A443E] shadow-xs'
                  : 'text-[#9A8F85] hover:text-[#4A443E]'
              }`}
            >
              Kreator z kalkulatorem makro
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('import')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'import'
                  ? 'bg-white text-[#D68C7A] shadow-xs'
                  : 'text-[#9A8F85] hover:text-[#D68C7A]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D68C7A]" />
              Import z tekstu / AI
            </button>
          </div>
        )}

        {activeTab === 'import' && !initialRecipe ? (
          /* Import Tab */
          <div className="space-y-3">
            <div className="p-3.5 bg-[#FAF6F0] rounded-2xl border border-[#EBE6DF] text-xs text-[#4A443E]">
              <div className="font-bold text-[#4A443E] mb-1 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#D68C7A]" />
                Wklej przepis z internetu lub notatek:
              </div>
              AI rozpozna składniki, przypisze im gramatury i automatycznie obliczy kalorie oraz makroskładniki.
            </div>

            <textarea
              rows={6}
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              placeholder="np. 'Omlet warzywny. Składniki: 3 jajka, 50g szpinaku, 1 pomidor, łyżeczka oliwy...'"
              className="w-full p-3.5 bg-[#FAF6F0] border border-[#EBE6DF] rounded-2xl text-xs text-[#4A443E] placeholder-[#9A8F85] focus:ring-2 focus:ring-[#D68C7A]/30 focus:border-[#D68C7A] focus:outline-none"
            />

            {importError && (
              <div className="p-3 bg-[#FDF0ED] text-[#C25442] text-xs rounded-2xl border border-[#F5D2CB]">
                {importError}
              </div>
            )}

            <button
              type="button"
              onClick={handleImportRecipe}
              disabled={isImporting || !rawText.trim()}
              className="w-full py-3.5 bg-[#D68C7A] hover:bg-[#C27866] text-white font-bold text-xs rounded-2xl transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Analizowanie składników i kalorii...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Przelicz i otwórz w kalkulatorze
                </>
              )}
            </button>
          </div>
        ) : (
          /* Manual Form with Fitatu-like Calculator */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-[11px] font-semibold text-[#9A8F85] uppercase tracking-wider mb-1.5">
                Nazwa potrawy *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="np. Owsianka proteinowa z bananem i masłem orzechowym"
                className="w-full px-3.5 py-2.5 bg-[#FAF6F0] border border-[#EBE6DF] rounded-2xl text-sm text-[#4A443E] placeholder-[#9A8F85] focus:ring-2 focus:ring-[#D68C7A]/30 focus:border-[#D68C7A] focus:outline-none"
                id="input-recipe-title"
              />
            </div>

            {/* Category & Prep Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <CustomSelect
                  label="Kategoria posiłku"
                  value={isCustomCat ? 'Inna...' : category}
                  onChange={v => {
                    if (v === 'Inna...') {
                      setIsCustomCat(true);
                    } else {
                      setIsCustomCat(false);
                      setCategory(v as MealCategory);
                    }
                  }}
                  options={categoryOptions}
                  id="select-recipe-category"
                />
                {isCustomCat && (
                  <input
                    type="text"
                    required
                    value={customCategory}
                    onChange={e => setCustomCategory(e.target.value)}
                    placeholder="Wpisz nazwę kategorii"
                    className="w-full mt-1.5 px-3 py-1.5 bg-[#FAF6F0] border border-[#EBE6DF] rounded-xl text-xs text-[#4A443E] focus:outline-none focus:ring-1 focus:ring-[#D68C7A]"
                  />
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#9A8F85] uppercase tracking-wider mb-1.5">
                  Czas przygotowania
                </label>
                <input
                  type="text"
                  value={prepTime}
                  onChange={e => setPrepTime(e.target.value)}
                  placeholder="np. 25 min"
                  className="w-full px-3.5 py-2.5 bg-[#FAF6F0] border border-[#EBE6DF] rounded-2xl text-sm text-[#4A443E] focus:ring-2 focus:ring-[#D68C7A]/30 focus:outline-none"
                  id="input-recipe-preptime"
                />
              </div>
            </div>

            {/* FITATU NUTRITION CALCULATOR CARD */}
            <div className="p-4 bg-[#FAF6F0] rounded-2xl border border-[#EBE6DF] space-y-3 shadow-2xs">
              {/* Header with Mode Toggle & Servings */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EBE6DF] pb-2.5">
                <div className="flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-[#7B8A75]" />
                  <span className="text-xs font-bold text-[#4A443E]">
                    Kalkulator kalorii i makro
                  </span>
                </div>

                {/* Servings counter */}
                <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-xl border border-[#EBE6DF]">
                  <span className="text-[11px] font-semibold text-[#9A8F85]">Porcje:</span>
                  <button
                    type="button"
                    onClick={() => setServings(Math.max(1, servings - 1))}
                    className="w-5 h-5 rounded-md bg-[#FAF6F0] hover:bg-[#EBE6DF] text-[#4A443E] text-xs font-bold flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="text-xs font-bold text-[#4A443E] w-4 text-center">
                    {servings}
                  </span>
                  <button
                    type="button"
                    onClick={() => setServings(servings + 1)}
                    className="w-5 h-5 rounded-md bg-[#FAF6F0] hover:bg-[#EBE6DF] text-[#4A443E] text-xs font-bold flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Mode Selector Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCalculationMode('auto')}
                  className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    calculationMode === 'auto'
                      ? 'bg-[#7B8A75] text-white shadow-2xs'
                      : 'bg-white text-[#7A6F66] border border-[#EBE6DF] hover:bg-[#FDFBF7]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Auto ze składników (Fitatu)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCalculationMode('manual');
                    setManualKcal(autoTotals.perServingKcal || 450);
                    setManualProtein(autoTotals.perServingProtein || 25);
                    setManualFat(autoTotals.perServingFat || 15);
                    setManualCarbs(autoTotals.perServingCarbs || 50);
                  }}
                  className={`py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    calculationMode === 'manual'
                      ? 'bg-[#4A443E] text-white shadow-2xs'
                      : 'bg-white text-[#7A6F66] border border-[#EBE6DF] hover:bg-[#FDFBF7]'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Ręcznie</span>
                </button>
              </div>

              {calculationMode === 'auto' ? (
                /* Fitatu Live Macro Display */
                <div className="space-y-2.5 pt-1">
                  {/* Big Kcal Display */}
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-2xl font-black text-[#4A443E]">
                        {autoTotals.perServingKcal}
                      </span>
                      <span className="text-xs font-bold text-[#7A6F66] ml-1">kcal / porcję</span>
                    </div>
                    {servings > 1 && (
                      <span className="text-[11px] text-[#9A8F85]">
                        (Całe danie: {autoTotals.totalKcal} kcal)
                      </span>
                    )}
                  </div>

                  {/* 3 Macro Cards (Protein, Fat, Carbs) */}
                  <div className="grid grid-cols-3 gap-2">
                    {/* Protein */}
                    <div className="p-2 rounded-xl bg-white border border-[#E2E8F0] text-center shadow-2xs">
                      <span className="text-[10px] font-bold text-[#3B82F6] uppercase tracking-wider block">
                        Białko
                      </span>
                      <span className="text-base font-bold text-[#1E293B]">
                        {autoTotals.perServingProtein} g
                      </span>
                      <span className="text-[10px] text-[#94A3B8] block">
                        {autoTotals.macroPercent.protein}% kcal
                      </span>
                    </div>

                    {/* Fat */}
                    <div className="p-2 rounded-xl bg-white border border-[#FEF3C7] text-center shadow-2xs">
                      <span className="text-[10px] font-bold text-[#D97706] uppercase tracking-wider block">
                        Tłuszcz
                      </span>
                      <span className="text-base font-bold text-[#78350F]">
                        {autoTotals.perServingFat} g
                      </span>
                      <span className="text-[10px] text-[#B45309] block">
                        {autoTotals.macroPercent.fat}% kcal
                      </span>
                    </div>

                    {/* Carbs */}
                    <div className="p-2 rounded-xl bg-white border border-[#F3E8FF] text-center shadow-2xs">
                      <span className="text-[10px] font-bold text-[#8B5CF6] uppercase tracking-wider block">
                        Węgle
                      </span>
                      <span className="text-base font-bold text-[#4C1D95]">
                        {autoTotals.perServingCarbs} g
                      </span>
                      <span className="text-[10px] text-[#7C3AED] block">
                        {autoTotals.macroPercent.carbs}% kcal
                      </span>
                    </div>
                  </div>

                  {/* Fitatu-style Macro Distribution Bar */}
                  <div>
                    <div className="h-2 w-full bg-[#E5E5E5] rounded-full overflow-hidden flex">
                      <div
                        style={{ width: `${autoTotals.macroPercent.protein}%` }}
                        className="bg-[#3B82F6] transition-all duration-300"
                        title={`Białko: ${autoTotals.macroPercent.protein}%`}
                      />
                      <div
                        style={{ width: `${autoTotals.macroPercent.fat}%` }}
                        className="bg-[#F59E0B] transition-all duration-300"
                        title={`Tłuszcz: ${autoTotals.macroPercent.fat}%`}
                      />
                      <div
                        style={{ width: `${autoTotals.macroPercent.carbs}%` }}
                        className="bg-[#8B5CF6] transition-all duration-300"
                        title={`Węglowodany: ${autoTotals.macroPercent.carbs}%`}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-[#9A8F85] mt-1 font-medium">
                      <span className="text-[#3B82F6]">● Białko {autoTotals.macroPercent.protein}%</span>
                      <span className="text-[#D97706]">● Tłuszcz {autoTotals.macroPercent.fat}%</span>
                      <span className="text-[#8B5CF6]">● Węgle {autoTotals.macroPercent.carbs}%</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Manual Inputs Mode */
                <div className="grid grid-cols-4 gap-2 pt-1">
                  <div>
                    <span className="text-[10px] text-[#9A8F85] font-semibold">Kcal</span>
                    <input
                      type="number"
                      min="0"
                      value={manualKcal}
                      onChange={e => setManualKcal(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 text-xs bg-white border border-[#EBE6DF] rounded-xl text-[#4A443E] font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#3B82F6] font-semibold">Białko (g)</span>
                    <input
                      type="number"
                      min="0"
                      value={manualProtein}
                      onChange={e => setManualProtein(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 text-xs bg-white border border-[#EBE6DF] rounded-xl text-[#4A443E] font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#D97706] font-semibold">Tłuszcz (g)</span>
                    <input
                      type="number"
                      min="0"
                      value={manualFat}
                      onChange={e => setManualFat(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 text-xs bg-white border border-[#EBE6DF] rounded-xl text-[#4A443E] font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8B5CF6] font-semibold">Węgle (g)</span>
                    <input
                      type="number"
                      min="0"
                      value={manualCarbs}
                      onChange={e => setManualCarbs(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 text-xs bg-white border border-[#EBE6DF] rounded-xl text-[#4A443E] font-bold"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* INGREDIENTS LIST WITH PER-ITEM MACROS */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <label className="text-[11px] font-semibold text-[#9A8F85] uppercase tracking-wider block">
                    Składniki i ich wartości odżywcze *
                  </label>
                  <p className="text-[10px] text-[#7A6F66]">
                    Wpisz dowolne składniki – aplikacja automatycznie przelicza makro ze spiżarni i bazy produktów.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddIngredient}
                  className="text-xs font-bold text-[#D68C7A] hover:underline flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Dodaj składnik
                </button>
              </div>

              {/* Shared Datalist for suggestions */}
              <datalist id="fitatu-product-suggestions">
                {productSuggestions.map((p, idx) => (
                  <option key={idx} value={p.name}>
                    {p.desc}
                  </option>
                ))}
              </datalist>

              <div className="space-y-2.5 mt-2">
                {ingredients.map((ing, idx) => {
                  return (
                    <div
                      key={idx}
                      className="p-2.5 bg-[#FAF6F0] rounded-2xl border border-[#EBE6DF] space-y-2"
                    >
                      {/* Top row: Name, Amount, Unit, Delete */}
                      <div className="flex items-center gap-2">
                        {/* Name input */}
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            required
                            placeholder="np. Płatki owsiane, Jajka, Łosoś..."
                            value={ing.name}
                            onChange={e =>
                              handleIngredientFieldChange(idx, 'name', e.target.value)
                            }
                            list="fitatu-product-suggestions"
                            className="w-full px-3 py-2 bg-white border border-[#EBE6DF] rounded-xl text-xs text-[#4A443E] font-medium focus:outline-none focus:ring-1 focus:ring-[#D68C7A]"
                          />
                        </div>

                        {/* Amount */}
                        <input
                          type="number"
                          step="any"
                          min="0.1"
                          required
                          placeholder="Ilość"
                          value={ing.amount}
                          onChange={e =>
                            handleIngredientFieldChange(
                              idx,
                              'amount',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-16 px-2 py-2 bg-white border border-[#EBE6DF] rounded-xl text-xs text-[#4A443E] text-center font-bold"
                        />

                        {/* Unit */}
                        <CustomSelect
                          value={ing.unit}
                          onChange={val =>
                            handleIngredientFieldChange(idx, 'unit', val as UnitType)
                          }
                          options={[
                            { value: 'g', label: 'g' },
                            { value: 'ml', label: 'ml' },
                            { value: 'szt', label: 'szt' },
                            { value: 'opak', label: 'opak' },
                          ]}
                          className="w-16"
                          buttonClassName="py-2 px-1.5 bg-white text-xs font-semibold"
                        />

                        {/* Remove */}
                        {ingredients.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveIngredient(idx)}
                            className="p-1.5 text-[#9A8F85] hover:text-[#C25442] transition-colors"
                            title="Usuń składnik"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Bottom row: Macro pills & custom macro edit toggle */}
                      <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] pt-0.5">
                        {/* Macro summary pill for this ingredient */}
                        <div className="flex items-center gap-1.5 text-[#4A443E]">
                          <span className="font-bold text-[#D68C7A]">
                            {ing.kcal || 0} kcal
                          </span>
                          <span className="text-[#9A8F85]">·</span>
                          <span className="text-[#3B82F6] font-medium">B: {ing.protein || 0}g</span>
                          <span className="text-[#D97706] font-medium">T: {ing.fat || 0}g</span>
                          <span className="text-[#8B5CF6] font-medium">W: {ing.carbs || 0}g</span>

                          {ing.source === 'pantry' && (
                            <span className="bg-[#EBF3E8] text-[#557A46] text-[10px] font-semibold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Spiżarnia
                            </span>
                          )}
                          {ing.source === 'database' && (
                            <span className="bg-[#F0F4F8] text-[#334E68] text-[10px] font-semibold px-1.5 py-0.5 rounded-md">
                              Baza Fitatu
                            </span>
                          )}
                        </div>

                        {/* Action buttons: AI estimate or manual fine-tune */}
                        <div className="flex items-center gap-2">
                          {/* AI lookup */}
                          <button
                            type="button"
                            onClick={() => handleEstimateIngredientWithAi(idx)}
                            disabled={!ing.name.trim() || ing.isAiEstimating}
                            className="text-[10px] font-semibold text-[#D68C7A] hover:underline flex items-center gap-1 disabled:opacity-40"
                            title="Oszacuj makro składnika z AI jeśli nie ma w bazie"
                          >
                            {ing.isAiEstimating ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Sparkles className="w-3 h-3" />
                            )}
                            Oszacuj AI
                          </button>

                          {/* Toggle manual macro fine-tuning for this ingredient */}
                          <button
                            type="button"
                            onClick={() =>
                              handleIngredientFieldChange(
                                idx,
                                'isCustomMacrosOpen',
                                !ing.isCustomMacrosOpen
                              )
                            }
                            className="text-[10px] font-semibold text-[#7A6F66] hover:text-[#4A443E] flex items-center gap-0.5"
                          >
                            <span>Własne makro</span>
                            {ing.isCustomMacrosOpen ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Expandable Manual Macro Overrides per 100g */}
                      {ing.isCustomMacrosOpen && (
                        <div className="mt-2 p-2 bg-white rounded-xl border border-[#EBE6DF] space-y-1.5 animate-fadeIn">
                          <span className="text-[10px] font-bold text-[#7A6F66] block">
                            Wartości na 100g dla "{ing.name || 'tego składnika'}":
                          </span>
                          <div className="grid grid-cols-4 gap-1.5">
                            <div>
                              <span className="text-[9px] text-[#9A8F85] block">Kcal / 100g</span>
                              <input
                                type="number"
                                min="0"
                                placeholder="Kcal"
                                value={ing.customKcal100 ?? ''}
                                onChange={e =>
                                  handleCustomMacroChange(
                                    idx,
                                    'customKcal100',
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-full px-1.5 py-1 text-xs bg-[#FAF6F0] border border-[#EBE6DF] rounded-lg text-center"
                              />
                            </div>
                            <div>
                              <span className="text-[9px] text-[#3B82F6] block">Białko / 100g</span>
                              <input
                                type="number"
                                min="0"
                                placeholder="B (g)"
                                value={ing.customProtein100 ?? ''}
                                onChange={e =>
                                  handleCustomMacroChange(
                                    idx,
                                    'customProtein100',
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-full px-1.5 py-1 text-xs bg-[#FAF6F0] border border-[#EBE6DF] rounded-lg text-center"
                              />
                            </div>
                            <div>
                              <span className="text-[9px] text-[#D97706] block">Tłuszcz / 100g</span>
                              <input
                                type="number"
                                min="0"
                                placeholder="T (g)"
                                value={ing.customFat100 ?? ''}
                                onChange={e =>
                                  handleCustomMacroChange(
                                    idx,
                                    'customFat100',
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-full px-1.5 py-1 text-xs bg-[#FAF6F0] border border-[#EBE6DF] rounded-lg text-center"
                              />
                            </div>
                            <div>
                              <span className="text-[9px] text-[#8B5CF6] block">Węgle / 100g</span>
                              <input
                                type="number"
                                min="0"
                                placeholder="W (g)"
                                value={ing.customCarbs100 ?? ''}
                                onChange={e =>
                                  handleCustomMacroChange(
                                    idx,
                                    'customCarbs100',
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-full px-1.5 py-1 text-xs bg-[#FAF6F0] border border-[#EBE6DF] rounded-lg text-center"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Checkbox: Auto-add missing ingredients to shopping list */}
            <div className="p-3 bg-[#F4F6F3] rounded-2xl border border-[#D8E0D5] flex items-start gap-2.5">
              <input
                type="checkbox"
                id="auto-add-shopping-check"
                checked={autoAddToShopping}
                onChange={e => setAutoAddToShopping(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-[#7B8A75] rounded border-[#CBD5C0] focus:ring-[#7B8A75] cursor-pointer"
              />
              <label
                htmlFor="auto-add-shopping-check"
                className="text-xs text-[#4A443E] cursor-pointer leading-tight"
              >
                <span className="font-bold block text-[#505D4A] flex items-center gap-1">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Dodaj brakujące składniki do listy zakupów
                </span>
                <span className="text-[11px] text-[#7A6F66]">
                  Aplikacja porówna listę z Twoją spiżarnią i automatycznie dopisze brakujące produkty do koszyka.
                </span>
              </label>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[11px] font-semibold text-[#9A8F85] uppercase tracking-wider mb-1.5">
                Krótki opis (opcjonalnie)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Aromatyczny, zbilansowany posiłek..."
                className="w-full px-3.5 py-2.5 bg-[#FAF6F0] border border-[#EBE6DF] rounded-2xl text-xs text-[#4A443E] placeholder-[#9A8F85] focus:ring-2 focus:ring-[#D68C7A]/30 focus:outline-none"
              />
            </div>

            {/* Preparation Steps */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold text-[#9A8F85] uppercase tracking-wider">
                  Kroki przygotowania (opcjonalnie)
                </label>
                <button
                  type="button"
                  onClick={handleAddInstruction}
                  className="text-xs font-bold text-[#D68C7A] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Dodaj krok
                </button>
              </div>
              <div className="space-y-2">
                {instructions.map((step, sidx) => (
                  <div key={sidx} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#9A8F85] w-5 text-center">
                      {sidx + 1}.
                    </span>
                    <input
                      type="text"
                      value={step}
                      onChange={e => handleInstructionChange(sidx, e.target.value)}
                      placeholder={`Krok ${sidx + 1}`}
                      className="flex-1 px-3 py-2 bg-[#FAF6F0] border border-[#EBE6DF] rounded-xl text-xs text-[#4A443E] focus:outline-none focus:ring-1 focus:ring-[#D68C7A]"
                    />
                    {instructions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveInstruction(sidx)}
                        className="p-1.5 text-[#9A8F85] hover:text-[#C25442] transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 bg-[#D68C7A] hover:bg-[#C27866] text-white font-bold rounded-2xl transition-all shadow-xs text-sm flex items-center justify-center gap-2"
                id="btn-submit-recipe"
              >
                <span>
                  {initialRecipe ? 'Zapisz zmiany w przepisie' : 'Zapisz przepis'}
                </span>
                <span className="text-xs font-normal opacity-90">
                  ({effectiveKcal} kcal / porcję)
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </BottomSheet>
  );
}
