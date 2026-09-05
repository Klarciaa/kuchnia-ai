import { useState, useEffect, FormEvent } from 'react';
import { PlannedMealItem, PantryItem, MealSlot, UnitType } from '../../types';
import { BottomSheet } from '../common/BottomSheet';
import { CustomSelect } from '../common/CustomSelect';
import { Search, Loader2, Archive, Globe, Sparkles } from 'lucide-react';

interface AddMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  defaultSlot: MealSlot;
  pantry: PantryItem[];
  onAddMeal: (meal: Omit<PlannedMealItem, 'id'>) => void;
}

export function AddMealModal({
  isOpen,
  onClose,
  date,
  defaultSlot,
  pantry,
  onAddMeal,
}: AddMealModalProps) {
  const [sourceType, setSourceType] = useState<'pantry' | 'external'>('pantry');
  const [mealSlot, setMealSlot] = useState<MealSlot>(defaultSlot);

  // Pantry source state
  const [selectedPantryId, setSelectedPantryId] = useState<string>('');
  const [pantryPortion, setPantryPortion] = useState<number>(100);

  // External / OpenFoodFacts search state
  const [externalName, setExternalName] = useState('');
  const [externalPortion, setExternalPortion] = useState<number>(100);
  const [externalUnit, setExternalUnit] = useState<UnitType>('g');
  const [kcalPer100g, setKcalPer100g] = useState<number>(100);
  const [proteinPer100g, setProteinPer100g] = useState<number>(5);
  const [fatPer100g, setFatPer100g] = useState<number>(3);
  const [carbsPer100g, setCarbsPer100g] = useState<number>(12);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    setMealSlot(defaultSlot);
    if (pantry.length > 0 && !selectedPantryId) {
      setSelectedPantryId(pantry[0].id);
    }
  }, [defaultSlot, pantry, isOpen]);

  const selectedPantryItem = pantry.find(p => p.id === selectedPantryId);

  // Search OpenFoodFacts
  const handleSearchOpenFoodFacts = async (q: string) => {
    setSearchQuery(q);
    if (q.trim().length >= 2) {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/openfoodfacts/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.products || []);
        }
      } catch (err) {
        console.warn(err);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectSearchResult = (prod: any) => {
    setExternalName(prod.name);
    if (prod.kcalPer100g) setKcalPer100g(prod.kcalPer100g);
    if (prod.proteinPer100g !== undefined) setProteinPer100g(prod.proteinPer100g);
    if (prod.fatPer100g !== undefined) setFatPer100g(prod.fatPer100g);
    if (prod.carbsPer100g !== undefined) setCarbsPer100g(prod.carbsPer100g);
    setSearchResults([]);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (sourceType === 'pantry') {
      if (!selectedPantryItem) return;
      const portion = Number(pantryPortion) || 100;
      const factor = selectedPantryItem.unit === 'szt' || selectedPantryItem.unit === 'opak'
        ? portion
        : portion / 100;

      const kcal = Math.round(selectedPantryItem.kcalPer100g * factor);
      const protein = Number((selectedPantryItem.proteinPer100g * factor).toFixed(1));
      const fat = Number((selectedPantryItem.fatPer100g * factor).toFixed(1));
      const carbs = Number((selectedPantryItem.carbsPer100g * factor).toFixed(1));

      onAddMeal({
        name: selectedPantryItem.name,
        amount: portion,
        unit: selectedPantryItem.unit,
        kcal,
        protein,
        fat,
        carbs,
        mealSlot,
        date,
        pantryItemId: selectedPantryItem.id,
        isPantrySource: true,
      });
    } else {
      if (!externalName.trim()) return;
      const portion = Number(externalPortion) || 100;
      const factor = externalUnit === 'szt' || externalUnit === 'opak'
        ? portion
        : portion / 100;

      const kcal = Math.round((Number(kcalPer100g) || 0) * factor);
      const protein = Number(((Number(proteinPer100g) || 0) * factor).toFixed(1));
      const fat = Number(((Number(fatPer100g) || 0) * factor).toFixed(1));
      const carbs = Number(((Number(carbsPer100g) || 0) * factor).toFixed(1));

      onAddMeal({
        name: externalName.trim(),
        amount: portion,
        unit: externalUnit,
        kcal,
        protein,
        fat,
        carbs,
        mealSlot,
        date,
        isPantrySource: false,
      });
    }

    onClose();
  };

  const slotOptions = [
    { value: 'breakfast', label: '🥣 Śniadanie' },
    { value: 'second_breakfast', label: '🥪 II Śniadanie' },
    { value: 'lunch', label: '🍲 Obiad' },
    { value: 'dinner', label: '🥗 Kolacja' },
  ];

  const pantryOptions = pantry.map(p => ({
    value: p.id,
    label: `${p.name} (masz: ${p.currentAmount} ${p.unit})`,
  }));

  // Calculations for preview
  let calcKcal = 0;
  let calcP = 0;
  let calcF = 0;
  let calcC = 0;

  if (sourceType === 'pantry' && selectedPantryItem) {
    const factor = selectedPantryItem.unit === 'szt' || selectedPantryItem.unit === 'opak'
      ? pantryPortion
      : pantryPortion / 100;
    calcKcal = Math.round(selectedPantryItem.kcalPer100g * factor);
    calcP = Number((selectedPantryItem.proteinPer100g * factor).toFixed(1));
    calcF = Number((selectedPantryItem.fatPer100g * factor).toFixed(1));
    calcC = Number((selectedPantryItem.carbsPer100g * factor).toFixed(1));
  } else {
    const factor = externalUnit === 'szt' || externalUnit === 'opak'
      ? externalPortion
      : externalPortion / 100;
    calcKcal = Math.round((Number(kcalPer100g) || 0) * factor);
    calcP = Number(((Number(proteinPer100g) || 0) * factor).toFixed(1));
    calcF = Number(((Number(fatPer100g) || 0) * factor).toFixed(1));
    calcC = Number(((Number(carbsPer100g) || 0) * factor).toFixed(1));
  }

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Dodaj posiłek do dziennika"
      subtitle={`Data: ${date}`}
      id="modal-add-meal"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Source Toggle */}
        <div className="flex p-1 bg-[#FAF6F0] rounded-2xl border border-[#EBE6DF]">
          <button
            type="button"
            onClick={() => setSourceType('pantry')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              sourceType === 'pantry'
                ? 'bg-white text-[#D68C7A] shadow-xs'
                : 'text-[#9A8F85] hover:text-[#4A443E]'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            Ze spiżarni (Zintegrowane)
          </button>
          <button
            type="button"
            onClick={() => setSourceType('external')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              sourceType === 'external'
                ? 'bg-white text-[#4A443E] shadow-xs'
                : 'text-[#9A8F85] hover:text-[#4A443E]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Z bazy / ręcznie
          </button>
        </div>

        {/* Meal Slot */}
        <CustomSelect
          label="Pora posiłku"
          value={mealSlot}
          onChange={v => setMealSlot(v as MealSlot)}
          options={slotOptions}
        />

        {sourceType === 'pantry' ? (
          /* From Pantry */
          <div className="space-y-3">
            <CustomSelect
              label="Wybierz produkt ze spiżarni"
              value={selectedPantryId}
              onChange={setSelectedPantryId}
              options={pantryOptions}
              placeholder="Wybierz produkt z domu..."
            />

            {selectedPantryItem && (
              <div className="p-3.5 bg-[#FAF6F0] rounded-2xl border border-[#EBE6DF] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#9A8F85]">Dostępny stan:</span>
                  <span className="font-bold text-[#4A443E]">
                    {selectedPantryItem.currentAmount} {selectedPantryItem.unit}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="block text-[11px] font-semibold text-[#9A8F85] uppercase tracking-wider mb-1">
                      Ile zjadasz? ({selectedPantryItem.unit})
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      required
                      value={pantryPortion}
                      onChange={e => setPantryPortion(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white border border-[#EBE6DF] rounded-xl text-sm font-bold text-[#4A443E] focus:outline-none focus:ring-1 focus:ring-[#D68C7A]"
                    />
                  </div>
                  <div className="text-[10px] text-[#9A8F85] pt-4 max-w-[140px] leading-tight">
                    💡 Ilość zostanie odjęta z lodówki. Gdy spadnie &lt; 25%, trafi na listę zakupów!
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* External / OpenFoodFacts */
          <div className="space-y-3">
            {/* Live Search */}
            <div>
              <label className="block text-[11px] font-semibold text-[#9A8F85] uppercase tracking-wider mb-1">
                Wyszukaj w OpenFoodFacts
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Wpisz np. Serek wiejski, Skyr, Banan..."
                  value={searchQuery}
                  onChange={e => handleSearchOpenFoodFacts(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-[#EBE6DF] rounded-2xl text-xs text-[#4A443E] placeholder-[#9A8F85] focus:outline-none focus:ring-1 focus:ring-[#D68C7A]"
                />
                <Search className="w-4 h-4 text-[#9A8F85] absolute left-3 top-3" />
                {isSearching && (
                  <Loader2 className="w-4 h-4 animate-spin text-[#D68C7A] absolute right-3 top-3" />
                )}
              </div>

              {/* Search dropdown results */}
              {searchResults.length > 0 && (
                <div className="mt-1 bg-white border border-[#EBE6DF] rounded-2xl shadow-lg p-1.5 space-y-1 max-h-48 overflow-y-auto no-scrollbar">
                  {searchResults.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSearchResult(item)}
                      className="w-full text-left p-2 hover:bg-[#FAF6F0] rounded-xl transition-colors flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold truncate text-[#4A443E]">
                        {item.name} {item.brand ? `(${item.brand})` : ''}
                      </span>
                      <span className="text-[11px] text-[#9A8F85] shrink-0 ml-2 font-bold">
                        {item.kcalPer100g} kcal/100g
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#9A8F85] uppercase tracking-wider mb-1">
                Nazwa dania / produktu *
              </label>
              <input
                type="text"
                required
                value={externalName}
                onChange={e => setExternalName(e.target.value)}
                placeholder="np. Kanapka z hummusem"
                className="w-full px-3.5 py-2 bg-[#FAF6F0] border border-[#EBE6DF] rounded-2xl text-xs text-[#4A443E] focus:outline-none focus:ring-1 focus:ring-[#D68C7A]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-[#9A8F85] uppercase tracking-wider mb-1">
                  Ilość / Porcja
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={externalPortion}
                  onChange={e => setExternalPortion(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#EBE6DF] rounded-2xl text-xs text-[#4A443E] focus:outline-none focus:ring-1 focus:ring-[#D68C7A]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#9A8F85] uppercase tracking-wider mb-1">
                  Jednostka
                </label>
                <CustomSelect
                  value={externalUnit}
                  onChange={val => setExternalUnit(val as UnitType)}
                  options={[
                    { value: 'g', label: 'Gramy (g)' },
                    { value: 'ml', label: 'Mililitry (ml)' },
                    { value: 'szt', label: 'Sztuki (szt)' },
                    { value: 'opak', label: 'Opakowanie (opak)' },
                  ]}
                  className="w-full"
                  buttonClassName="py-2 bg-[#FAF6F0]"
                />
              </div>
            </div>

            {/* Nutrition per 100g */}
            <div className="p-3.5 bg-[#FAF6F0] rounded-2xl border border-[#EBE6DF]">
              <span className="text-xs font-bold text-[#4A443E] block mb-2">
                Wartości odżywcze na 100g (lub 1 szt):
              </span>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <span className="text-[10px] text-[#9A8F85] font-semibold">Kcal</span>
                  <input
                    type="number"
                    value={kcalPer100g}
                    onChange={e => setKcalPer100g(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 text-xs bg-white border border-[#EBE6DF] rounded-xl text-[#4A443E]"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-[#9A8F85] font-semibold">Białko</span>
                  <input
                    type="number"
                    step="0.1"
                    value={proteinPer100g}
                    onChange={e => setProteinPer100g(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 text-xs bg-white border border-[#EBE6DF] rounded-xl text-[#4A443E]"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-[#9A8F85] font-semibold">Tłuszcz</span>
                  <input
                    type="number"
                    step="0.1"
                    value={fatPer100g}
                    onChange={e => setFatPer100g(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 text-xs bg-white border border-[#EBE6DF] rounded-xl text-[#4A443E]"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-[#9A8F85] font-semibold">Węgle</span>
                  <input
                    type="number"
                    step="0.1"
                    value={carbsPer100g}
                    onChange={e => setCarbsPer100g(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 text-xs bg-white border border-[#EBE6DF] rounded-xl text-[#4A443E]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live Calculation Pill */}
        <div className="p-3.5 bg-[#FAF6F0] rounded-2xl border border-[#EBE6DF] flex items-center justify-between">
          <div className="text-xs">
            <span className="text-[#9A8F85] block text-[10px]">Wartość tej porcji:</span>
            <span className="font-black text-[#D68C7A] text-sm">{calcKcal} kcal</span>
          </div>
          <div className="text-[11px] text-[#4A443E] text-right font-medium">
            B: <strong>{calcP}g</strong> · T: <strong>{calcF}g</strong> · W: <strong>{calcC}g</strong>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3.5 bg-[#D68C7A] hover:bg-[#C27866] text-white font-bold rounded-2xl transition-all shadow-sm text-sm"
          id="btn-confirm-add-meal"
        >
          Dodaj do dziennika
        </button>
      </form>
    </BottomSheet>
  );
}
