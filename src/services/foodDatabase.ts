import type { FoodCatalogItem } from '../types';

const USDA_SEARCH_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';
const USDA_API_KEY = process.env.EXPO_PUBLIC_USDA_API_KEY?.trim() || 'DEMO_KEY';

const QUERY_ALIASES: Record<string, string> = {
  乳清蛋白粉: 'whey protein powder',
  希腊酸奶: 'plain greek yogurt',
  全麦面包: 'whole wheat bread',
  鸡胸肉: 'cooked chicken breast',
  鸡腿肉: 'cooked chicken thigh',
  三文鱼: 'cooked salmon',
  金枪鱼: 'canned tuna',
  鹰嘴豆: 'cooked chickpeas',
  牛肉末: 'cooked ground beef',
  西兰花: 'cooked broccoli',
  火鸡: 'cooked turkey',
  鸡蛋: 'cooked whole egg',
  蛋白: 'cooked egg white',
  牛肉: 'cooked beef',
  猪肉: 'cooked pork',
  鳕鱼: 'cooked cod',
  虾仁: 'cooked shrimp',
  豆腐: 'tofu',
  毛豆: 'cooked edamame',
  扁豆: 'cooked lentils',
  黑豆: 'cooked black beans',
  酸奶: 'plain yogurt',
  牛奶: 'milk',
  豆浆: 'soy milk',
  奶酪: 'cheese',
  芝士: 'cheese',
  蛋白粉: 'protein powder',
  糙米: 'cooked brown rice',
  米饭: 'cooked white rice',
  燕麦: 'oats',
  藜麦: 'cooked quinoa',
  意面: 'cooked pasta',
  面条: 'cooked noodles',
  面包: 'bread',
  红薯: 'cooked sweet potato',
  土豆: 'cooked potato',
  菠菜: 'spinach',
  蘑菇: 'mushroom',
  玉米: 'cooked corn',
  花生: 'peanuts',
  杏仁: 'almonds',
  腰果: 'cashews',
};

type UsdaNutrient = {
  nutrientId?: number;
  nutrientName?: string;
  nutrientNumber?: string;
  unitName?: string;
  value?: number;
};

type UsdaFood = {
  fdcId: number;
  description: string;
  dataType?: string;
  brandOwner?: string;
  foodNutrients?: UsdaNutrient[];
};

type UsdaSearchResponse = {
  foods?: UsdaFood[];
};

function translateQuery(query: string) {
  const normalized = query.trim().toLowerCase();
  const alias = Object.keys(QUERY_ALIASES)
    .sort((left, right) => right.length - left.length)
    .find((key) => normalized.includes(key));

  return alias ? QUERY_ALIASES[alias] : normalized;
}

function formatDescription(description: string) {
  const lowered = description.trim().toLowerCase();
  return lowered.replace(/(^|[\s,(/-])([a-z])/g, (_, boundary: string, letter: string) => `${boundary}${letter.toUpperCase()}`);
}

function findProtein(food: UsdaFood) {
  const nutrient = food.foodNutrients?.find(
    (item) =>
      item.nutrientId === 1003 ||
      item.nutrientNumber === '203' ||
      item.nutrientName?.toLowerCase() === 'protein',
  );

  if (typeof nutrient?.value !== 'number' || !Number.isFinite(nutrient.value)) return null;
  return Math.round(nutrient.value * 10) / 10;
}

function choosePresentation(description: string) {
  const name = description.toLowerCase();
  if (name.includes('egg')) return { emoji: '🥚', tint: '#F8EDC9', grams: 100 };
  if (name.includes('yogurt') || name.includes('oat')) return { emoji: '🥣', tint: '#E8EEF2', grams: 180 };
  if (name.includes('milk')) return { emoji: '🥛', tint: '#E8EEF2', grams: 250 };
  if (name.includes('cheese')) return { emoji: '🧀', tint: '#F4E4B8', grams: 30 };
  if (name.includes('chicken') || name.includes('turkey')) return { emoji: '🍗', tint: '#F3E7D7', grams: 150 };
  if (name.includes('beef') || name.includes('pork') || name.includes('meat')) return { emoji: '🥩', tint: '#F2DFD9', grams: 150 };
  if (name.includes('fish') || name.includes('salmon') || name.includes('tuna') || name.includes('cod')) return { emoji: '🐟', tint: '#E3EBEC', grams: 150 };
  if (name.includes('shrimp')) return { emoji: '🦐', tint: '#F7E0D8', grams: 120 };
  if (name.includes('crab')) return { emoji: '🦀', tint: '#F7E0D8', grams: 120 };
  if (name.includes('bean') || name.includes('lentil') || name.includes('chickpea')) return { emoji: '🫘', tint: '#E0ECD1', grams: 150 };
  if (name.includes('tofu') || name.includes('quinoa')) return { emoji: '', tint: '#EEE9D7', grams: 150 };
  if (name.includes('bread')) return { emoji: '🍞', tint: '#EFE3CA', grams: 60 };
  if (name.includes('rice')) return { emoji: '🍚', tint: '#EFE3CA', grams: 180 };
  if (name.includes('pasta')) return { emoji: '🍝', tint: '#EFE3CA', grams: 180 };
  if (name.includes('noodle')) return { emoji: '🍜', tint: '#EFE3CA', grams: 180 };
  if (name.includes('potato')) return { emoji: '🥔', tint: '#ECE4CF', grams: 180 };
  if (name.includes('corn')) return { emoji: '🌽', tint: '#F2E8BD', grams: 150 };
  if (name.includes('mushroom')) return { emoji: '🍄', tint: '#E9E4DA', grams: 100 };
  if (name.includes('broccoli')) return { emoji: '🥦', tint: '#DDEBD8', grams: 100 };
  if (name.includes('powder')) return { emoji: '🥤', tint: '#E5EADE', grams: 30 };
  return { emoji: '', tint: '#E6ECE3', grams: 100 };
}

export async function searchUsdaFoods(query: string, signal?: AbortSignal): Promise<FoodCatalogItem[]> {
  const response = await fetch(`${USDA_SEARCH_URL}?api_key=${encodeURIComponent(USDA_API_KEY)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: translateQuery(query),
      pageSize: 18,
      dataType: ['Foundation', 'SR Legacy', 'Survey (FNDDS)', 'Branded'],
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`USDA search failed with status ${response.status}`);
  }

  const payload = (await response.json()) as UsdaSearchResponse;
  const seen = new Set<string>();

  return (payload.foods ?? []).flatMap((food) => {
    const protein = findProtein(food);
    const duplicateKey = food.description.trim().toLowerCase();
    if (protein === null || seen.has(duplicateKey)) return [];
    seen.add(duplicateKey);

    const presentation = choosePresentation(food.description);
    return [{
      id: `usda-${food.fdcId}`,
      name: formatDescription(food.description),
      emoji: presentation.emoji,
      proteinPer100g: protein,
      defaultGrams: presentation.grams,
      tint: presentation.tint,
      category: food.dataType,
      source: 'usda' as const,
      sourceId: String(food.fdcId),
    }];
  });
}
