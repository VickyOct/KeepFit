import type { MealFood, MealType } from './types';

export const MEAL_TYPES: { name: MealType; emoji: string }[] = [
  { name: '早餐', emoji: '🌅' },
  { name: '午餐', emoji: '☀️' },
  { name: '晚餐', emoji: '🌙' },
  { name: '加餐', emoji: '🍎' },
];

export function roundProtein(value: number) {
  return Math.round(value * 10) / 10;
}

export function calculateFoodProtein(food: Pick<MealFood, 'grams' | 'proteinPer100g'>) {
  return roundProtein((food.grams / 100) * food.proteinPer100g);
}

export function calculateMealProtein(foods: MealFood[]) {
  return roundProtein(foods.reduce((sum, food) => sum + calculateFoodProtein(food), 0));
}

export function getLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' }).format(date);
}

export function formatHistoryDate(date: Date) {
  if (getLocalDateKey(date) === getLocalDateKey(new Date())) return '今天';
  return new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' }).format(date);
}

export function formatTime(date: Date) {
  return new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
}

export function getMealType(date: Date): MealType {
  const hour = date.getHours();
  if (hour < 10) return '早餐';
  if (hour < 15) return '午餐';
  if (hour < 21) return '晚餐';
  return '加餐';
}

export function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
