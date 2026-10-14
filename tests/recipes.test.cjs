const assert = require('node:assert/strict');
const test = require('node:test');
const React = require('react');
const { create, act } = require('react-test-renderer');
const { createLoader } = require('./load-workout-ui.cjs');
global.IS_REACT_ACT_ENVIRONMENT = true;

const textOf = (node) => typeof node === 'string' ? node : (node.children ?? []).map(textOf).join('');
const button = (tree, label) => tree.root.findAllByType('Pressable').find((node) => node.props.accessibilityLabel === label || textOf(node) === label);
async function press(tree, label) {
  const node = button(tree, label);
  assert.ok(node, `Missing button: ${label}`);
  assert.ok(!node.props.disabled, `Disabled button: ${label}`);
  await act(async () => { node.props.onPress(); });
}
function memoryStorage() {
  const values = new Map();
  return { values, getItem: async (key) => values.get(key) ?? null, setItem: async (key, value) => { values.set(key, value); } };
}
async function renderScreen(loader, collection = '原有食谱') {
  const Screen = loader.load('src/components/RecipeScreen.tsx').RecipeScreen;
  let tree;
  await act(async () => { tree = create(React.createElement(Screen)); });
  if (collection === '原有食谱') await press(tree, '原有食谱');
  return tree;
}

test('collection covers three meals, prioritizes Chinese dishes, and exposes provenance for every adaptation', () => {
  const { previousRecipes: recipes } = createLoader().load('src/recipes.ts');
  assert.equal(recipes.length, 15);
  assert.equal(new Set(recipes.map((r) => r.id)).size, recipes.length);
  for (const meal of ['早餐', '午餐', '晚餐']) assert.equal(recipes.filter((r) => r.meal === meal).length, 5);
  assert.equal(recipes.filter((r) => r.cuisine === '中式家常').length, 12);
  for (const r of recipes) {
    assert.ok(r.source.title && r.source.publisher && r.adaptation && r.portionTip, r.id);
    assert.equal(new URL(r.source.url).protocol, 'https:');
    assert.ok(r.steps.length >= 3 && r.ingredients.length >= 5 && r.allergens.length, r.id);
    assert.equal(new Set(r.ingredients.map((i) => i.name)).size, r.ingredients.length);
    for (const ingredient of r.ingredients) assert.ok(Number.isFinite(ingredient.amount) && ingredient.amount > 0, r.id);
    // Changed recipes must not accidentally inherit source calorie claims.
    assert.equal(r.calories, undefined);
  }
});

test('Cantonese menu has complete energy coverage without confusing dry, cooked and side-dish portions', () => {
  const loader = createLoader();
  const { recipes } = loader.load('src/recipes.ts');
  const { cantoneseRecipes } = loader.load('src/cantoneseRecipes.ts');
  const { recipeEnergy } = loader.load('src/recipeEnergy.ts');
  assert.equal(new Set(recipes.map((r) => r.id)).size, recipes.length);
  assert.equal(cantoneseRecipes.length, 12);
  assert.equal(cantoneseRecipes.filter((r) => r.cuisine === '粤菜').length, 6);
  assert.equal(cantoneseRecipes.filter((r) => r.cuisine === '茶餐厅').length, 6);
  for (const recipe of cantoneseRecipes) {
    assert.ok(recipe.energyPortion.label && recipe.energyPortion.includes);
    assert.ok(recipeEnergy(recipe).perServing > 0);
    for (const item of recipe.ingredients) {
      assert.ok(item.amount > 0 && Number.isFinite(item.energy.kcalPer100));
      assert.ok(item.energy.basis);
      if (item.energy.sourceUrl) assert.equal(new URL(item.energy.sourceUrl).hostname, 'fdc.nal.usda.gov');
    }
  }
  const egg = cantoneseRecipes.find((r) => r.id === 'cantonese-steamed-eggs');
  assert.ok(egg.energyPortion.includes.includes('不含米饭'));
  const rice = cantoneseRecipes.find((r) => r.id === 'cantonese-tomato-eggs-rice');
  assert.ok(rice.ingredients.find((i) => i.name === '白米饭').note.includes('熟重'));
  const noodles = cantoneseRecipes.find((r) => r.id === 'hk-beef-chow-fun');
  assert.ok(noodles.ingredients[0].note.includes('不是 250 克干粉'));
});

test('calorie sum includes oil and scales total before rounding; unknown energy is not zero', () => {
  const loader = createLoader();
  const { recipeEnergy } = loader.load('src/recipeEnergy.ts');
  const { cantoneseRecipes } = loader.load('src/cantoneseRecipes.ts');
  const toast = cantoneseRecipes.find((r) => r.id === 'hk-eggs-toast');
  const result = recipeEnergy(toast, 2);
  // Bread 186.2 + eggs 143 + butter 71.7 + milk 12.2 = 413.1 per serving.
  assert.equal(result.perServing, 410);
  assert.equal(result.total, 830);
  assert.ok(result.items.some((i) => i.name === '牛油' && Math.abs(i.kcal - 71.7) < 0.001));
  assert.equal(recipeEnergy({ ingredients: [], energyPortion: undefined }), null);
  assert.equal(recipeEnergy({ ...toast, ingredients: [{ name: '未知食材', amount: 100 }] }), null);
});

test('menu is the default, cuisine filters combine, and calories keep per-serving and total labels separate', async () => {
  const loader = createLoader({ 'expo-sqlite/kv-store': memoryStorage() });
  const tree = await renderScreen(loader, '港式菜单');
  try {
    assert.ok(textOf(tree.root).includes('粤菜与茶餐厅'));
    assert.equal(button(tree, '查看香蕉牛奶燕麦粥'), undefined);
    assert.ok(button(tree, '查看港式炒蛋多士'));
    await press(tree, '粤菜');
    assert.equal(button(tree, '查看港式炒蛋多士'), undefined);
    await press(tree, '晚餐');
    await press(tree, '查看家常蒸水蛋');
    assert.ok(textOf(tree.root.findByType('Modal')).includes('不含米饭'));
    await press(tree, '返回食谱列表');
    await press(tree, '粤菜与茶餐厅菜单');
    await press(tree, '查看港式炒蛋多士');
    await press(tree, '2 人份');
    let detail = textOf(tree.root.findByType('Modal'));
    assert.ok(detail.includes('约 410 千卡 / 份'));
    assert.ok(detail.includes('2 份合计约 830 千卡'));
    await press(tree, '查看热量估算明细');
    detail = textOf(tree.root.findByType('Modal'));
    assert.ok(detail.includes('牛油 · 约 72 千卡'));
    assert.ok(button(tree, '查看牛油热量来源'));
    await press(tree, '返回食谱列表');
    await press(tree, '原有食谱');
    assert.ok(button(tree, '查看香蕉牛奶燕麦粥'));
    assert.equal(button(tree, '查看港式炒蛋多士'), undefined);
  } finally { await act(async () => { tree.unmount(); }); }
});

test('meal, cuisine, quick, ingredient aliases and favorites are conjunctive filters', () => {
  const loader = createLoader();
  const { recipes } = loader.load('src/recipes.ts');
  const { filterRecipes } = loader.load('src/recipeUtils.ts');
  const filters = { meal: '早餐', cuisine: '熟悉的西式', query: '  金枪鱼  ', quickOnly: true, favoritesOnly: true };
  assert.deepEqual(filterRecipes(recipes, filters, ['tuna-sandwich']).map((r) => r.id), ['tuna-sandwich']);
  assert.equal(filterRecipes(recipes, { ...filters, meal: '晚餐' }, ['tuna-sandwich']).length, 0);
  assert.equal(filterRecipes(recipes, filters, []).length, 0);
  const ingredientSearch = { ...filters, meal: '全部', cuisine: '全部口味', query: '鸡肉 青菜', quickOnly: false, favoritesOnly: false };
  assert.ok(filterRecipes(recipes, ingredientSearch, []).some((r) => r.id === 'chicken-congee'));
});

test('ingredient quantities scale from one serving without floating point noise', () => {
  const { ingredientQuantity } = createLoader().load('src/recipeUtils.ts');
  assert.equal(ingredientQuantity({ amount: 80, unit: '克' }, 2), '160 克');
  assert.equal(ingredientQuantity({ amount: 0.3, unit: '克' }, 4), '1.2 克');
  assert.equal(ingredientQuantity({ amount: 200, unit: '毫升' }, 1), '200 毫升');
});

test('favorite writes serialize, survive remounts and remain intact after a failed write', async () => {
  const memory = memoryStorage();
  const loader = createLoader({ 'expo-sqlite/kv-store': memory });
  const storage = loader.load('src/recipeStorage.ts');
  await Promise.all([storage.toggleRecipeFavorite('tuna-sandwich'), storage.toggleRecipeFavorite('banana-oats')]);
  assert.deepEqual(await storage.loadRecipeFavorites(), ['tuna-sandwich', 'banana-oats']);
  const save = memory.setItem;
  memory.setItem = async () => { throw new Error('disk full'); };
  await assert.rejects(storage.toggleRecipeFavorite('tuna-sandwich'), /disk full/);
  assert.deepEqual(await storage.loadRecipeFavorites(), ['tuna-sandwich', 'banana-oats']);
  memory.setItem = save;
  await storage.toggleRecipeFavorite('tuna-sandwich');
  const fresh = createLoader({ 'expo-sqlite/kv-store': memory }).load('src/recipeStorage.ts');
  assert.deepEqual(await fresh.loadRecipeFavorites(), ['banana-oats']);
});

test('unreadable favorites cannot be silently overwritten', async () => {
  const memory = memoryStorage();
  memory.values.set('keepfit.recipe-favorites.v1', '{broken');
  const storage = createLoader({ 'expo-sqlite/kv-store': memory }).load('src/recipeStorage.ts');
  await assert.rejects(storage.loadRecipeFavorites());
  await assert.rejects(storage.toggleRecipeFavorite('tuna-sandwich'));
  assert.equal(memory.values.get('keepfit.recipe-favorites.v1'), '{broken');
});

test('UI filters, opens a sourced detail, scales ingredients, preserves filters and recovers an empty result', async () => {
  const loader = createLoader({ 'expo-sqlite/kv-store': memoryStorage() });
  const opened = [];
  loader.native.Linking.openURL = async (url) => { opened.push(url); };
  const tree = await renderScreen(loader);
  try {
    await press(tree, '早餐');
    await press(tree, '熟悉的西式');
    await act(async () => { tree.root.findByType('TextInput').props.onChangeText('金枪鱼'); });
    await press(tree, '查看吞拿鱼玉米全麦三明治');
    await press(tree, '2 人份');
    const modal = tree.root.findByType('Modal');
    assert.ok(textOf(modal).includes('160 克'));
    assert.ok(textOf(modal).includes('未做营养核算'));
    await press(tree, '查看原始食谱');
    assert.deepEqual(opened, ['https://www.nhs.uk/healthier-families/recipes/tuna-mayonnaise-and-sweetcorn-sandwich/']);
    loader.native.Linking.openURL = async () => { throw new Error('offline'); };
    await press(tree, '查看原始食谱');
    assert.equal(loader.alerts.at(-1)[0], '暂时无法打开来源');
    await act(async () => { modal.props.onRequestClose(); });
    assert.equal(tree.root.findByType('TextInput').props.value, '金枪鱼');
    await press(tree, '晚餐');
    assert.ok(textOf(tree.root).includes('暂时没有匹配的食谱'));
    await press(tree, '查看全部食谱');
    assert.ok(button(tree, '查看姜丝鸡肉青菜粥'));
  } finally { await act(async () => { tree.unmount(); }); }
});

test('favorite UI commits only after successful storage and persists across screen mounts', async () => {
  const memory = memoryStorage();
  const loader = createLoader({ 'expo-sqlite/kv-store': memory });
  let tree = await renderScreen(loader);
  const label = '吞拿鱼玉米全麦三明治';
  try {
    memory.setItem = async () => { throw new Error('disk full'); };
    await press(tree, `收藏${label}`);
    assert.ok(button(tree, `收藏${label}`));
    assert.equal(loader.alerts.at(-1)[0], '收藏未保存');
    let release;
    memory.setItem = (key, value) => new Promise((resolve) => { release = () => { memory.values.set(key, value); resolve(); }; });
    await press(tree, `收藏${label}`);
    assert.equal(button(tree, `收藏${label}`).props.disabled, true);
    await act(async () => { release(); });
    assert.ok(button(tree, `取消收藏${label}`));
    await act(async () => { tree.unmount(); });
    tree = await renderScreen(loader);
    await press(tree, '我的收藏 · 1');
    assert.ok(button(tree, `查看${label}`));
    assert.equal(button(tree, '查看少油番茄炒蛋饭'), undefined);
  } finally { await act(async () => { tree.unmount(); }); }
});

test('favorite load errors disable mutations but allow browsing and retry', async () => {
  const memory = memoryStorage();
  const read = memory.getItem;
  memory.getItem = async () => { throw new Error('unavailable'); };
  const loader = createLoader({ 'expo-sqlite/kv-store': memory });
  const tree = await renderScreen(loader);
  try {
    assert.ok(button(tree, '查看少油番茄炒蛋饭'));
    assert.equal(button(tree, '收藏少油番茄炒蛋饭').props.disabled, true);
    memory.getItem = read;
    await press(tree, '重新读取收藏');
    assert.equal(button(tree, '收藏少油番茄炒蛋饭').props.disabled, false);
  } finally { await act(async () => { tree.unmount(); }); }
});

test('bottom navigation reaches recipes and returns to existing screens', async () => {
  const overrides = {
    'expo-image-picker': {}, 'expo-status-bar': { StatusBar: 'StatusBar' },
    './src/services/notifications': { setupDailyMealReminders: async () => 'scheduled' },
    './src/storage': { loadAppState: async () => ({ meals: [], proteinTarget: 120 }) },
    './src/workoutStorage': { loadWorkoutState: async () => ({ records: [], draft: null }) },
  };
  for (const name of ['CaptureModal', 'HistoryScreen', 'HomeScreen', 'ReviewScreen', 'RecipeScreen', 'RefereeScreen', 'TargetModal', 'WorkoutScreen']) overrides[`./src/components/${name}`] = { [name]: name };
  const App = createLoader(overrides).load('App.tsx').default;
  let tree;
  await act(async () => { tree = create(React.createElement(App)); });
  try {
    await press(tree, '食谱');
    assert.ok(tree.root.findByType('RecipeScreen'));
    assert.equal(button(tree, '食谱').props.accessibilityState.selected, true);
    await press(tree, '篮球裁判学习');
    assert.ok(tree.root.findByType('RefereeScreen'));
    assert.equal(button(tree, '篮球裁判学习').props.accessibilityState.selected, true);
    await press(tree, '≡饮食历史');
    assert.ok(tree.root.findByType('HistoryScreen'));
    await press(tree, '健身');
    assert.ok(tree.root.findByType('WorkoutScreen'));
  } finally { await act(async () => { tree.unmount(); }); }
});
