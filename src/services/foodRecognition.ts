import { FOOD_CATALOG } from '../data/foods';
import type { MealFood } from '../types';
import { createId } from '../utils';

export type RecognitionResult = {
  source: 'demo';
  foods: MealFood[];
};

// This adapter is the single place to connect a real, self-hosted model later.
export async function recognizeFoodPhoto(_imageUri: string): Promise<RecognitionResult> {
  await new Promise((resolve) => setTimeout(resolve, 900));

  const demoIds = ['chicken-breast', 'rice', 'broccoli'];
  const foods = demoIds
    .map((id) => FOOD_CATALOG.find((item) => item.id === id))
    .filter((item): item is (typeof FOOD_CATALOG)[number] => Boolean(item))
    .map((item) => ({ ...item, entryId: createId('food'), grams: item.defaultGrams }));

  return { source: 'demo', foods };
}
