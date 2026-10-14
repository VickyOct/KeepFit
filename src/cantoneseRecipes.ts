import type { Recipe, RecipeIngredient } from './recipeTypes';
import { energyFactors as f } from './recipeEnergy';

const g = (name: string, amount: number, energy: RecipeIngredient['energy'], note?: string): RecipeIngredient => ({ name, amount, unit: '克', energy, note });
const ml = (name: string, amount: number, energy: RecipeIngredient['energy'], note?: string): RecipeIngredient => ({ name, amount, unit: '毫升', energy, note });
const egg = (amount = 100) => g('鸡蛋', amount, f.egg, `去壳生重；1 人份约 ${amount / 50} 个`);
const oil = (amount = 10) => g('食用油', amount, f.oil, '包括炒制和腌料中的总量');
const soy = (amount = 10) => ml('生抽', amount, f.soy);
const water = (amount = 30) => ml('水', amount, f.zero);
const rice = () => g('白米饭', 200, f.rice, '熟重；提前煮好');
const woks = (title: string, slug: string) => ({ publisher: 'The Woks of Life', title, url: `https://thewoksoflife.com/${slug}/` });
const lau = (title: string, slug: string) => ({ publisher: 'Made With Lau', title, url: `https://www.madewithlau.com/recipes/${slug}` });
const side = (label: string) => ({ label, includes: '仅这碟菜及所列调味料，不含米饭、其他配菜或饮品。另配 200 克熟白饭约加 260 千卡。' });

export const cantoneseRecipes: Recipe[] = [
  {
    id: 'hk-eggs-toast', collection: '港式菜单', name: '港式炒蛋多士', emoji: '🍳', meal: '早餐', cuisine: '茶餐厅', minutes: 10, flavor: '牛油蛋香 · 基础早餐',
    ingredients: [g('白面包', 70, f.bread, '烘烤前约 2 片'), egg(), g('牛油', 10, f.butter), ml('全脂牛奶', 20, f.milk), g('盐', 0.5, f.zero)],
    steps: ['面包烘到表面微脆；鸡蛋加牛奶与盐打散。', '小火融化牛油，倒蛋液，用铲子轻轻推拢。', '炒到蛋液凝固即离火，和多士一起上桌。'],
    portionTip: '1 份是两片面包和两只蛋；果酱、饮品另计。',
    adaptation: '参考粤式炒蛋的推拢手法，简化调味，改用牛油和少量牛奶，配多士。', allergens: ['鸡蛋', '牛奶', '小麦'], searchTerms: ['炒蛋吐司', '早餐A餐'],
    energyPortion: { label: '1 份：2 片多士＋2 只炒蛋', includes: '包含 10 克牛油；不含果酱和饮品。' },
    source: lau('Scrambled Eggs · 炒鸡蛋', 'scrambled-eggs'),
  },
  {
    id: 'hk-ham-macaroni', collection: '港式菜单', name: '火腿通粉', emoji: '🍲', meal: '早餐', cuisine: '茶餐厅', minutes: 20, flavor: '清汤咸鲜 · 一锅早餐',
    ingredients: [g('通心粉', 70, f.pasta, '干重'), g('火腿', 50, f.ham), g('熟玉米粒', 30, f.corn), g('青豆', 30, f.peas), ml('清鸡汤', 200, f.stock), water(200), oil(2)],
    steps: ['通心粉按包装煮熟沥干，火腿切条。', '另锅加鸡汤与水，煮熟青豆、玉米。', '加入通粉、火腿和油，重新煮滚，尝味后盛碗。'],
    portionTip: '汤按全部饮用估算；早餐套餐另加的煎蛋、多士和奶茶不在本碗内。',
    adaptation: '参考基丝汀火腿通粉，改为一人份，保留青豆玉米，简化调味。', allergens: ['小麦', '鸡汤或火腿中的过敏原以包装为准'], searchTerms: ['通心粉', '火腿汤通粉'],
    energyPortion: { label: '1 碗：70 克干通粉＋50 克火腿', includes: '包含玉米、青豆和整碗汤；不含煎蛋、多士和饮品。' },
    source: { publisher: '基丝汀 · 简易食谱', title: '火腿通粉', url: 'https://www.christinesrecipes.com/2010/12/macaroni-soup-with-ham.html' },
  },
  {
    id: 'hk-spam-egg-noodles', collection: '港式菜单', name: '餐蛋面', emoji: '🍜', meal: '早餐', cuisine: '茶餐厅', minutes: 15, flavor: '午餐肉煎蛋 · 经典汤面',
    ingredients: [g('油炸方便面及粉包', 85, f.instantNoodles, '干重；不另加液体油包'), g('午餐肉', 60, f.luncheon), egg(50), oil(5), g('葱', 5, f.aromatics), water(450)],
    steps: ['午餐肉切片，用部分油煎到两面略上色。', '余油煎熟鸡蛋。', '面与粉包按包装说明煮熟，加午餐肉、煎蛋和葱花。'],
    portionTip: '不同牌子的面饼差异较大；额外油包需要另外算热量。',
    adaptation: '参考 SPAM 餐肉煎蛋汤面的组合，改为一人一包面的茶餐厅常见份量。', allergens: ['鸡蛋', '小麦', '可能含大豆或奶（方便面）'], searchTerms: ['公仔面', '餐肉蛋面'],
    energyPortion: { label: '1 碗：85 克干面＋60 克餐肉＋1 只蛋', includes: '包含粉包、煎油和汤；不含额外油包、配餐和饮品。' },
    source: { publisher: 'SPAM 官方食谱', title: 'SPAM Classic and Beef Ramen', url: 'https://www.spam.com/recipes/spam-classic-and-beef-ramen' },
  },
  {
    id: 'hk-tuna-sandwich', collection: '港式菜单', name: '吞拿鱼三文治', emoji: '🥪', meal: '早餐', cuisine: '茶餐厅', minutes: 10, flavor: '沙律酱鲜香 · 基础三文治',
    ingredients: [g('白面包', 70, f.bread, '约 2 片'), g('水浸吞拿鱼', 80, f.tuna, '沥干重'), g('普通蛋黄酱', 20, f.mayo), g('熟玉米粒', 30, f.corn), g('黄瓜', 40, f.greens)],
    steps: ['鱼肉和玉米沥干；黄瓜洗净切片。', '鱼肉、玉米与蛋黄酱拌匀。', '夹进两片面包，可烘底。做好即食，提前做请及时冷藏。'],
    portionTip: '这里用普通蛋黄酱和白面包；没有换成减脂酱。',
    adaptation: '参考吞拿鱼玉米三明治组合，使用茶餐厅常见白面包、普通沙律酱并重新设定用量。', allergens: ['鱼', '鸡蛋', '小麦', '可能含大豆或芥末（酱料）'], searchTerms: ['金枪鱼', '吞拿魚', '三明治', 'tuna'],
    energyPortion: { label: '1 份：2 片面包夹馅', includes: '包含 20 克普通蛋黄酱；不含薯条与饮品。' },
    source: { publisher: 'NHS · Healthier Families', title: 'Tuna mayonnaise and sweetcorn sandwich', url: 'https://www.nhs.uk/healthier-families/recipes/tuna-mayonnaise-and-sweetcorn-sandwich/' },
  },
  {
    id: 'hk-beef-chow-fun', collection: '港式菜单', name: '干炒牛河', emoji: '🍝', meal: '午餐', cuisine: '茶餐厅', minutes: 25, flavor: '豉油葱香 · 家常炒粉',
    ingredients: [g('鲜河粉', 250, f.riceNoodles, '即用鲜湿重；不是 250 克干粉'), g('瘦牛肉片', 100, f.beef, '生重'), g('豆芽', 80, f.sprouts), g('洋葱', 40, f.onion), g('葱', 15, f.aromatics), oil(20), soy(15), ml('老抽', 5, f.soy), g('糖', 3, f.sugar), g('玉米淀粉', 3, f.starch), water(20)],
    steps: ['牛肉用一部分生抽、淀粉和水拌匀；河粉轻轻拆散，蔬菜洗切。', '一半油炒熟牛肉盛出，余油炒洋葱、河粉和豆芽。', '倒入生抽、老抽和糖，回锅牛肉、加葱翻匀，炒至全部热透。'],
    portionTip: '这里是一人家常碟；外卖大碟的河粉和油量常常不同。',
    adaptation: '参考粤式干炒牛河，采用家庭炉具分批炒制，省去料酒与嫩肉小苏打；不是餐厅大碟份量。', allergens: ['大豆', '小麦（酱油）'], searchTerms: ['乾炒牛河', '牛肉河粉'],
    energyPortion: { label: '1 碟：250 克鲜河粉＋100 克牛肉', includes: '包含 20 克炒油和全部酱料；不含饮品。鲜河粉含水与含油量是主要误差来源。' },
    source: lau('Beef Chow Fun · 干炒牛河', 'beef-chow-fun'),
  },
  {
    id: 'hk-soy-chow-mein', collection: '港式菜单', name: '豉油皇炒面', emoji: '🍜', meal: '午餐', cuisine: '茶餐厅', minutes: 25, flavor: '豉油豆芽香 · 基础炒面',
    ingredients: [g('干蛋面', 80, f.eggNoodles, '干重；煮熟后再炒'), g('豆芽', 100, f.sprouts), g('洋葱', 40, f.onion), g('葱', 15, f.aromatics), oil(15), soy(10), ml('老抽', 5, f.soy), g('蚝油', 5, f.oyster), g('糖', 3, f.sugar), water(15)],
    steps: ['蛋面按包装煮至刚熟，沥干散开；豆芽和葱洗净，洋葱切丝。', '酱油、蚝油、糖与水拌匀。用部分油炒洋葱，余油把面煎香。', '加入豆芽、葱和酱汁翻炒，炒到豆芽熟、面条热透。'],
    portionTip: '这是一碟不加肉的炒面；蚝油含贝类，不默认是素食。',
    adaptation: '参考 Made With Lau 豉油王炒面，选择干面以便称量，简化家庭炒制步骤。', allergens: ['小麦', '鸡蛋', '大豆', '贝类（蚝油）'], searchTerms: ['豉油王炒面', '豉油皇炒麵'],
    energyPortion: { label: '1 碟：80 克干面及配菜', includes: '包含 15 克油和全部酱料；不含肉类、其他配餐或饮品。' },
    source: lau('Cantonese Chow Mein · 豉油王炒面', 'cantonese-chow-mein'),
  },
  {
    id: 'cantonese-tomato-eggs-rice', collection: '港式菜单', name: '番茄炒蛋饭', emoji: '🍅', meal: '午餐', cuisine: '粤菜', minutes: 15, timeNote: '已有熟饭；煮饭时间另计', flavor: '家常酸甜 · 基础碟头饭',
    ingredients: [rice(), egg(), g('番茄', 250, f.tomato), g('葱', 5, f.aromatics), oil(12), g('糖', 5, f.sugar), g('盐', 0.5, f.zero), water(30)],
    steps: ['鸡蛋打散，番茄切块，米饭热透。', '用一部分油炒熟蛋盛起，余油炒番茄。', '加水、糖和盐焖出汁，回锅鸡蛋拌匀撒葱，配饭。'],
    portionTip: '饭已计入；这道跨地区家常菜也常见于粤式家庭餐桌。',
    adaptation: '参考番茄炒蛋，以普通油糖用量整理成一人碟头饭，不按减脂配方改写。', allergens: ['鸡蛋'], searchTerms: ['西红柿', '茄蛋飯'],
    energyPortion: { label: '1 份：炒蛋菜＋200 克熟白饭', includes: '包含 2 只蛋、12 克油、5 克糖与白饭；不含饮品。' },
    source: woks('Chinese Tomato Egg Stir-fry', 'stir-fried-tomato-and-egg'),
  },
  {
    id: 'cantonese-chicken-rice', collection: '港式菜单', name: '冬菇蒸鸡饭', emoji: '🍄', meal: '午餐', cuisine: '粤菜', minutes: 30, timeNote: '已有熟饭；干冬菇须提前泡软，泡发时间另计', flavor: '冬菇姜葱香 · 家庭蒸菜',
    ingredients: [rice(), g('去皮去骨鸡腿肉', 160, f.chicken, '生重'), g('冬菇', 60, f.mushroom, '泡发沥干重；热量以鲜香菇近似'), g('姜葱', 10, f.aromatics), oil(8), soy(), g('蚝油', 5, f.oyster), g('玉米淀粉', 4, f.starch), g('糖', 2, f.sugar), water(20)],
    steps: ['鸡肉切小块，与调味料、淀粉、油和水拌匀；冬菇切片。', '鸡肉、冬菇和姜单层铺浅盘，水开后蒸约 15–20 分钟，至鸡肉熟透。', '撒葱，配热饭。多份请分盘蒸，按实际熟度调整。'],
    portionTip: '带皮鸡肉或加腊肠的版本需另算；本份饭量为熟重 200 克。',
    adaptation: '参考冬菇蒸鸡的粤式做法，省去黄花菜、木耳和料酒，使用去骨鸡肉方便在家做。', allergens: ['大豆', '小麦（酱油）', '贝类（蚝油）'], searchTerms: ['香菇蒸鸡', '冬菇蒸雞'],
    energyPortion: { label: '1 份：冬菇鸡肉＋200 克熟白饭', includes: '包含油、酱汁与饭；未加腊肠，鸡肉按去皮重量。' },
    source: woks('Steamed Chicken with Mushrooms & Dried Lily Flowers', 'steamed-chicken-mushrooms-dried-lily-flowers'),
  },
  {
    id: 'cantonese-steamed-eggs', collection: '港式菜单', name: '家常蒸水蛋', emoji: '🥚', meal: '晚餐', cuisine: '粤菜', minutes: 20, flavor: '嫩滑咸香 · 基础蒸菜',
    ingredients: [egg(), water(150), soy(5), oil(3), g('葱', 5, f.aromatics)],
    steps: ['鸡蛋加水打散，过筛或撇去浮沫，倒入浅碗。', '盖上耐热碟，水开后中小火蒸约 12–15 分钟，到中心凝固；碗深会更久。', '淋生抽、油，撒葱花。'],
    portionTip: '1 份为两只蛋做的小碗，属于一道菜。',
    adaptation: '参考基础蒸蛋，使用清水，调整为两只蛋一碗，简化家庭蒸制。', allergens: ['鸡蛋', '大豆', '小麦（生抽）'], searchTerms: ['蒸蛋', '水蒸蛋'],
    energyPortion: side('1 小碗：2 只蛋'), source: woks('Steamed Eggs', 'steamed-egg'),
  },
  {
    id: 'cantonese-steamed-fish', collection: '港式菜单', name: '姜葱清蒸鱼柳', emoji: '🐟', meal: '晚餐', cuisine: '粤菜', minutes: 25, flavor: '姜葱豉油 · 家庭蒸鱼',
    ingredients: [g('白肉鱼柳', 180, f.fish, '无骨生重；如鳕鱼'), g('姜葱', 15, f.aromatics), soy(10), oil(10), g('糖', 2, f.sugar), water(15)],
    steps: ['鱼柳检查残刺，铺姜丝，放浅盘。', '水开后蒸约 10–15 分钟，按厚度调整至中心熟透，撒葱丝。', '小锅将油、酱油、糖和水加热拌匀，淋在鱼上。'],
    portionTip: '整条带骨鱼不能按这里的 180 克套算；按吃下的鱼肉称量。',
    adaptation: '参考粤式蒸鱼，以无骨白肉鱼柳代替整鱼，保留姜葱、油与豉油汁。', allergens: ['鱼', '大豆', '小麦（生抽）'], searchTerms: ['清蒸鳕鱼', '清蒸魚'],
    energyPortion: side('1 小碟：180 克无骨鱼肉'), source: lau('Steamed Fish · 蒸鱼', 'steamed-fish'),
  },
  {
    id: 'cantonese-shrimp-eggs', collection: '港式菜单', name: '虾仁炒蛋', emoji: '🦐', meal: '晚餐', cuisine: '粤菜', minutes: 15, timeNote: '虾仁已解冻，解冻时间另计', flavor: '鲜虾滑蛋 · 基础小炒',
    ingredients: [g('虾仁', 100, f.shrimp, '去壳沥干生重'), egg(), oil(10), g('葱', 5, f.aromatics), g('盐', 0.5, f.zero)],
    steps: ['虾仁检查虾线并沥干；鸡蛋加盐打散。', '部分油炒虾仁至熟，盛出。', '余油炒蛋至凝固，回锅虾仁轻拌，加葱花，全部热透即可。'],
    portionTip: '配白饭吃时另加饭的热量；不要把这碟菜误当成一整份虾仁蛋饭。',
    adaptation: '参考粤式虾仁炒蛋，简化为虾、蛋、葱和盐的基础家庭版，重新设定一小碟用量。', allergens: ['虾', '鸡蛋'], searchTerms: ['滑蛋虾仁', '蝦仁炒蛋'],
    energyPortion: side('1 小碟：100 克虾仁＋2 只蛋'), source: woks('Stir-fried Shrimp and Eggs', 'stir-fried-shrimp-eggs'),
  },
  {
    id: 'cantonese-pork-patty', collection: '港式菜单', name: '榨菜蒸肉饼', emoji: '🥢', meal: '晚餐', cuisine: '粤菜', minutes: 30, flavor: '榨菜咸香 · 家常下饭菜',
    ingredients: [g('猪肉末', 120, f.pork, '生重；普通带肥肉版本'), g('榨菜', 20, f.mustard), g('荸荠', 40, f.chestnut, '去皮重'), g('葱', 5, f.aromatics), g('蚝油', 8, f.oyster), g('糖', 2, f.sugar), g('玉米淀粉', 4, f.starch), oil(5), water(20)],
    steps: ['榨菜、荸荠切碎，与猪肉末、调味料、水和大部分油搅匀。', '浅盘抹剩余油，肉馅铺薄，勿堆成厚团。', '水开后蒸约 18–20 分钟到中心熟透，撒葱。多份分盘蒸。'],
    portionTip: '肉末肥瘦是主要热量变量；表中按普通肉末估算。',
    adaptation: '参考 Made With Lau 榨菜蒸肉饼，重新设定小碟用量，省去鸡粉和白胡椒。', allergens: ['贝类（蚝油）', '可能含大豆或小麦（调味料）'], searchTerms: ['蒸肉餅', '马蹄蒸肉饼'],
    energyPortion: side('1 小碟：120 克猪肉末及配料'), source: lau('Steamed Pork Patty · 榨菜蒸猪肉饼', 'steamed-pork-patty'),
  },
];
