import { PantryItem, Recipe, ShoppingItem, UserGoals, StorageZone, UnitType } from '../types';
import { LOW_STOCK_RATIO, formatDate, addDays } from '../constants/mockData';

export interface ExpiryInfo {
  daysLeft: number;
  status: 'fresh' | 'warning' | 'expired';
  statusLabel: string;
  effectiveDate: string;
  isOpenedWarning: boolean;
}

export function getEffectiveExpiry(item: PantryItem): ExpiryInfo {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const origExpiry = new Date(item.expiryDate);
  origExpiry.setHours(0, 0, 0, 0);

  let effective = origExpiry;
  let isOpenedWarning = false;

  if (item.openedAt && item.daysValidAfterOpen && item.daysValidAfterOpen > 0) {
    const opened = new Date(item.openedAt);
    opened.setHours(0, 0, 0, 0);
    const afterOpenDate = new Date(opened);
    afterOpenDate.setDate(afterOpenDate.getDate() + item.daysValidAfterOpen);

    if (afterOpenDate < origExpiry) {
      effective = afterOpenDate;
      isOpenedWarning = true;
    }
  }

  const diffMs = effective.getTime() - today.getTime();
  const daysLeft = Math.round(diffMs / (1000 * 60 * 60 * 24));

  let status: 'fresh' | 'warning' | 'expired';
  let statusLabel: string;

  if (daysLeft < 0) {
    status = 'expired';
    statusLabel = `Termin minął (${Math.abs(daysLeft)} dni temu)`;
  } else if (daysLeft === 0) {
    status = 'warning';
    statusLabel = 'Termin mija dzisiaj!';
  } else if (daysLeft <= 2) {
    status = 'warning';
    statusLabel = `Mija za ${daysLeft} ${daysLeft === 1 ? 'dzień' : 'dni'}`;
  } else {
    status = 'fresh';
    statusLabel = `Świeże (${daysLeft} dni)`;
  }

  return {
    daysLeft,
    status,
    statusLabel,
    effectiveDate: formatDate(effective),
    isOpenedWarning,
  };
}

export function calculateTDEEGoals(goals: UserGoals): {
  kcalGoal: number;
  proteinGoal: number;
  fatGoal: number;
  carbsGoal: number;
} {
  const { gender, weightKg, heightCm, age, activityLevel, goalType } = goals;

  // Mifflin - St Jeor formula
  let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === 'male') {
    bmr += 5;
  } else {
    bmr -= 161;
  }

  let tdee = bmr * activityLevel;

  // Goal adjustment
  if (goalType === 'cut') {
    tdee = tdee * 0.82; // -18% reduction
  } else if (goalType === 'bulk') {
    tdee = tdee * 1.15; // +15% surplus
  }

  const kcalGoal = Math.round(tdee);

  // Macro calculations
  // Protein: 2.0g per kg of bodyweight
  const proteinGoal = Math.round(weightKg * 2.0);
  // Fat: 0.9g per kg of bodyweight
  const fatGoal = Math.round(weightKg * 0.9);
  // Carbs: remaining calories (1g P = 4 kcal, 1g F = 9 kcal, 1g C = 4 kcal)
  const remainingKcal = Math.max(200, kcalGoal - (proteinGoal * 4 + fatGoal * 9));
  const carbsGoal = Math.round(remainingKcal / 4);

  return { kcalGoal, proteinGoal, fatGoal, carbsGoal };
}

// Check recipe ingredient availability against pantry
export interface RecipeAvailability {
  hasAll: boolean;
  missingCount: number;
  details: {
    name: string;
    needed: number;
    available: number;
    unit: UnitType;
    isMissing: boolean;
    missingAmount: number;
  }[];
}

export function checkRecipeAvailability(recipe: Recipe, pantry: PantryItem[]): RecipeAvailability {
  let missingCount = 0;
  const details = recipe.ingredients.map(ing => {
    // Match by pantryItemId or case-insensitive fuzzy name
    const found = pantry.find(
      p => p.id === ing.pantryItemId || p.name.toLowerCase().trim() === ing.name.toLowerCase().trim() ||
           p.name.toLowerCase().includes(ing.name.toLowerCase()) ||
           ing.name.toLowerCase().includes(p.name.toLowerCase())
    );

    const available = found ? found.currentAmount : 0;
    const isMissing = available < ing.amount;
    const missingAmount = isMissing ? Math.max(0, ing.amount - available) : 0;

    if (isMissing) {
      missingCount++;
    }

    return {
      name: ing.name,
      needed: ing.amount,
      available,
      unit: ing.unit,
      isMissing,
      missingAmount,
    };
  });

  return {
    hasAll: missingCount === 0,
    missingCount,
    details,
  };
}

export function inferStorageZone(category: string): StorageZone {
  const c = category.toLowerCase();
  if (c.includes('mrożonki') || c.includes('lody')) return 'freezer';
  if (c.includes('suche') || c.includes('pieczywo') || c.includes('sypkie') || c.includes('słodycze')) return 'drawers';
  return 'fridge';
}

// Scale recipe calories, macros, and ingredients by selected portion count (e.g. 0.5, 1, 1.5, 2)
export function getScaledRecipe(recipe: Recipe, targetPortions: number): Recipe {
  const baseServings = Math.max(0.1, recipe.servings || 1);
  const round1 = (val: number) => Math.round(val * 10) / 10;

  // recipe.kcal, protein, fat, carbs are defined per 1 serving
  const scaledKcal = Math.round(recipe.kcal * targetPortions);
  const scaledProtein = round1(recipe.protein * targetPortions);
  const scaledFat = round1(recipe.fat * targetPortions);
  const scaledCarbs = round1(recipe.carbs * targetPortions);

  const scaledIngredients = (recipe.ingredients || []).map(ing => {
    // 1 serving amount is ing.amount / baseServings
    const singlePortionAmount = ing.amount / baseServings;
    const scaledAmount = round1(singlePortionAmount * targetPortions);

    return {
      ...ing,
      amount: scaledAmount,
      kcal: ing.kcal !== undefined ? Math.round((ing.kcal / baseServings) * targetPortions) : undefined,
      protein: ing.protein !== undefined ? round1((ing.protein / baseServings) * targetPortions) : undefined,
      fat: ing.fat !== undefined ? round1((ing.fat / baseServings) * targetPortions) : undefined,
      carbs: ing.carbs !== undefined ? round1((ing.carbs / baseServings) * targetPortions) : undefined,
    };
  });

  return {
    ...recipe,
    servings: targetPortions,
    kcal: scaledKcal,
    protein: scaledProtein,
    fat: scaledFat,
    carbs: scaledCarbs,
    ingredients: scaledIngredients,
  };
}
