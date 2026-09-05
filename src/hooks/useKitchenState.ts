import { useState, useEffect, useCallback } from 'react';
import {
  KitchenState,
  PantryItem,
  Recipe,
  ShoppingItem,
  PlannedMealItem,
  UserGoals,
  MealSlot,
  UnitType,
  StorageZone,
} from '../types';
import {
  STORAGE_KEY,
  LOW_STOCK_RATIO,
  INITIAL_STATE,
  INITIAL_RECIPES,
  formatDate,
  addDays,
} from '../constants/mockData';
import {
  checkRecipeAvailability,
  calculateTDEEGoals,
  inferStorageZone,
} from '../utils/kitchenLogic';

function deduplicateRecipes(rawRecipes: Recipe[]): Recipe[] {
  const seenIds = new Set<string>();
  const seenTitles = new Set<string>();
  const result: Recipe[] = [];

  for (const r of rawRecipes) {
    if (!r || !r.title) continue;
    const normalizedTitle = r.title.toLowerCase().trim();
    // If it's a duplicate recipe by title, skip it
    if (seenTitles.has(normalizedTitle)) {
      continue;
    }
    let id = r.id;
    if (!id || seenIds.has(id)) {
      id = `${id || 'r'}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    }
    seenIds.add(id);
    seenTitles.add(normalizedTitle);
    result.push({ ...r, id });
  }
  return result;
}

function deduplicateById<T extends { id: string }>(items: T[]): T[] {
  const seenIds = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    if (!item || !item.id) continue;
    let id = item.id;
    if (seenIds.has(id)) {
      id = `${id}-${Math.random().toString(36).slice(2, 6)}`;
    }
    seenIds.add(id);
    result.push({ ...item, id });
  }
  return result;
}

export function useKitchenState() {
  const [state, setState] = useState<KitchenState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.pantry)) {
          const rawLoadedRecipes = Array.isArray(parsed.recipes) ? parsed.recipes : [];
          const cleanedLoadedRecipes = deduplicateRecipes(rawLoadedRecipes);

          const existingTitles = new Set(
            cleanedLoadedRecipes.map(r => r.title.toLowerCase().trim())
          );
          const existingIds = new Set(
            cleanedLoadedRecipes.map(r => r.id)
          );

          // Only merge catalog recipes if neither title NOR id exists
          const newInitialRecipes = INITIAL_RECIPES.filter(
            r => !existingTitles.has(r.title.toLowerCase().trim()) && !existingIds.has(r.id)
          );

          const finalRecipes = deduplicateRecipes([...cleanedLoadedRecipes, ...newInitialRecipes]);

          return {
            ...parsed,
            pantry: deduplicateById(parsed.pantry || []),
            recipes: finalRecipes,
            planner: deduplicateById(parsed.planner || []),
            shoppingList: deduplicateById(parsed.shoppingList || []),
          };
        }
      }
    } catch (e) {
      console.error('Error loading state from localStorage:', e);
    }
    return INITIAL_STATE;
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(current => (current === msg ? null : current));
    }, 3500);
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Error saving state to localStorage:', e);
    }
  }, [state]);

  // Helper to add item to shopping list if low stock and not already present
  const checkAndTriggerLowStock = useCallback(
    (product: PantryItem, currentShoppingList: ShoppingItem[]): ShoppingItem[] => {
      const ratio = product.totalAmount > 0 ? product.currentAmount / product.totalAmount : 0;
      if (ratio <= LOW_STOCK_RATIO || product.currentAmount <= 0) {
        const alreadyInList = currentShoppingList.some(
          s => !s.checked && s.name.toLowerCase().trim() === product.name.toLowerCase().trim()
        );
        if (!alreadyInList) {
          const buyAmount = product.totalAmount > 0 ? product.totalAmount : 1;
          const newItem: ShoppingItem = {
            id: 'auto-stock-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
            name: product.name,
            amount: buyAmount,
            unit: product.unit,
            category: product.category,
            checked: false,
            isAuto: true,
            reason: `Niski stan w spiżarni (${product.currentAmount} / ${product.totalAmount} ${product.unit})`,
            price: product.price,
          };
          return [...currentShoppingList, newItem];
        }
      }
      return currentShoppingList;
    },
    []
  );

  // PANTRY ACTIONS
  const addPantryProduct = useCallback((productData: Omit<PantryItem, 'id'>) => {
    const newItem: PantryItem = {
      ...productData,
      id: 'p-' + Date.now(),
    };
    setState(prev => {
      const updatedPantry = [newItem, ...prev.pantry];
      const updatedShopping = checkAndTriggerLowStock(newItem, prev.shoppingList);
      return {
        ...prev,
        pantry: updatedPantry,
        shoppingList: updatedShopping,
      };
    });
    showToast(`Dodano "${productData.name}" do spiżarni`);
  }, [checkAndTriggerLowStock, showToast]);

  const updatePantryProduct = useCallback(
    (id: string, updates: Partial<PantryItem>) => {
      setState(prev => {
        let modifiedItem: PantryItem | null = null;
        const updatedPantry = prev.pantry.map(item => {
          if (item.id === id) {
            modifiedItem = { ...item, ...updates };
            return modifiedItem;
          }
          return item;
        });

        let updatedShopping = prev.shoppingList;
        if (modifiedItem) {
          updatedShopping = checkAndTriggerLowStock(modifiedItem, prev.shoppingList);
        }

        return {
          ...prev,
          pantry: updatedPantry,
          shoppingList: updatedShopping,
        };
      });
      showToast('Zaktualizowano produkt');
    },
    [checkAndTriggerLowStock, showToast]
  );

  const deletePantryProduct = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      pantry: prev.pantry.filter(i => i.id !== id),
    }));
    showToast('Usunięto produkt ze spiżarni');
  }, [showToast]);

  const markProductAsOpened = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      pantry: prev.pantry.map(item => {
        if (item.id === id) {
          return {
            ...item,
            openedAt: formatDate(new Date()),
            daysValidAfterOpen: item.daysValidAfterOpen || 3,
          };
        }
        return item;
      }),
    }));
    showToast('Oznaczono jako otwarte – odliczanie aktywne!');
  }, [showToast]);

  const adjustPantryAmount = useCallback(
    (id: string, delta: number) => {
      setState(prev => {
        let modifiedItem: PantryItem | null = null;
        const updatedPantry = prev.pantry.map(item => {
          if (item.id === id) {
            const nextAmount = Math.max(0, item.currentAmount + delta);
            modifiedItem = { ...item, currentAmount: nextAmount };
            return modifiedItem;
          }
          return item;
        });

        let updatedShopping = prev.shoppingList;
        if (modifiedItem) {
          updatedShopping = checkAndTriggerLowStock(modifiedItem, prev.shoppingList);
        }

        return {
          ...prev,
          pantry: updatedPantry,
          shoppingList: updatedShopping,
        };
      });
    },
    [checkAndTriggerLowStock]
  );

  // RECIPE ACTIONS
  const addRecipe = useCallback((recipeData: Omit<Recipe, 'id'>) => {
    const newRecipe: Recipe = {
      ...recipeData,
      id: 'r-' + Date.now(),
    };
    setState(prev => ({
      ...prev,
      recipes: [newRecipe, ...prev.recipes],
    }));
    showToast(`Dodano przepis "${recipeData.title}"`);
  }, [showToast]);

  const deleteRecipe = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      recipes: prev.recipes.filter(r => r.id !== id),
    }));
    showToast('Usunięto przepis');
  }, [showToast]);

  const updateRecipe = useCallback((id: string, updates: Partial<Recipe>) => {
    setState(prev => ({
      ...prev,
      recipes: prev.recipes.map(r => (r.id === id ? { ...r, ...updates } : r)),
    }));
    showToast('Zaktualizowano przepis');
  }, [showToast]);

  const addMissingToShoppingList = useCallback((recipe: Recipe) => {
    setState(prev => {
      const avail = checkRecipeAvailability(recipe, prev.pantry);
      const newItems: ShoppingItem[] = [];
      const portionLabel = recipe.servings && recipe.servings !== 1 ? ` (${recipe.servings === 0.5 ? '½ porcji' : `${recipe.servings} porcji`})` : '';

      avail.details.forEach(detail => {
        if (detail.isMissing && detail.missingAmount > 0) {
          const alreadyInList = prev.shoppingList.some(
            s => !s.checked && s.name.toLowerCase().trim() === detail.name.toLowerCase().trim()
          );
          if (!alreadyInList) {
            newItems.push({
              id: 'missing-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
              name: detail.name,
              amount: detail.missingAmount,
              unit: detail.unit,
              category: 'Inne',
              checked: false,
              isAuto: true,
              reason: `Brakujący składnik do: ${recipe.title}${portionLabel}`,
            });
          }
        }
      });

      if (newItems.length === 0) {
        showToast('Wszystkie składniki są już w spiżarni lub na liście!');
        return prev;
      }

      showToast(`Dodano ${newItems.length} brakujące składniki na listę zakupów!`);
      return {
        ...prev,
        shoppingList: [...prev.shoppingList, ...newItems],
      };
    });
  }, [showToast]);

  const cookRecipe = useCallback(
    (recipe: Recipe, date: string, mealSlot: MealSlot) => {
      const portionLabel = recipe.servings && recipe.servings !== 1 ? ` (${recipe.servings === 0.5 ? '½ porcji' : `${recipe.servings} porcji`})` : '';
      setState(prev => {
        const updatedPantry = [...prev.pantry];
        let updatedShopping = [...prev.shoppingList];

        // Deduct ingredients from pantry and detect missing
        recipe.ingredients.forEach(ing => {
          const index = updatedPantry.findIndex(
            p => p.id === ing.pantryItemId ||
                 p.name.toLowerCase().trim() === ing.name.toLowerCase().trim() ||
                 p.name.toLowerCase().includes(ing.name.toLowerCase())
          );

          if (index !== -1) {
            const currentItem = updatedPantry[index];
            const needed = ing.amount;
            const newAmount = Math.max(0, currentItem.currentAmount - needed);
            const deficit = needed > currentItem.currentAmount ? needed - currentItem.currentAmount : 0;

            updatedPantry[index] = {
              ...currentItem,
              currentAmount: Math.round(newAmount * 10) / 10,
            };

            // Check low stock
            updatedShopping = checkAndTriggerLowStock(updatedPantry[index], updatedShopping);

            // If there was a deficit, add to shopping
            if (deficit > 0) {
              const alreadyInList = updatedShopping.some(
                s => !s.checked && s.name.toLowerCase().trim() === ing.name.toLowerCase().trim()
              );
              if (!alreadyInList) {
                updatedShopping.push({
                  id: 'deficit-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
                  name: ing.name,
                  amount: Math.round(deficit * 10) / 10,
                  unit: ing.unit,
                  category: currentItem.category,
                  checked: false,
                  isAuto: true,
                  reason: `Brakowało podczas gotowania: ${recipe.title}${portionLabel}`,
                });
              }
            }
          } else {
            // Completely missing from pantry
            const alreadyInList = updatedShopping.some(
              s => !s.checked && s.name.toLowerCase().trim() === ing.name.toLowerCase().trim()
            );
            if (!alreadyInList) {
              updatedShopping.push({
                id: 'missing-all-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
                name: ing.name,
                amount: ing.amount,
                unit: ing.unit,
                category: 'Inne',
                checked: false,
                isAuto: true,
                reason: `Składnik do: ${recipe.title}${portionLabel}`,
              });
            }
          }
        });

        // Add meal to planner with scaled nutrients
        const newPlannedMeal: PlannedMealItem = {
          id: 'meal-' + Date.now(),
          name: `${recipe.title}${portionLabel}`,
          amount: recipe.servings || 1,
          unit: 'porcja',
          kcal: recipe.kcal,
          protein: recipe.protein,
          fat: recipe.fat,
          carbs: recipe.carbs,
          mealSlot,
          date,
          recipeId: recipe.id,
          isPantrySource: true,
        };

        return {
          ...prev,
          pantry: updatedPantry,
          shoppingList: updatedShopping,
          planner: [newPlannedMeal, ...prev.planner],
        };
      });

      showToast(`Ugotowano "${recipe.title}"${portionLabel}! Składniki zaktualizowane.`);
    },
    [checkAndTriggerLowStock, showToast]
  );

  // PLANNER ACTIONS
  const addPlannedMeal = useCallback(
    (mealData: Omit<PlannedMealItem, 'id'>) => {
      setState(prev => {
        let updatedPantry = prev.pantry;
        let updatedShopping = prev.shoppingList;

        // If from pantry, deduct used amount
        if (mealData.isPantrySource && mealData.pantryItemId) {
          updatedPantry = prev.pantry.map(item => {
            if (item.id === mealData.pantryItemId) {
              const nextAmt = Math.max(0, item.currentAmount - mealData.amount);
              const mod = { ...item, currentAmount: nextAmt };
              updatedShopping = checkAndTriggerLowStock(mod, updatedShopping);
              return mod;
            }
            return item;
          });
        }

        const newMeal: PlannedMealItem = {
          ...mealData,
          id: 'meal-' + Date.now(),
        };

        return {
          ...prev,
          pantry: updatedPantry,
          shoppingList: updatedShopping,
          planner: [newMeal, ...prev.planner],
        };
      });

      showToast(`Dodano "${mealData.name}" do dziennika`);
    },
    [checkAndTriggerLowStock, showToast]
  );

  const deletePlannedMeal = useCallback(
    (id: string, restorePantry: boolean = false) => {
      setState(prev => {
        const meal = prev.planner.find(m => m.id === id);
        let updatedPantry = prev.pantry;

        if (restorePantry && meal && meal.isPantrySource && meal.pantryItemId) {
          updatedPantry = prev.pantry.map(item => {
            if (item.id === meal.pantryItemId) {
              return {
                ...item,
                currentAmount: item.currentAmount + meal.amount,
              };
            }
            return item;
          });
        }

        return {
          ...prev,
          pantry: updatedPantry,
          planner: prev.planner.filter(m => m.id !== id),
        };
      });

      showToast('Usunięto posiłek z dziennika');
    },
    [showToast]
  );

  // SHOPPING LIST ACTIONS
  const addShoppingItem = useCallback((itemData: Omit<ShoppingItem, 'id'>) => {
    const newItem: ShoppingItem = {
      ...itemData,
      id: 'shop-' + Date.now(),
    };
    setState(prev => ({
      ...prev,
      shoppingList: [newItem, ...prev.shoppingList],
    }));
    showToast(`Dodano "${itemData.name}" do listy zakupów`);
  }, [showToast]);

  const toggleShoppingItem = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      shoppingList: prev.shoppingList.map(s => (s.id === id ? { ...s, checked: !s.checked } : s)),
    }));
  }, []);

  const deleteShoppingItem = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      shoppingList: prev.shoppingList.filter(s => s.id !== id),
    }));
  }, []);

  // MAGIC TRANSFER: "Dodaj zaznaczone do zapasów"
  const transferCheckedToPantry = useCallback(() => {
    let transferredCount = 0;

    setState(prev => {
      const checkedItems = prev.shoppingList.filter(s => s.checked);
      if (checkedItems.length === 0) return prev;

      transferredCount = checkedItems.length;
      const updatedPantry = [...prev.pantry];

      checkedItems.forEach(shopItem => {
        const matchIndex = updatedPantry.findIndex(
          p => p.name.toLowerCase().trim() === shopItem.name.toLowerCase().trim()
        );

        if (matchIndex !== -1) {
          // Increase amount
          const existing = updatedPantry[matchIndex];
          const newCurrent = existing.currentAmount + shopItem.amount;
          const newTotal = Math.max(existing.totalAmount, newCurrent);
          updatedPantry[matchIndex] = {
            ...existing,
            currentAmount: newCurrent,
            totalAmount: newTotal,
            price: shopItem.price || existing.price,
          };
        } else {
          // Create new pantry item
          const newPantry: PantryItem = {
            id: 'p-bought-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
            name: shopItem.name,
            zone: inferStorageZone(shopItem.category),
            category: shopItem.category || 'Inne',
            currentAmount: shopItem.amount,
            totalAmount: shopItem.amount,
            unit: shopItem.unit,
            expiryDate: addDays(7),
            kcalPer100g: 100,
            proteinPer100g: 5,
            fatPer100g: 3,
            carbsPer100g: 12,
            price: shopItem.price,
          };
          updatedPantry.unshift(newPantry);
        }
      });

      // Remove checked items from shopping list
      const remainingShopping = prev.shoppingList.filter(s => !s.checked);

      return {
        ...prev,
        pantry: updatedPantry,
        shoppingList: remainingShopping,
      };
    });

    if (transferredCount > 0) {
      showToast(`Przeniesiono ${transferredCount} produktów do spiżarni! 🎉`);
    }
  }, [showToast]);

  const clearCheckedShopping = useCallback(() => {
    setState(prev => ({
      ...prev,
      shoppingList: prev.shoppingList.filter(s => !s.checked),
    }));
    showToast('Wyczyszczono kupione produkty');
  }, [showToast]);

  // SMART SCANNER HELPER: Check off matching item from shopping list & add directly to pantry
  const scanAndHandleShoppingItem = useCallback((product: {
    name: string;
    amount?: number;
    unit?: UnitType;
    category?: string;
    price?: number;
    kcalPer100g?: number;
    proteinPer100g?: number;
    fatPer100g?: number;
    carbsPer100g?: number;
    barcode?: string;
    zone?: StorageZone;
    shelfLifeDays?: number;
  }) => {
    let matchedItemName: string | null = null;

    setState(prev => {
      const cleanName = product.name.toLowerCase().trim();
      // Look for match in shopping list
      const matchIndex = prev.shoppingList.findIndex(
        s => s.name.toLowerCase().trim() === cleanName ||
             cleanName.includes(s.name.toLowerCase().trim()) ||
             s.name.toLowerCase().trim().includes(cleanName)
      );

      let updatedShopping = [...prev.shoppingList];
      if (matchIndex !== -1) {
        matchedItemName = updatedShopping[matchIndex].name;
        updatedShopping[matchIndex] = {
          ...updatedShopping[matchIndex],
          checked: true,
        };
      }

      // Add or update in pantry
      const pantryMatchIndex = prev.pantry.findIndex(
        p => p.name.toLowerCase().trim() === cleanName ||
             (product.barcode && p.barcode === product.barcode)
      );

      let updatedPantry = [...prev.pantry];
      const itemAmount = product.amount || 1;
      const itemUnit = product.unit || 'szt';

      if (pantryMatchIndex !== -1) {
        const existing = updatedPantry[pantryMatchIndex];
        const newCurrent = existing.currentAmount + itemAmount;
        const newTotal = Math.max(existing.totalAmount, newCurrent);
        updatedPantry[pantryMatchIndex] = {
          ...existing,
          currentAmount: newCurrent,
          totalAmount: newTotal,
          barcode: product.barcode || existing.barcode,
        };
      } else {
        const newPantryItem: PantryItem = {
          id: 'p-' + Date.now(),
          name: product.name,
          zone: product.zone || 'fridge',
          category: product.category || 'Inne',
          currentAmount: itemAmount,
          totalAmount: itemAmount,
          unit: itemUnit,
          expiryDate: addDays(product.shelfLifeDays || 14),
          kcalPer100g: product.kcalPer100g || 0,
          proteinPer100g: product.proteinPer100g || 0,
          fatPer100g: product.fatPer100g || 0,
          carbsPer100g: product.carbsPer100g || 0,
          price: product.price || 0,
          barcode: product.barcode,
        };
        updatedPantry = [newPantryItem, ...updatedPantry];
      }

      return {
        ...prev,
        pantry: updatedPantry,
        shoppingList: updatedShopping,
      };
    });

    return { matched: !!matchedItemName, matchedName: matchedItemName };
  }, []);

  // CUSTOM CATEGORIES
  const addCustomCategory = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setState(prev => {
      if (prev.customCategories.includes(trimmed)) return prev;
      return {
        ...prev,
        customCategories: [...prev.customCategories, trimmed],
      };
    });
    showToast(`Dodano kategorię "${trimmed}"`);
  }, [showToast]);

  // USER GOALS
  const updateGoals = useCallback((newGoals: Partial<UserGoals>) => {
    setState(prev => {
      const merged: UserGoals = { ...prev.goals, ...newGoals };
      if (merged.mode === 'auto') {
        const calculated = calculateTDEEGoals(merged);
        return {
          ...prev,
          goals: {
            ...merged,
            ...calculated,
          },
        };
      }
      return {
        ...prev,
        goals: merged,
      };
    });
    showToast('Zaktualizowano cele dietetyczne');
  }, [showToast]);

  // Reset to rich demo data
  const resetToDemo = useCallback(() => {
    setState(INITIAL_STATE);
    localStorage.removeItem(STORAGE_KEY);
    showToast('Przywrócono przykładowe dane');
  }, [showToast]);

  return {
    state,
    toastMessage,
    showToast,
    // Pantry
    addPantryProduct,
    addProduct: addPantryProduct,
    updatePantryProduct,
    updateProduct: updatePantryProduct,
    deletePantryProduct,
    deleteProduct: deletePantryProduct,
    markProductAsOpened,
    markAsOpened: markProductAsOpened,
    adjustPantryAmount,
    // Recipes
    addRecipe,
    updateRecipe,
    deleteRecipe,
    cookRecipe,
    addMissingToShoppingList,
    addMissingRecipeIngredientsToShopping: addMissingToShoppingList,
    // Planner
    addPlannedMeal,
    deletePlannedMeal,
    // Shopping
    addShoppingItem,
    toggleShoppingItem,
    deleteShoppingItem,
    transferCheckedToPantry,
    transferCheckedShoppingToPantry: transferCheckedToPantry,
    clearCheckedShopping,
    scanAndHandleShoppingItem,
    // Categories & Goals
    addCustomCategory,
    updateGoals,
    resetToDemo,
    resetToDefaultData: resetToDemo,
  };
}
