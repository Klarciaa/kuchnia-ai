import { useState, useMemo } from 'react';
import { Recipe, PantryItem, MealSlot } from '../../types';
import { RecipeCard } from './RecipeCard';
import { AddRecipeModal } from './AddRecipeModal';
import { CookRecipeModal } from './CookRecipeModal';
import { checkRecipeAvailability } from '../../utils/kitchenLogic';
import { Plus, Search, CheckSquare, Square, ChefHat, Sparkles } from 'lucide-react';

interface RecipesTabProps {
  recipes: Recipe[];
  pantry: PantryItem[];
  onAddRecipe: (recipe: Omit<Recipe, 'id'>) => void;
  onUpdateRecipe: (id: string, recipe: Partial<Recipe>) => void;
  onDeleteRecipe: (id: string) => void;
  onCookRecipe: (recipe: Recipe, date: string, mealSlot: MealSlot) => void;
  onAddMissingToShopping: (recipe: Recipe) => void;
  onOpenAiChef: () => void;
}

export function RecipesTab({
  recipes,
  pantry,
  onAddRecipe,
  onUpdateRecipe,
  onDeleteRecipe,
  onCookRecipe,
  onAddMissingToShopping,
  onOpenAiChef,
}: RecipesTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyAvailableInPantry, setOnlyAvailableInPantry] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [cookModalState, setCookModalState] = useState<{ recipe: Recipe; portions: number } | null>(null);

  // Dynamic categories with emojis
  const categories = useMemo(() => {
    const list: { id: string; label: string }[] = [{ id: 'all', label: 'Wszystkie' }];
    const standardMap: Record<string, string> = {
      'Śniadanie': '🥣 Śniadania',
      'Obiad': '🍲 Obiady',
      'Kolacja': '🥗 Kolacje',
      'Zupa': '🍵 Zupy',
      'Przekąska': '🥪 Przekąski',
      'Deser': '🍰 Desery',
    };

    const orderedStandard = ['Śniadanie', 'Obiad', 'Kolacja', 'Zupa', 'Przekąska', 'Deser'];
    const customCats = new Set<string>();

    recipes.forEach(r => {
      if (r.category && !standardMap[r.category]) {
        customCats.add(r.category);
      }
    });

    orderedStandard.forEach(c => {
      list.push({ id: c, label: standardMap[c] });
    });

    customCats.forEach(c => {
      list.push({ id: c, label: `🏷️ ${c}` });
    });

    return list;
  }, [recipes]);

  // Filter recipes
  const filteredRecipes = useMemo(() => {
    return recipes.filter(recipe => {
      if (selectedCategory !== 'all' && recipe.category !== selectedCategory) return false;

      if (
        searchQuery.trim() &&
        !recipe.title.toLowerCase().includes(searchQuery.toLowerCase().trim()) &&
        !recipe.description?.toLowerCase().includes(searchQuery.toLowerCase().trim())
      ) {
        return false;
      }

      if (onlyAvailableInPantry) {
        const avail = checkRecipeAvailability(recipe, pantry);
        if (!avail.hasAll) return false;
      }

      return true;
    });
  }, [recipes, pantry, selectedCategory, searchQuery, onlyAvailableInPantry]);

  const handleOpenNewRecipe = () => {
    setEditingRecipe(null);
    setIsAddModalOpen(true);
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setIsAddModalOpen(true);
  };

  const handleSaveRecipe = (recipeData: Omit<Recipe, 'id'>, autoAddToShopping?: boolean) => {
    if (editingRecipe) {
      onUpdateRecipe(editingRecipe.id, recipeData);
      if (autoAddToShopping) {
        onAddMissingToShopping({ ...recipeData, id: editingRecipe.id });
      }
    } else {
      onAddRecipe(recipeData);
      if (autoAddToShopping) {
        onAddMissingToShopping({ ...recipeData, id: 'temp-' + Date.now() });
      }
    }
    setEditingRecipe(null);
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-4 pb-24" id="recipes-tab-content">
      {/* Top Header info and action bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-100/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-stone-900 leading-tight">
              Przepisy kulinarne
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/60">
              {recipes.length} przepisów
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Przeglądaj pomysły na posiłki i sprawdzaj dostępność składników
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenAiChef}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition-colors border border-rose-200/70 shadow-xs"
            title="Inteligentny Asystent Szefowej Kuchni"
            id="btn-ai-chef-recipes"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span>AI Szefowa</span>
          </button>

          <button
            type="button"
            onClick={handleOpenNewRecipe}
            className="px-3.5 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs shadow-rose-200 shrink-0"
            id="btn-add-recipe-main"
          >
            <Plus className="w-4 h-4" />
            <span>Dodaj przepis</span>
          </button>
        </div>
      </div>

      {/* Search Bar & Pantry Availability Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Szukaj po nazwie potrawy lub opisie..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 placeholder:text-stone-400 transition-all"
            id="input-search-recipes"
          />
        </div>

        {/* Pantry Filter Toggle button */}
        <button
          type="button"
          onClick={() => setOnlyAvailableInPantry(!onlyAvailableInPantry)}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all shrink-0 ${
            onlyAvailableInPantry
              ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-2xs'
              : 'bg-white text-stone-600 border-stone-200 hover:bg-rose-50/50'
          }`}
          id="btn-toggle-pantry-filter"
        >
          {onlyAvailableInPantry ? (
            <CheckSquare className="w-4 h-4 text-rose-500" />
          ) : (
            <Square className="w-4 h-4 text-stone-400" />
          )}
          <span>Tylko gotowe ze spiżarni</span>
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto custom-scroll py-0.5">
        {categories.map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat.id
                ? 'bg-rose-500 text-white shadow-2xs'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-rose-50/50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Recipe List */}
      {filteredRecipes.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-[24px] border border-[#EBE6DF] text-[#9A8F85]">
          <ChefHat className="w-10 h-10 mx-auto text-[#E3D5CA] mb-2" />
          <p className="font-bold text-base text-[#4A443E]">Nie znaleziono przepisów</p>
          <p className="text-xs text-[#9A8F85] mt-1">
            {onlyAvailableInPantry
              ? 'Nie masz obecnie kompletu składników na żaden przepis z wybranej kategorii. Możesz stworzyć nowy przepis na przyszłość lub dodać braki do listy zakupów!'
              : 'Dopasuj wyszukiwanie lub dodaj własny przepis.'}
          </p>
          {onlyAvailableInPantry && (
            <button
              type="button"
              onClick={() => setOnlyAvailableInPantry(false)}
              className="mt-3 px-3.5 py-1.5 bg-[#FDF2F0] text-[#D68C7A] text-xs font-semibold rounded-xl"
            >
              Pokaż wszystkie przepisy
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredRecipes.map((recipe, index) => (
            <RecipeCard
              key={`${recipe.id}-${index}`}
              recipe={recipe}
              pantry={pantry}
              onCook={(r, portions) => setCookModalState({ recipe: r, portions })}
              onAddMissing={onAddMissingToShopping}
              onDelete={onDeleteRecipe}
              onEdit={handleEditRecipe}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Recipe Modal */}
      <AddRecipeModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingRecipe(null);
        }}
        onSave={handleSaveRecipe}
        pantry={pantry}
        initialRecipe={editingRecipe}
      />

      {/* Cook Recipe Modal */}
      <CookRecipeModal
        recipe={cookModalState?.recipe || null}
        initialPortions={cookModalState?.portions || 1}
        isOpen={!!cookModalState}
        onClose={() => setCookModalState(null)}
        onConfirmCook={onCookRecipe}
      />
    </div>
  );
}
