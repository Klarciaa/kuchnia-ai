import { useState } from 'react';
import { PantryItem, Recipe, MealSlot } from '../../types';
import { BottomSheet } from '../common/BottomSheet';
import { getEffectiveExpiry } from '../../utils/kitchenLogic';
import { Sparkles, Loader2, Utensils, BookPlus, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface AiZeroWasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  pantry: PantryItem[];
  onSaveRecipe: (recipe: Omit<Recipe, 'id'>) => void;
  onCookRecipeDirect: (recipe: Recipe) => void;
}

export function AiZeroWasteModal({
  isOpen,
  onClose,
  pantry,
  onSaveRecipe,
  onCookRecipeDirect,
}: AiZeroWasteModalProps) {
  const [mealType, setMealType] = useState('Obiad');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState<Recipe | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Identify expiring and low stock items
  const expiringItems = pantry.filter(item => {
    const exp = getEffectiveExpiry(item);
    return exp.status === 'warning' || exp.status === 'expired' || item.currentAmount <= item.totalAmount * 0.25;
  });

  const handleGenerate = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const payload = {
        mealType,
        expiringItems: expiringItems.map(i => ({
          name: i.name,
          amount: i.currentAmount,
          unit: i.unit,
        })),
        availableItems: pantry.map(i => ({
          name: i.name,
          amount: i.currentAmount,
          unit: i.unit,
        })),
      };

      const res = await fetch('/api/gemini/zero-waste-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Błąd serwera');
      const data = await res.json();

      setGeneratedRecipe({
        id: 'ai-recipe-' + Date.now(),
        title: data.title || 'Danie Zero Waste',
        category: data.category || 'Obiad',
        prepTime: data.prepTime || '20 min',
        kcal: data.kcal || 450,
        protein: data.protein || 24,
        fat: data.fat || 15,
        carbs: data.carbs || 48,
        description: data.description || 'Danie ratujące produkty przed zmarnowaniem.',
        ingredients: data.ingredients || [],
        instructions: data.instructions || [],
      });
    } catch (err: any) {
      setErrorMsg('Nie udało się wygenerować przepisu przez AI. Spróbuj ponownie.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!generatedRecipe) return;
    onSaveRecipe(generatedRecipe);
    onClose();
  };

  const handleCook = () => {
    if (!generatedRecipe) return;
    onCookRecipeDirect(generatedRecipe);
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="AI Szef Zero Waste"
      subtitle="Co masz w lodówce i co warto dziś zjeść?"
      id="modal-ai-zero-waste"
    >
      <div className="space-y-4">
        {/* Expiring items awareness */}
        <div className="p-3.5 bg-[#FAF6F0] rounded-2xl border border-[#EBE6DF]">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#D68C7A] mb-1.5">
            <AlertTriangle className="w-4 h-4" />
            Produkty wymagające pilnego zużycia ({expiringItems.length}):
          </div>
          {expiringItems.length === 0 ? (
            <p className="text-xs text-[#7B8A75] font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Wszystkie produkty w spiżarni są świeże!
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {expiringItems.map(item => (
                <span
                  key={item.id}
                  className="text-[11px] font-semibold bg-white text-[#4A443E] px-2.5 py-1 rounded-xl border border-[#EBE6DF]"
                >
                  {item.name} ({item.currentAmount} {item.unit})
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Meal Type selection */}
        <div>
          <label className="block text-[11px] font-semibold text-[#9A8F85] uppercase tracking-wider mb-1.5">
            Na co masz ochotę?
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {['Śniadanie', 'Obiad', 'Kolacja', 'Przekąska'].map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setMealType(type)}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  mealType === type
                    ? 'bg-[#D68C7A] text-white shadow-xs'
                    : 'bg-[#FAF6F0] text-[#9A8F85] hover:text-[#4A443E]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full py-3.5 bg-[#D68C7A] hover:bg-[#C27866] text-white font-bold text-xs rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          id="btn-generate-ai-recipe"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Szef kuchni komponuje danie...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" /> Zaproponuj danie Zero Waste
            </>
          )}
        </button>

        {errorMsg && (
          <div className="p-3 bg-[#FDF0ED] text-[#C25442] text-xs rounded-2xl border border-[#F5D2CB]">
            {errorMsg}
          </div>
        )}

        {/* Generated recipe card */}
        {generatedRecipe && (
          <div className="p-4 bg-[#FAF6F0] rounded-2xl border border-[#EBE6DF] shadow-sm animate-in zoom-in-95 duration-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#D68C7A] bg-[#F8EDE9] px-2.5 py-0.5 rounded-md">
                Propozycja AI ({generatedRecipe.category})
              </span>
              <span className="text-xs text-[#9A8F85] font-medium">
                {generatedRecipe.prepTime}
              </span>
            </div>

            <h4 className="font-bold text-[#4A443E] text-base leading-snug">
              {generatedRecipe.title}
            </h4>
            <p className="text-xs text-[#4A443E]/80 leading-relaxed">
              {generatedRecipe.description}
            </p>

            {/* Macros */}
            <div className="grid grid-cols-4 gap-1 text-center bg-white p-2.5 rounded-xl border border-[#EBE6DF] text-[11px]">
              <div>
                <span className="text-[#9A8F85] block text-[9px]">Kcal</span>
                <span className="font-bold text-[#D68C7A]">{generatedRecipe.kcal}</span>
              </div>
              <div>
                <span className="text-[#9A8F85] block text-[9px]">Białko</span>
                <span className="font-bold text-[#4A443E]">{generatedRecipe.protein}g</span>
              </div>
              <div>
                <span className="text-[#9A8F85] block text-[9px]">Tłuszcz</span>
                <span className="font-bold text-[#4A443E]">{generatedRecipe.fat}g</span>
              </div>
              <div>
                <span className="text-[#9A8F85] block text-[9px]">Węgle</span>
                <span className="font-bold text-[#4A443E]">{generatedRecipe.carbs}g</span>
              </div>
            </div>

            {/* Ingredients */}
            <div>
              <div className="text-[11px] font-bold text-[#4A443E] uppercase mb-1">
                Wymagane składniki:
              </div>
              <ul className="text-xs text-[#4A443E] space-y-1">
                {generatedRecipe.ingredients.map((ing, idx) => (
                  <li key={idx} className="flex items-center justify-between py-0.5 border-b border-[#EBE6DF]/40 last:border-b-0">
                    <span>· {ing.name}</span>
                    <strong className="text-[#4A443E]">
                      {ing.amount} {ing.unit}
                    </strong>
                  </li>
                ))}
              </ul>
            </div>

            {/* Instructions */}
            {generatedRecipe.instructions.length > 0 && (
              <div>
                <div className="text-[11px] font-bold text-[#4A443E] uppercase mb-1">
                  Kroki:
                </div>
                <ol className="list-decimal list-inside text-xs text-[#4A443E] space-y-1">
                  {generatedRecipe.instructions.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>
            )}

            {/* Action buttons */}
            <div className="pt-2 flex items-center gap-2 border-t border-[#EBE6DF]">
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 py-2.5 px-3 bg-white hover:bg-[#FAF6F0] text-[#D68C7A] border border-[#EBE6DF] text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1"
                id="btn-save-ai-recipe"
              >
                <BookPlus className="w-3.5 h-3.5" />
                Zapisz do przepisów
              </button>
              <button
                type="button"
                onClick={handleCook}
                className="flex-1 py-2.5 px-3 bg-[#7B8A75] hover:bg-[#697763] text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1"
                id="btn-cook-ai-recipe"
              >
                <Utensils className="w-3.5 h-3.5" />
                Ugotuj teraz
              </button>
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
