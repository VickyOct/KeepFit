import Storage from './kvStore';

import type { MealRecord, StoredAppState } from './types';

const MEALS_KEY = 'keepfit.meals.v1';
const TARGET_KEY = 'keepfit.protein-target.v1';
const DEFAULT_TARGET = 120;

export async function loadAppState(): Promise<StoredAppState> {
  const [mealsJson, targetJson] = await Promise.all([
    Storage.getItem(MEALS_KEY),
    Storage.getItem(TARGET_KEY),
  ]);

  let meals: MealRecord[] = [];
  let proteinTarget = DEFAULT_TARGET;

  if (mealsJson) {
    try {
      const parsed = JSON.parse(mealsJson);
      if (Array.isArray(parsed)) meals = parsed;
    } catch {
      meals = [];
    }
  }

  if (targetJson) {
    const parsed = Number(targetJson);
    if (Number.isFinite(parsed) && parsed >= 20 && parsed <= 300) proteinTarget = parsed;
  }

  return { meals, proteinTarget };
}

export async function saveMeals(meals: MealRecord[]) {
  await Storage.setItem(MEALS_KEY, JSON.stringify(meals));
}

export async function saveProteinTarget(target: number) {
  await Storage.setItem(TARGET_KEY, String(target));
}
