import type { FoodCatalogItem } from '../types';

export const FOOD_CATALOG: FoodCatalogItem[] = [
  { id: 'chicken-breast', name: '鸡胸肉', emoji: '🍗', proteinPer100g: 31, defaultGrams: 150, tint: '#F3E7D7', category: '肉蛋', searchTerms: ['鸡肉', 'chicken'], source: 'local' },
  { id: 'chicken-thigh', name: '鸡腿肉', emoji: '🍗', proteinPer100g: 24, defaultGrams: 150, tint: '#F3E7D7', category: '肉蛋', searchTerms: ['鸡肉', 'chicken thigh'], source: 'local' },
  { id: 'egg', name: '鸡蛋', emoji: '🥚', proteinPer100g: 13, defaultGrams: 100, tint: '#F8EDC9', category: '肉蛋', searchTerms: ['蛋', 'egg'], source: 'local' },
  { id: 'egg-white', name: '蛋白', emoji: '🥚', proteinPer100g: 10.9, defaultGrams: 100, tint: '#F8EDC9', category: '肉蛋', searchTerms: ['鸡蛋白', 'egg white'], source: 'local' },
  { id: 'lean-beef', name: '瘦牛肉', emoji: '🥩', proteinPer100g: 26, defaultGrams: 150, tint: '#F2DFD9', category: '肉蛋', searchTerms: ['牛肉', 'beef'], source: 'local' },
  { id: 'ground-beef', name: '牛肉末', emoji: '🥩', proteinPer100g: 25, defaultGrams: 150, tint: '#F2DFD9', category: '肉蛋', searchTerms: ['碎牛肉', 'ground beef'], source: 'local' },
  { id: 'pork-loin', name: '猪里脊', emoji: '🥩', proteinPer100g: 27, defaultGrams: 150, tint: '#F5E3DF', category: '肉蛋', searchTerms: ['猪肉', 'pork'], source: 'local' },
  { id: 'pork-chop', name: '猪排', emoji: '🥩', proteinPer100g: 25, defaultGrams: 150, tint: '#F5E3DF', category: '肉蛋', searchTerms: ['猪肉', 'pork chop'], source: 'local' },
  { id: 'turkey-breast', name: '火鸡胸肉', emoji: '🍗', proteinPer100g: 29, defaultGrams: 150, tint: '#F0E5D8', category: '肉蛋', searchTerms: ['火鸡', 'turkey'], source: 'local' },
  { id: 'ham', name: '火腿', emoji: '🍖', proteinPer100g: 21, defaultGrams: 80, tint: '#F5E1DC', category: '肉蛋', searchTerms: ['ham'], source: 'local' },

  { id: 'salmon', name: '三文鱼', emoji: '🐟', proteinPer100g: 22, defaultGrams: 150, tint: '#F7DFD7', category: '水产', searchTerms: ['鲑鱼', 'salmon'], source: 'local' },
  { id: 'tuna', name: '金枪鱼', emoji: '🐟', proteinPer100g: 25, defaultGrams: 120, tint: '#E3EBEC', category: '水产', searchTerms: ['吞拿鱼', 'tuna'], source: 'local' },
  { id: 'cod', name: '鳕鱼', emoji: '🐟', proteinPer100g: 23, defaultGrams: 150, tint: '#E5ECEB', category: '水产', searchTerms: ['cod'], source: 'local' },
  { id: 'tilapia', name: '罗非鱼', emoji: '🐟', proteinPer100g: 26, defaultGrams: 150, tint: '#E5ECEB', category: '水产', searchTerms: ['tilapia'], source: 'local' },
  { id: 'shrimp', name: '虾仁', emoji: '🦐', proteinPer100g: 24, defaultGrams: 120, tint: '#F7E0D8', category: '水产', searchTerms: ['虾', 'shrimp'], source: 'local' },
  { id: 'scallop', name: '扇贝', emoji: '', proteinPer100g: 21, defaultGrams: 120, tint: '#F3E7DE', category: '水产', searchTerms: ['带子', 'scallop'], source: 'local' },
  { id: 'crab', name: '蟹肉', emoji: '🦀', proteinPer100g: 19, defaultGrams: 120, tint: '#F5E2DB', category: '水产', searchTerms: ['螃蟹', 'crab'], source: 'local' },

  { id: 'tofu', name: '豆腐', emoji: '', proteinPer100g: 8, defaultGrams: 150, tint: '#EEE9D7', category: '豆类', searchTerms: ['tofu'], source: 'local' },
  { id: 'firm-tofu', name: '老豆腐', emoji: '', proteinPer100g: 12.7, defaultGrams: 150, tint: '#EEE9D7', category: '豆类', searchTerms: ['北豆腐', 'firm tofu'], source: 'local' },
  { id: 'tempeh', name: '天贝', emoji: '', proteinPer100g: 19, defaultGrams: 100, tint: '#E9E4CE', category: '豆类', searchTerms: ['tempeh'], source: 'local' },
  { id: 'edamame', name: '毛豆', emoji: '🫛', proteinPer100g: 12, defaultGrams: 100, tint: '#E0ECD1', category: '豆类', searchTerms: ['枝豆', 'edamame'], source: 'local' },
  { id: 'lentils', name: '熟扁豆', emoji: '🫘', proteinPer100g: 9, defaultGrams: 150, tint: '#E7E3CF', category: '豆类', searchTerms: ['小扁豆', 'lentils'], source: 'local' },
  { id: 'chickpeas', name: '熟鹰嘴豆', emoji: '🫘', proteinPer100g: 8.9, defaultGrams: 150, tint: '#ECE3CA', category: '豆类', searchTerms: ['chickpeas'], source: 'local' },
  { id: 'black-beans', name: '熟黑豆', emoji: '🫘', proteinPer100g: 8.9, defaultGrams: 150, tint: '#E3E1D9', category: '豆类', searchTerms: ['black beans'], source: 'local' },

  { id: 'greek-yogurt', name: '希腊酸奶', emoji: '🥣', proteinPer100g: 10, defaultGrams: 180, tint: '#E8EEF2', category: '乳品', searchTerms: ['酸奶', 'greek yogurt'], source: 'local' },
  { id: 'yogurt', name: '原味酸奶', emoji: '🥣', proteinPer100g: 4.3, defaultGrams: 180, tint: '#E8EEF2', category: '乳品', searchTerms: ['yogurt'], source: 'local' },
  { id: 'milk', name: '牛奶', emoji: '🥛', proteinPer100g: 3.4, defaultGrams: 250, tint: '#E7EEF1', category: '乳品', searchTerms: ['milk'], source: 'local' },
  { id: 'soy-milk', name: '豆浆', emoji: '🥛', proteinPer100g: 3.3, defaultGrams: 250, tint: '#EEE9D8', category: '乳品', searchTerms: ['豆奶', 'soy milk'], source: 'local' },
  { id: 'cottage-cheese', name: '茅屋奶酪', emoji: '🧀', proteinPer100g: 11, defaultGrams: 100, tint: '#EAEFF0', category: '乳品', searchTerms: ['cottage cheese'], source: 'local' },
  { id: 'cheddar', name: '切达奶酪', emoji: '🧀', proteinPer100g: 25, defaultGrams: 30, tint: '#F4E4B8', category: '乳品', searchTerms: ['芝士', 'cheese', 'cheddar'], source: 'local' },
  { id: 'whey-protein', name: '乳清蛋白粉', emoji: '🥤', proteinPer100g: 80, defaultGrams: 30, tint: '#E5EADE', category: '乳品', searchTerms: ['蛋白粉', 'whey protein'], source: 'local' },

  { id: 'rice', name: '熟米饭', emoji: '🍚', proteinPer100g: 2.7, defaultGrams: 180, tint: '#EEEDE3', category: '主食', searchTerms: ['白饭', '大米', 'rice'], source: 'local' },
  { id: 'brown-rice', name: '熟糙米饭', emoji: '🍚', proteinPer100g: 2.6, defaultGrams: 180, tint: '#E9E2D4', category: '主食', searchTerms: ['糙米', 'brown rice'], source: 'local' },
  { id: 'oats', name: '燕麦', emoji: '🥣', proteinPer100g: 13.2, defaultGrams: 50, tint: '#EFE3CA', category: '主食', searchTerms: ['oatmeal', 'oats'], source: 'local' },
  { id: 'quinoa', name: '熟藜麦', emoji: '', proteinPer100g: 4.4, defaultGrams: 150, tint: '#EDE3CF', category: '主食', searchTerms: ['quinoa'], source: 'local' },
  { id: 'pasta', name: '熟意面', emoji: '🍝', proteinPer100g: 5.8, defaultGrams: 180, tint: '#F1E3C5', category: '主食', searchTerms: ['意大利面', 'pasta'], source: 'local' },
  { id: 'noodles', name: '熟面条', emoji: '🍜', proteinPer100g: 4.5, defaultGrams: 180, tint: '#F1E3C5', category: '主食', searchTerms: ['面', 'noodles'], source: 'local' },
  { id: 'whole-wheat-bread', name: '全麦面包', emoji: '🍞', proteinPer100g: 12, defaultGrams: 60, tint: '#EADCC6', category: '主食', searchTerms: ['面包', 'whole wheat bread'], source: 'local' },
  { id: 'sweet-potato', name: '熟红薯', emoji: '🍠', proteinPer100g: 1.6, defaultGrams: 180, tint: '#F2DEC9', category: '主食', searchTerms: ['地瓜', 'sweet potato'], source: 'local' },
  { id: 'potato', name: '熟土豆', emoji: '🥔', proteinPer100g: 1.9, defaultGrams: 180, tint: '#ECE4CF', category: '主食', searchTerms: ['马铃薯', 'potato'], source: 'local' },

  { id: 'broccoli', name: '西兰花', emoji: '🥦', proteinPer100g: 2.8, defaultGrams: 100, tint: '#DDEBD8', category: '蔬菜', searchTerms: ['花椰菜', 'broccoli'], source: 'local' },
  { id: 'spinach', name: '菠菜', emoji: '🥬', proteinPer100g: 2.9, defaultGrams: 100, tint: '#DDE9D7', category: '蔬菜', searchTerms: ['spinach'], source: 'local' },
  { id: 'kale', name: '羽衣甘蓝', emoji: '🥬', proteinPer100g: 4.3, defaultGrams: 100, tint: '#D9E7D4', category: '蔬菜', searchTerms: ['kale'], source: 'local' },
  { id: 'peas', name: '熟青豆', emoji: '🫛', proteinPer100g: 5.4, defaultGrams: 100, tint: '#E0ECD1', category: '蔬菜', searchTerms: ['豌豆', 'peas'], source: 'local' },
  { id: 'mushroom', name: '蘑菇', emoji: '🍄', proteinPer100g: 3.1, defaultGrams: 100, tint: '#E9E4DA', category: '蔬菜', searchTerms: ['香菇', 'mushroom'], source: 'local' },
  { id: 'asparagus', name: '芦笋', emoji: '', proteinPer100g: 2.2, defaultGrams: 100, tint: '#DCE9D8', category: '蔬菜', searchTerms: ['asparagus'], source: 'local' },
  { id: 'corn', name: '熟玉米', emoji: '🌽', proteinPer100g: 3.4, defaultGrams: 150, tint: '#F2E8BD', category: '蔬菜', searchTerms: ['corn'], source: 'local' },

  { id: 'peanuts', name: '花生', emoji: '🥜', proteinPer100g: 25.8, defaultGrams: 30, tint: '#EEE0C7', category: '坚果', searchTerms: ['peanut'], source: 'local' },
  { id: 'almonds', name: '杏仁', emoji: '🥜', proteinPer100g: 21.2, defaultGrams: 30, tint: '#EBDCC7', category: '坚果', searchTerms: ['almond'], source: 'local' },
  { id: 'cashews', name: '腰果', emoji: '🥜', proteinPer100g: 18.2, defaultGrams: 30, tint: '#EEE1C8', category: '坚果', searchTerms: ['cashew'], source: 'local' },
  { id: 'pumpkin-seeds', name: '南瓜籽', emoji: '', proteinPer100g: 30.2, defaultGrams: 30, tint: '#E6E3CF', category: '坚果', searchTerms: ['pumpkin seed'], source: 'local' },
];

export const FOOD_CATEGORIES = ['全部', '肉蛋', '水产', '豆类', '乳品', '主食', '蔬菜', '坚果'] as const;
