export type RecipeMeal = '早餐' | '午餐' | '晚餐';
export type RecipeCuisine = '粤菜' | '茶餐厅' | '中式家常' | '熟悉的西式';
export type RecipeServings = 1 | 2 | 4;

export type RecipeIngredient = {
  name: string;
  amount: number;
  unit: '克' | '毫升';
  note?: string;
  energy?: { kcalPer100: number; basis: string; sourceUrl?: string };
};

export type Recipe = {
  id: string;
  name: string;
  emoji: string;
  meal: RecipeMeal;
  cuisine: RecipeCuisine;
  flavor: string;
  minutes: number;
  timeNote?: string;
  ingredients: RecipeIngredient[];
  steps: string[];
  portionTip: string;
  adaptation: string;
  allergens: string[];
  searchTerms?: string[];
  source: { publisher: string; title: string; url: string };
  collection?: '港式菜单';
  energyPortion?: { label: string; includes: string };
};

export type RecipeFilters = {
  meal: RecipeMeal | '全部';
  cuisine: RecipeCuisine | '全部口味';
  query: string;
  quickOnly: boolean;
  favoritesOnly: boolean;
  collection?: '港式菜单' | '原有食谱';
};
