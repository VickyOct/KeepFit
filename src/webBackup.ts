import { parseWorkoutState } from './workoutStorage';
import { parseRefereeState } from './refereeStorage';
import { emptyRefereeState } from './refereeUtils';

export const backupDefaults: Record<string, string> = {
  'keepfit.meals.v1': '[]',
  'keepfit.protein-target.v1': '120',
  'keepfit.workouts.v1': '{"records":[],"draft":null}',
  'keepfit.recipe-favorites.v1': '[]',
  'keepfit.referee-learning.v1': JSON.stringify(emptyRefereeState()),
};

export function validateBackup(text: string): Record<string, string> {
  const backup = JSON.parse(text);
  if (backup?.format !== 'keepfit-web' || backup.version !== 1 || !backup.data || typeof backup.data !== 'object') throw new Error('请选择 KeepFit 导出的备份文件。');
  const data: Record<string, string> = {};
  for (const key of Object.keys(backupDefaults)) {
    if (typeof backup.data[key] !== 'string') throw new Error('备份缺少数据，尚未覆盖当前记录。');
    data[key] = backup.data[key];
  }
  parseWorkoutState(data['keepfit.workouts.v1']);
  parseRefereeState(data['keepfit.referee-learning.v1']);
  const favorites = JSON.parse(data['keepfit.recipe-favorites.v1']);
  if (!Array.isArray(favorites) || !favorites.every((id) => typeof id === 'string')) throw new Error('食谱收藏格式无效。');
  const target = Number(data['keepfit.protein-target.v1']);
  if (!Number.isFinite(target) || target < 20 || target > 300) throw new Error('蛋白质目标无效。');
  const meals = JSON.parse(data['keepfit.meals.v1']);
  const number = (n: unknown) => typeof n === 'number' && Number.isFinite(n) && n >= 0;
  if (!Array.isArray(meals) || !meals.every((m) => m && typeof m.id === 'string' && typeof m.createdAt === 'string' && Number.isFinite(Date.parse(m.createdAt)) &&
    ['早餐', '午餐', '晚餐', '加餐'].includes(m.mealType) && number(m.totalProtein) &&
    (m.imageUri === null || (typeof m.imageUri === 'string' && /^data:image\/(jpeg|png|webp);base64,[a-zA-Z0-9+/=]+$/.test(m.imageUri))) &&
    Array.isArray(m.foods) && m.foods.every((f: Record<string, unknown>) => f && ['id', 'entryId', 'name', 'tint'].every((key) => typeof f[key] === 'string') &&
      number(f.grams) && number(f.proteinPer100g) && number(f.defaultGrams)))) throw new Error('饮食记录或照片格式无效。');
  return data;
}
