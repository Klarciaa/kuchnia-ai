import { useState } from 'react';
import { useKitchenState } from './hooks/useKitchenState';
import { TabType, Recipe, MealSlot, PantryItem, PlannedMealItem } from './types';
import { TopHeader } from './components/common/TopHeader';
import { BottomNav } from './components/common/BottomNav';
import { PantryTab } from './components/pantry/PantryTab';
import { BarcodeScannerModal, ScannerTargetMode } from './components/pantry/BarcodeScannerModal';
import { RecipesTab } from './components/recipes/RecipesTab';
import { AiZeroWasteModal } from './components/recipes/AiZeroWasteModal';
import { PlannerTab } from './components/planner/PlannerTab';
import { ShoppingTab } from './components/shopping/ShoppingTab';
import { CheckCircle2, AlertCircle, Info, RotateCcw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('pantry');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerTargetMode, setScannerTargetMode] = useState<ScannerTargetMode>('any');
  const [isAiChefOpen, setIsAiChefOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'info' | 'warning';
  } | null>(null);

  const {
    state,
    addProduct,
    updateProduct,
    deleteProduct,
    markAsOpened,
    adjustPantryAmount,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    cookRecipe,
    addMissingRecipeIngredientsToShopping,
    addPlannedMeal,
    deletePlannedMeal,
    updateGoals,
    toggleShoppingItem,
    addShoppingItem,
    deleteShoppingItem,
    transferCheckedShoppingToPantry,
    clearCheckedShopping,
    scanAndHandleShoppingItem,
    addCustomCategory,
    resetToDefaultData,
  } = useKitchenState();

  const showToast = (text: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const openScanner = (mode: ScannerTargetMode = 'any') => {
    setScannerTargetMode(mode);
    setIsScannerOpen(true);
  };

  // Handler for cooking recipe with feedback
  const handleCookRecipe = (recipe: Recipe, date: string, mealSlot: MealSlot) => {
    cookRecipe(recipe, date, mealSlot);
    showToast(`Ugotowano "${recipe.title}"! Składniki odjęto ze spiżarni.`, 'success');
  };

  // Handler for adding missing ingredients to shopping list
  const handleAddMissingToShopping = (recipe: Recipe) => {
    addMissingRecipeIngredientsToShopping(recipe);
    showToast(`Brakujące składniki trafiły na listę zakupów!`, 'info');
  };

  // Handler for scanned product
  const handleScannedProduct = (productData: Omit<PantryItem, 'id'>) => {
    addProduct(productData);
    showToast(`Dodano "${productData.name}" do spiżarni!`, 'success');
  };

  // Handler for shopping scan (check off list & add to pantry)
  const handleScanShoppingItem = (product: any) => {
    const result = scanAndHandleShoppingItem(product);
    if (result.matched) {
      showToast(`Odhaczono "${result.matchedName}" z listy zakupów i dodano do spiżarni!`, 'success');
    } else {
      showToast(`Dodano "${product.name}" do spiżarni i oznaczono na liście zakupów!`, 'success');
    }
    return result;
  };

  // Handler for quick snack scan (Planner / calories on the go)
  const handleScanPlannerMeal = (mealData: Omit<PlannedMealItem, 'id'>) => {
    addPlannedMeal(mealData);
    showToast(`Zapisano "${mealData.name}" (${mealData.kcal} kcal) w dzisiejszym dzienniku!`, 'success');
  };

  // Handler for transferring checked shopping items
  const handleTransferShopping = () => {
    transferCheckedShoppingToPantry();
    showToast(`Kupione produkty przeniesiono do Twojej spiżarni!`, 'success');
  };

  const shoppingBadgeCount = state.shoppingList.filter(i => !i.checked).length;

  return (
    <div className="min-h-screen bg-[#F8F8F6] text-stone-900 selection:bg-emerald-100 selection:text-emerald-900 font-sans flex flex-col">
      {/* Global Top Header */}
      <TopHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        shoppingBadgeCount={shoppingBadgeCount}
        onOpenBarcodeScanner={() =>
          openScanner(activeTab === 'shopping' ? 'shopping' : activeTab === 'planner' ? 'planner' : 'pantry')
        }
        onOpenAiChef={() => setIsAiChefOpen(true)}
        onResetDemo={() => {
          if (window.confirm('Czy na pewno chcesz przywrócić początkowy stan demonstracyjny?')) {
            resetToDefaultData();
            showToast('Przywrócono dane demonstracyjne.', 'info');
          }
        }}
      />

      {/* Main Responsive App Content Container */}
      <main
        className="w-full max-w-5xl mx-auto flex-1 px-4 sm:px-6 lg:px-8 py-5 pb-24 md:pb-12"
        id="app-content-container"
      >
        {/* Toast Notification Container */}
        {toastMessage && (
          <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md animate-in slide-in-from-top-3 fade-in duration-300 pointer-events-none">
            <div
              className={`p-3.5 rounded-2xl shadow-lg border backdrop-blur-md flex items-center gap-2.5 text-xs font-semibold ${
                toastMessage.type === 'success'
                  ? 'bg-emerald-800 text-white border-emerald-900/40'
                  : toastMessage.type === 'warning'
                  ? 'bg-amber-500 text-stone-900 border-amber-600/40'
                  : 'bg-stone-800 text-stone-100 border-stone-700'
              }`}
            >
              {toastMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-200" />
              ) : toastMessage.type === 'warning' ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-stone-900" />
              ) : (
                <Info className="w-4 h-4 shrink-0 text-stone-300" />
              )}
              <span className="leading-snug">{toastMessage.text}</span>
            </div>
          </div>
        )}

        {/* Tab Body View */}
        <section className="w-full" id="main-tab-viewport">
          {activeTab === 'pantry' && (
            <PantryTab
              pantry={state.pantry}
              customCategories={state.customCategories}
              onAddProduct={item => {
                addProduct(item);
                showToast(`Dodano "${item.name}" do spiżarni!`);
              }}
              onUpdateProduct={(id, updates) => {
                updateProduct(id, updates);
                showToast('Zaktualizowano produkt!');
              }}
              onDeleteProduct={id => {
                deleteProduct(id);
                showToast('Usunięto produkt ze spiżarni.', 'info');
              }}
              onMarkAsOpened={id => {
                markAsOpened(id);
                showToast('Oznaczono produkt jako otwarty!');
              }}
              onAdjustAmount={(id, delta) => {
                adjustPantryAmount(id, delta);
              }}
              onAddCustomCategory={addCustomCategory}
              onOpenAiChef={() => setIsAiChefOpen(true)}
            />
          )}

          {activeTab === 'recipes' && (
            <RecipesTab
              recipes={state.recipes}
              pantry={state.pantry}
              onAddRecipe={rec => {
                addRecipe(rec);
                showToast(`Dodano przepis "${rec.title}"!`);
              }}
              onUpdateRecipe={(id, updates) => {
                updateRecipe(id, updates);
                showToast('Zaktualizowano przepis!', 'info');
              }}
              onDeleteRecipe={id => {
                deleteRecipe(id);
                showToast('Usunięto przepis.', 'info');
              }}
              onCookRecipe={handleCookRecipe}
              onAddMissingToShopping={handleAddMissingToShopping}
              onOpenAiChef={() => setIsAiChefOpen(true)}
            />
          )}

          {activeTab === 'planner' && (
            <PlannerTab
              plannedMeals={state.planner}
              goals={state.goals}
              pantry={state.pantry}
              onAddMeal={meal => {
                addPlannedMeal(meal);
                showToast(`Dodano "${meal.name}" do planera!`);
              }}
              onDeleteMeal={(id, restore) => {
                deletePlannedMeal(id, restore);
                showToast(
                  restore
                    ? 'Usunięto posiłek i zwrócono produkt do spiżarni.'
                    : 'Usunięto posiłek z dziennika.',
                  'info'
                );
              }}
              onSaveGoals={g => {
                updateGoals(g);
                showToast('Zaktualizowano cele dietetyczne!');
              }}
              onOpenBarcodeScanner={() => openScanner('planner')}
            />
          )}

          {activeTab === 'shopping' && (
            <ShoppingTab
              shoppingList={state.shoppingList}
              onToggleItem={toggleShoppingItem}
              onAddItem={item => {
                addShoppingItem(item);
                showToast(`Dodano "${item.name}" do listy zakupów.`);
              }}
              onDeleteItem={id => {
                deleteShoppingItem(id);
              }}
              onTransferCheckedToPantry={handleTransferShopping}
              onClearChecked={() => {
                clearCheckedShopping();
                showToast('Usunięto zaznaczone zakupy.', 'info');
              }}
              onOpenBarcodeScanner={() => openScanner('shopping')}
            />
          )}
        </section>

        {/* Global Barcode Scanner Modal with multi-destination support */}
        <BarcodeScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          targetMode={scannerTargetMode}
          shoppingList={state.shoppingList}
          onProductFound={handleScannedProduct}
          onScanShoppingItem={handleScanShoppingItem}
          onScanPlannerMeal={handleScanPlannerMeal}
        />

        {/* Global AI Zero Waste Chef Modal */}
        <AiZeroWasteModal
          isOpen={isAiChefOpen}
          onClose={() => setIsAiChefOpen(false)}
          pantry={state.pantry}
          onSaveRecipe={rec => {
            addRecipe(rec);
            showToast(`Zapisano "${rec.title}" w Twoich przepisach!`);
          }}
          onCookRecipeDirect={rec => {
            handleCookRecipe(rec, new Date().toISOString().split('T')[0], 'lunch');
          }}
        />

        {/* Fixed Bottom Navigation Bar */}
        <BottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          shoppingBadgeCount={shoppingBadgeCount}
        />
      </main>
    </div>
  );
}
