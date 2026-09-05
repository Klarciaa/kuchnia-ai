export type StorageZone = 'fridge' | 'freezer' | 'drawers';

export type FoodCategory =
  | 'Nabiał'
  | 'Mięso i ryby'
  | 'Warzywa'
  | 'Owoce'
  | 'Pieczywo'
  | 'Suche i sypkie'
  | 'Napoje'
  | 'Sosy i przyprawy'
  | 'Mrożonki'
  | 'Słodycze i przekąski'
  | 'Inne'
  | string;

export type UnitType = 'g' | 'ml' | 'szt' | 'opak' | 'porcja';

export interface PantryItem {
  id: string;
  name: string;
  zone: StorageZone;
  category: FoodCategory;
  currentAmount: number;
  totalAmount: number;
  unit: UnitType;
  expiryDate: string; // YYYY-MM-DD
  openedAt?: string; // ISO date string or YYYY-MM-DD
  daysValidAfterOpen?: number; // e.g. 3 days after opening
  kcalPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
  price?: number; // estimated PLN
  barcode?: string;
}

export interface RecipeIngredient {
  name: string;
  amount: number;
  unit: UnitType;
  pantryItemId?: string;
  kcal?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
}

export type MealCategory =
  | 'Śniadanie'
  | 'Obiad'
  | 'Kolacja'
  | 'Zupa'
  | 'Przekąska'
  | 'Deser'
  | string;

export interface Recipe {
  id: string;
  title: string;
  category: MealCategory;
  prepTime: string;
  servings?: number;
  kcal: number; // per serving
  protein: number;
  fat: number;
  carbs: number;
  totalKcal?: number;
  totalProtein?: number;
  totalFat?: number;
  totalCarbs?: number;
  description: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
  imageUrl?: string;
}

export type MealSlot = 'breakfast' | 'second_breakfast' | 'lunch' | 'dinner';

export interface PlannedMealItem {
  id: string;
  name: string;
  amount: number;
  unit: UnitType;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  mealSlot: MealSlot;
  date: string; // YYYY-MM-DD
  pantryItemId?: string;
  isPantrySource: boolean;
  recipeId?: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  amount: number;
  unit: UnitType;
  category: FoodCategory;
  checked: boolean;
  isAuto: boolean; // low stock / missing from recipe
  reason?: string;
  price?: number;
}

export interface UserGoals {
  mode: 'manual' | 'auto';
  kcalGoal: number;
  proteinGoal: number;
  fatGoal: number;
  carbsGoal: number;
  // Automatic TDEE calculation fields
  gender: 'female' | 'male';
  weightKg: number;
  heightCm: number;
  age: number;
  activityLevel: number; // 1.2, 1.375, 1.55, 1.725, 1.9
  goalType: 'cut' | 'maintain' | 'bulk'; // -18%, 0%, +15%
}

export interface KitchenState {
  pantry: PantryItem[];
  recipes: Recipe[];
  planner: PlannedMealItem[];
  shoppingList: ShoppingItem[];
  customCategories: string[];
  goals: UserGoals;
}

export type ActiveTab = 'pantry' | 'recipes' | 'planner' | 'shopping';
export type TabType = ActiveTab;
