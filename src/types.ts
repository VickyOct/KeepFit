export type ScreenName = 'home' | 'review' | 'history' | 'workout' | 'recipes' | 'referee';

export type ReminderStatus = 'checking' | 'scheduled' | 'denied' | 'error' | 'unsupported';
export type MealType = '早餐' | '午餐' | '晚餐' | '加餐';

export type FoodSource = 'local' | 'usda' | 'manual';

export type FoodCatalogItem = {
  id: string;
  name: string;
  emoji?: string;
  proteinPer100g: number;
  defaultGrams: number;
  tint: string;
  category?: string;
  searchTerms?: string[];
  source?: FoodSource;
  sourceId?: string;
};

export type MealFood = FoodCatalogItem & {
  entryId: string;
  grams: number;
};

export type MealRecord = {
  id: string;
  createdAt: string;
  mealType: MealType;
  imageUri: string | null;
  foods: MealFood[];
  totalProtein: number;
};

export type StoredAppState = {
  meals: MealRecord[];
  proteinTarget: number;
};
