import { useState, useEffect, useMemo } from 'react';
import { Recipe, MealSlot } from '../../types';
import { BottomSheet } from '../common/BottomSheet';
import { CustomDatePicker } from '../common/CustomDatePicker';
import { CustomSelect } from '../common/CustomSelect';
import { formatDate, addDays } from '../../constants/mockData';
import { getScaledRecipe } from '../../utils/kitchenLogic';
import { Utensils, CheckCircle2, Flame, Minus, Plus } from 'lucide-react';

interface CookRecipeModalProps {
  recipe: Recipe | null;
  initialPortions?: number;
  isOpen: boolean;
  onClose: () => void;
  onConfirmCook: (recipe: Recipe, date: string, mealSlot: MealSlot) => void;
}

export function CookRecipeModal({
  recipe,
  initialPortions = 1,
  isOpen,
  onClose,
  onConfirmCook,
}: CookRecipeModalProps) {
  const [date, setDate] = useState(formatDate(new Date()));
  const [mealSlot, setMealSlot] = useState<MealSlot>('dinner');
  const [portions, setPortions] = useState<number>(initialPortions);

  useEffect(() => {
    if (isOpen) {
      setPortions(initialPortions || recipe?.servings || 1);
    }
  }, [isOpen, initialPortions, recipe]);

  const scaledRecipe = useMemo(() => {
    if (!recipe) return null;
    return getScaledRecipe(recipe, portions);
  }, [recipe, portions]);

  if (!recipe || !scaledRecipe) return null;

  const slotOptions = [
    { value: 'breakfast', label: '🥣 Śniadanie' },
    { value: 'second_breakfast', label: '🥪 II Śniadanie' },
    { value: 'lunch', label: '🍲 Obiad' },
    { value: 'dinner', label: '🥗 Kolacja' },
  ];

  const handleStepPortions = (delta: number) => {
    setPortions(prev => {
      const next = Math.round((prev + delta) * 10) / 10;
      if (next < 0.25) return 0.25;
      if (next > 20) return 20;
      return next;
    });
  };

  const handleCook = () => {
    onConfirmCook(scaledRecipe, date, mealSlot);
    onClose();
  };

  const portionsLabel =
    portions === 0.5
      ? '½ porcji (pół)'
      : portions === 1
      ? '1 porcja'
      : `${portions} porcje`;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Ugotuj to!"
      subtitle={recipe.title}
      id="modal-cook-recipe"
    >
      <div className="space-y-4">
        {/* Portion selector inside modal */}
        <div className="bg-[#FAF6F0] p-3 rounded-2xl border border-[#EBE6DF] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#7A6F66] flex items-center gap-1.5 uppercase tracking-wider">
              <Utensils className="w-3.5 h-3.5 text-[#7B8A75]" />
              Wielkość przygotowywanej porcji:
            </span>
            <span className="text-xs font-black text-[#4A443E] bg-white px-2 py-0.5 rounded-lg border border-[#EBE6DF]">
              {portionsLabel}
            </span>
          </div>

          <div className="flex items-center justify-between gap-1.5">
            {/* Stepper with - and + */}
            <div className="flex items-center bg-white rounded-xl border border-[#EBE6DF] p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => handleStepPortions(-0.5)}
                disabled={portions <= 0.25}
                className="w-7 h-7 rounded-lg text-[#4A443E] hover:bg-[#FAF6F0] active:scale-95 disabled:opacity-30 text-xs font-black flex items-center justify-center transition-all"
                title="Zmniejsz porcję o 0.5"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-bold text-[#4A443E] px-2 text-center min-w-[34px]">
                {portions === 0.5 ? '½' : portions}
              </span>
              <button
                type="button"
                onClick={() => handleStepPortions(0.5)}
                disabled={portions >= 20}
                className="w-7 h-7 rounded-lg text-[#4A443E] hover:bg-[#FAF6F0] active:scale-95 disabled:opacity-30 text-xs font-black flex items-center justify-center transition-all"
                title="Zwiększ porcję o 0.5"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick chips */}
            <div className="flex items-center gap-1 flex-wrap justify-end">
              {[
                { value: 0.5, label: '½' },
                { value: 1, label: '1' },
                { value: 1.5, label: '1.5' },
                { value: 2, label: '2' },
                { value: 3, label: '3' },
              ].map(preset => {
                const isActive = portions === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setPortions(preset.value)}
                    className={`px-2 py-1 text-xs font-bold rounded-xl transition-all active:scale-95 ${
                      isActive
                        ? 'bg-[#7B8A75] text-white shadow-2xs'
                        : 'bg-white text-[#7A6F66] border border-[#EBE6DF] hover:bg-[#FAF6F0] hover:text-[#4A443E]'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scaled macros summary */}
          <div className="flex items-center justify-between pt-1 border-t border-[#EBE6DF]/70 text-xs">
            <div className="flex items-center gap-1 font-bold text-[#D68C7A]">
              <Flame className="w-3.5 h-3.5" />
              <span>{scaledRecipe.kcal} kcal</span>
            </div>
            <div className="text-[11px] text-[#9A8F85] space-x-1.5 font-medium">
              <span>B: <strong className="text-[#3B82F6]">{scaledRecipe.protein}g</strong></span>
              <span>·</span>
              <span>T: <strong className="text-[#D97706]">{scaledRecipe.fat}g</strong></span>
              <span>·</span>
              <span>W: <strong className="text-[#8B5CF6]">{scaledRecipe.carbs}g</strong></span>
            </div>
          </div>
        </div>

        {/* Info card */}
        <div className="p-3.5 bg-[#FAF6F0] rounded-2xl border border-[#EBE6DF] text-xs text-[#4A443E] space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-[#D68C7A]">
            <Utensils className="w-4 h-4" /> Automatyczna synchronizacja:
          </div>
          <p className="leading-relaxed">
            1. Posiłek trafi do <strong>Planera diety</strong> z wyliczonymi kaloriami (<strong>{scaledRecipe.kcal} kcal</strong>) i makro na wybraną porcję ({portionsLabel}).
          </p>
          <p className="leading-relaxed">
            2. Składniki zostaną <strong>automatycznie ściągnięte z Twojej spiżarni</strong> (przeliczone proporcjonalnie).
          </p>
          <p className="leading-relaxed">
            3. Jeśli któregoś produktu zabraknie, system <strong>sam doda brakującą różnicę do listy zakupów</strong> z etykietą AUTO!
          </p>
        </div>

        {/* Date selection */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-[#9A8F85] uppercase tracking-wider">
              Dzień posiłku
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setDate(formatDate(new Date()))}
                className={`text-[11px] px-2.5 py-1 rounded-xl font-semibold transition-colors ${
                  date === formatDate(new Date())
                    ? 'bg-[#D68C7A] text-white shadow-xs'
                    : 'bg-[#FAF6F0] text-[#9A8F85] hover:text-[#4A443E]'
                }`}
              >
                Dziś
              </button>
              <button
                type="button"
                onClick={() => setDate(addDays(1))}
                className={`text-[11px] px-2.5 py-1 rounded-xl font-semibold transition-colors ${
                  date === addDays(1)
                    ? 'bg-[#D68C7A] text-white shadow-xs'
                    : 'bg-[#FAF6F0] text-[#9A8F85] hover:text-[#4A443E]'
                }`}
              >
                Jutro
              </button>
            </div>
          </div>
          <CustomDatePicker
            value={date}
            onChange={setDate}
            id="datepicker-cook"
          />
        </div>

        {/* Meal slot selector */}
        <div>
          <CustomSelect
            label="Pora posiłku w planerze"
            value={mealSlot}
            onChange={v => setMealSlot(v as MealSlot)}
            options={slotOptions}
            id="select-cook-slot"
          />
        </div>

        {/* Action button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleCook}
            className="w-full py-3.5 bg-[#7B8A75] hover:bg-[#697763] text-white font-bold rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 text-sm"
            id="btn-confirm-cook"
          >
            <CheckCircle2 className="w-4 h-4" />
            Zatwierdź i ugotuj posiłek ({scaledRecipe.kcal} kcal)
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}

