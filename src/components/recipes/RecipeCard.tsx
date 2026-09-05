import { useState, useMemo } from 'react';
import { Recipe, PantryItem } from '../../types';
import { checkRecipeAvailability, getScaledRecipe } from '../../utils/kitchenLogic';
import {
  Clock,
  Flame,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Utensils,
  ChevronDown,
  ChevronUp,
  Trash2,
  Pencil,
  Minus,
  Plus,
} from 'lucide-react';

interface RecipeCardProps {
  key?: string;
  recipe: Recipe;
  pantry: PantryItem[];
  onCook: (recipe: Recipe, portions: number) => void;
  onAddMissing: (recipe: Recipe) => void;
  onDelete: (id: string) => void;
  onEdit: (recipe: Recipe) => void;
}

export function RecipeCard({
  recipe,
  pantry,
  onCook,
  onAddMissing,
  onDelete,
  onEdit,
}: RecipeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [portions, setPortions] = useState<number>(1);

  // Scaled recipe values based on selected portions
  const scaledRecipe = useMemo(() => {
    return getScaledRecipe(recipe, portions);
  }, [recipe, portions]);

  // Real-time pantry availability dynamically based on scaled ingredient amounts
  const availability = useMemo(() => {
    return checkRecipeAvailability(scaledRecipe, pantry);
  }, [scaledRecipe, pantry]);

  const handleStepPortions = (delta: number) => {
    setPortions(prev => {
      const next = Math.round((prev + delta) * 10) / 10;
      if (next < 0.5) return 0.5;
      if (next > 10) return 10;
      return next;
    });
  };

  const handleDelete = () => {
    if (window.confirm(`Czy na pewno chcesz usunąć przepis "${recipe.title}"?`)) {
      onDelete(recipe.id);
    }
  };

  const portionsLabel =
    portions === 0.5
      ? '½ porcji'
      : portions === 1
      ? '1 porcja'
      : `${portions} porcje`;

  return (
    <div
      className="bg-white rounded-2xl border border-rose-100/80 shadow-[0_2px_8px_rgba(240,210,215,0.12)] hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
      id={`recipe-card-${recipe.id}`}
    >
      <div className="p-4 sm:p-5 space-y-3.5">
        {/* Top bar: Category, time, actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
            <span className="font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/60">
              {recipe.category}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-stone-400" /> {recipe.prepTime}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0 -mr-1">
            <button
              type="button"
              onClick={() => onEdit(recipe)}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
              title="Edytuj przepis"
              id={`btn-edit-recipe-${recipe.id}`}
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Usuń przepis"
              id={`btn-delete-recipe-${recipe.id}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Title & Description */}
        <div>
          <h4 className="font-bold text-stone-900 text-base sm:text-lg leading-snug">
            {recipe.title}
          </h4>
          {recipe.description && (
            <p className="text-xs text-stone-500 leading-relaxed mt-1 line-clamp-2">
              {recipe.description}
            </p>
          )}
        </div>

        {/* Nutrition and Portion Stepper Row */}
        <div className="bg-stone-50/80 rounded-xl p-3 border border-stone-100 flex items-center justify-between gap-2">
          {/* Calories & Macros */}
          <div>
            <div className="flex items-center gap-1 font-bold text-stone-900 text-sm">
              <Flame className="w-3.5 h-3.5 text-rose-500" />
              <span>{scaledRecipe.kcal} kcal</span>
            </div>
            <div className="text-[11px] text-stone-500 font-medium mt-0.5 space-x-1.5">
              <span>B: <strong className="text-stone-700">{scaledRecipe.protein}g</strong></span>
              <span>·</span>
              <span>T: <strong className="text-stone-700">{scaledRecipe.fat}g</strong></span>
              <span>·</span>
              <span>W: <strong className="text-stone-700">{scaledRecipe.carbs}g</strong></span>
            </div>
          </div>

          {/* Clean Portion Stepper */}
          <div className="flex items-center bg-white border border-rose-100 rounded-xl p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => handleStepPortions(-0.5)}
              disabled={portions <= 0.5}
              className="w-6 h-6 rounded-lg text-stone-600 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30 flex items-center justify-center transition-colors"
              title="Zmniejsz porcję"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-xs font-semibold text-stone-800 px-2 text-center min-w-[56px]">
              {portionsLabel}
            </span>
            <button
              type="button"
              onClick={() => handleStepPortions(0.5)}
              disabled={portions >= 10}
              className="w-6 h-6 rounded-lg text-stone-600 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center transition-colors"
              title="Zwiększ porcję"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Dynamic Pantry Availability & Expand trigger */}
        <div className="flex items-center justify-between text-xs pt-1">
          {availability.hasAll ? (
            <span className="inline-flex items-center gap-1.5 font-medium text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/60">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Wszystko w spiżarni
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 font-medium text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200/60">
              <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
              Brakuje {availability.missingCount} {availability.missingCount === 1 ? 'składnika' : 'składników'}
            </span>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-stone-100"
          >
            <span>{isExpanded ? 'Zwiń' : 'Składniki'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="pt-3 border-t border-stone-100 space-y-3 animate-in fade-in duration-150">
            <div>
              <div className="text-xs font-semibold text-stone-700 mb-2">
                Składniki dla: {portionsLabel}
              </div>
              <div className="space-y-1.5">
                {availability.details.map((ing, idx) => {
                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-2 rounded-xl text-xs ${
                        ing.isMissing
                          ? 'bg-amber-50/70 text-amber-900 border border-amber-200/60'
                          : 'bg-stone-50 text-stone-700 border border-stone-150'
                      }`}
                    >
                      <span className="font-medium">{ing.name}</span>
                      <span className="text-[11px] text-stone-500">
                        Potrzeba: <strong className="text-stone-900 font-semibold">{ing.needed} {ing.unit}</strong>{' '}
                        {ing.available > 0 ? `(w spiżarni: ${ing.available} ${ing.unit})` : '(brak)'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Preparation instructions */}
            {recipe.instructions && recipe.instructions.length > 0 && (
              <div className="pt-1">
                <div className="text-xs font-semibold text-stone-700 mb-1.5">
                  Sposób przygotowania:
                </div>
                <ol className="list-decimal list-inside space-y-1 text-xs text-stone-600 leading-relaxed">
                  {recipe.instructions.map((step, sidx) => (
                    <li key={sidx} className="pl-1">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons at bottom of card */}
      <div className="p-4 sm:p-5 pt-0">
        <div className="pt-3 border-t border-stone-100 flex items-center gap-2">
          {!availability.hasAll && (
            <button
              type="button"
              onClick={() => onAddMissing(scaledRecipe)}
              className="flex-1 py-2 px-3 bg-rose-50/70 hover:bg-rose-100/70 text-rose-700 border border-rose-200/60 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
              title="Dodaj brakujące składniki do listy zakupów"
              id={`btn-add-missing-${recipe.id}`}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-rose-500" />
              <span>Dodaj braki</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onCook(recipe, portions)}
            className="flex-1 py-2 px-3 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs shadow-rose-200 flex items-center justify-center gap-1.5"
            id={`btn-cook-${recipe.id}`}
          >
            <Utensils className="w-3.5 h-3.5 text-rose-100" />
            <span>Ugotuj posiłek</span>
          </button>
        </div>
      </div>
    </div>
  );
}

