import type { Recipe, RecipeIngredient } from './recipeTypes';

type EnergyFactor = NonNullable<RecipeIngredient['energy']>;
const usda = (kcalPer100: number, id: number, description: string): EnergyFactor => ({
  kcalPer100, basis: `USDA SR Legacy：${description}，每 100 克；2026-09-28 查询`,
  sourceUrl: `https://fdc.nal.usda.gov/food-details/${id}/nutrients`,
});
const approximate = (kcalPer100: number, description: string): EnergyFactor => ({
  kcalPer100, basis: `KeepFit 编辑近似值：${description}；不是该品牌或食物的实测数据`,
});

// Only values successfully retrieved from the public API are attributed to USDA.
// Other factors are explicitly editorial approximations, not fabricated database records.
export const energyFactors = {
  egg: usda(143, 171287, '生全蛋，可食部分'),
  rice: usda(130, 168878, '熟白米饭'),
  bread: usda(266, 174924, '白面包，烘烤前重量'),
  oil: usda(884, 172336, '菜籽油'),
  butter: usda(717, 173410, '有盐黄油'),
  milk: usda(61, 171265, '全脂牛奶；毫升按约等于克换算'),
  pasta: usda(371, 169736, '干意面/通心粉'),
  riceNoodles: { ...usda(108, 168914, '熟米粉'), basis: 'USDA 熟米粉 108 kcal/100g，近似代替鲜河粉；含油量与含水量不同会改变结果' },
  eggNoodles: approximate(370, '干蛋面每 100 克'),
  instantNoodles: approximate(450, '油炸方便面及粉包按干重；不同品牌以包装为准'),
  chicken: approximate(150, '生去皮鸡腿肉每 100 克'),
  beef: approximate(180, '生瘦牛肉每 100 克，脂肪比例可变'),
  pork: approximate(260, '生猪肉末每 100 克，含肥肉的普通版本'),
  shrimp: approximate(85, '生虾仁每 100 克，沥干去壳'),
  fish: approximate(85, '生白肉鱼柳每 100 克，不适用于三文鱼'),
  ham: approximate(150, '火腿每 100 克，品牌可变'),
  luncheon: approximate(320, '普通午餐肉每 100 克，品牌可变'),
  tuna: approximate(115, '水浸吞拿鱼沥干后每 100 克'),
  mayo: approximate(680, '普通全脂蛋黄酱每 100 克'),
  sugar: approximate(400, '白砂糖每 100 克'),
  starch: approximate(380, '玉米淀粉每 100 克'),
  soy: approximate(60, '生抽/老抽每 100 克；毫升按约等于克换算'),
  oyster: approximate(100, '蚝油每 100 克'),
  stock: approximate(5, '清鸡汤每 100 毫升，非浓缩汤'),
  tomato: approximate(20, '生番茄每 100 克'),
  greens: approximate(20, '普通叶菜/黄瓜每 100 克'),
  sprouts: approximate(30, '豆芽每 100 克'),
  onion: approximate(40, '洋葱每 100 克'),
  mushroom: approximate(35, '鲜香菇每 100 克'),
  aromatics: approximate(50, '少量葱姜蒜的混合近似值每 100 克'),
  mustard: approximate(30, '榨菜每 100 克'),
  chestnut: approximate(100, '去皮荸荠每 100 克'),
  corn: approximate(90, '熟玉米粒每 100 克'),
  peas: approximate(80, '青豆每 100 克'),
  zero: { kcalPer100: 0, basis: '水或食盐不提供热量' },
} satisfies Record<string, EnergyFactor>;

export const ENERGY_METHOD_NOTE = '将每项用量 × 每 100 克（或毫升）热量后相加，四舍五入到约 10 千卡。基础食材参考 USDA，肉类、蔬菜与酱料部分采用明确标注的近似值；油和酱汁按全部吃下计。品牌、肉的肥瘦、剩下的汤汁和餐厅份量都会改变结果。';

export function recipeEnergy(recipe: Recipe, servings = 1) {
  if (!recipe.energyPortion || recipe.ingredients.some((item) => !item.energy)) return null;
  const items = recipe.ingredients.map((item) => ({
    name: item.name, kcal: item.amount * item.energy!.kcalPer100 / 100,
    factor: item.energy!,
  }));
  const exact = items.reduce((sum, item) => sum + item.kcal, 0);
  const rounded = (value: number) => Math.round(value / 10) * 10;
  return { perServing: rounded(exact), total: rounded(exact * servings), items };
}
