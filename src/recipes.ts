import type { Recipe, RecipeIngredient } from './recipeTypes';
import { cantoneseRecipes } from './cantoneseRecipes';

export const RECIPE_REVIEWED_ON = '2026-09-28';
export const RECIPE_GUIDE_URL = 'https://www.nhs.uk/better-health/lose-weight/healthy-eating-when-trying-to-lose-weight/';
export const RECIPE_PORTION_NOTE = '用量为成人一人份的搭配起点，可按食量和活动量调整。减脂取决于长期总摄入与消耗，不是某一道菜的效果。';
export const RECIPE_NUTRITION_NOTE = '这是 KeepFit 的份量改编版，未做营养核算；不沿用原食谱的热量或蛋白质数值。需要记录时，请按实际食材、品牌和吃下的份量填写。';

const g = (name: string, amount: number, note?: string): RecipeIngredient => ({ name, amount, unit: '克', note });
const ml = (name: string, amount: number, note?: string): RecipeIngredient => ({ name, amount, unit: '毫升', note });
const rice = () => g('杂粮饭或米饭', 150, '熟重；提前煮好');
const soy = () => ml('减盐生抽', 5, '仍含盐；不另外加盐');
const oil = (amount = 5) => g('食用油', amount, '整份总用量');
const woks = (title: string, slug: string) => ({ publisher: 'The Woks of Life', title, url: `https://thewoksoflife.com/${slug}/` });
const nhs = (title: string, slug: string) => ({ publisher: 'NHS · Healthier Families', title, url: `https://www.nhs.uk/healthier-families/recipes/${slug}/` });

// Independently written portion adaptations, not translations of the source recipes.
// All weights are for one serving; provenance and changes remain visible in the UI.
export const previousRecipes: Recipe[] = [
  {
    id: 'tomato-egg-noodles', name: '番茄鸡蛋青菜汤面', emoji: '🍜', meal: '早餐', cuisine: '中式家常', flavor: '番茄鲜香 · 不辣', minutes: 20,
    ingredients: [g('挂面', 60, '干重'), g('鸡蛋', 100, '去壳约 2 个'), g('番茄', 200), g('小白菜', 100), g('葱', 5), g('蒜', 3), oil(3), soy(), ml('水', 450)],
    steps: ['洗切番茄和青菜，打散鸡蛋；挂面按包装煮熟捞出。', '锅中放全部油，炒香葱蒜和番茄，加水煮到番茄软烂。', '加入青菜和生抽，淋入蛋液，煮至蛋花完全凝固，再放面条煮热。'],
    portionTip: '面条按干重称量；鸡蛋和青菜一起吃，不只喝汤。',
    adaptation: '参考番茄蛋花汤面，减少用油，增加鸡蛋与青菜，清水替代高汤。', allergens: ['鸡蛋', '小麦', '大豆（生抽）'], searchTerms: ['西红柿', '面条'],
    source: woks('Tomato Egg Drop Noodle Soup', 'tomato-egg-drop-noodle-soup'),
  },
  {
    id: 'chicken-congee', name: '姜丝鸡肉青菜粥', emoji: '🥣', meal: '早餐', cuisine: '中式家常', flavor: '姜葱清香 · 不辣', minutes: 45,
    ingredients: [g('大米', 50, '生米干重'), g('去皮鸡胸肉', 100, '生重'), g('小白菜', 150), g('姜', 5), g('葱', 5), g('玉米淀粉', 3), soy(), ml('水', 650)],
    steps: ['大米淘洗后加水煮开，转小火煮约 30 分钟，间歇搅动防粘底。', '鸡肉切薄片，用生抽、淀粉和少许配方中的水拌匀；青菜切碎。', '粥底变稠后下姜丝、鸡肉，拨散煮熟，再下青菜煮软，撒葱。鸡肉中心需熟透。'],
    portionTip: '保留鸡肉和菜的份量；粥水多不代表营养足，按米的干重备餐。',
    adaptation: '参考粤式鸡粥，省去鸡粉与腌肉油，补充青菜；份量重新设计。', allergens: ['大豆（生抽）', '小麦（部分生抽）'],
    source: { publisher: 'Made With Lau', title: 'Chicken Congee · 鷄粥', url: 'https://www.madewithlau.com/recipes/chicken-congee' },
  },
  {
    id: 'savory-egg-oats', name: '青菜鸡蛋咸燕麦', emoji: '🥬', meal: '早餐', cuisine: '中式家常', flavor: '葱香咸口 · 不辣', minutes: 15,
    ingredients: [g('原味燕麦片', 45, '干重；非甜味冲饮粉'), g('鸡蛋', 100, '去壳约 2 个'), g('菠菜', 150), g('葱', 5), soy(), ml('水', 300)],
    steps: ['菠菜洗净切段；燕麦加水煮开，按包装说明煮软。', '把菠菜和打散的鸡蛋加入燕麦，搅拌煮至蛋液完全凝固。', '加生抽、葱花拌匀，稠度可用少量热水调整。'],
    portionTip: '不额外淋辣椒油；想吃辣可少量加干辣椒粉。',
    adaptation: '参考中式咸燕麦，改用清水和熟蛋花，加菠菜，省去油炸葱与辣椒油。', allergens: ['鸡蛋', '大豆（生抽）', '可能含麸质（燕麦及生抽）'],
    source: { publisher: "Omnivore’s Cookbook · Maggie Zhu", title: '5-Ingredient Savory Oatmeal (Chinese-Style)', url: 'https://omnivorescookbook.com/savory-oatmeal/' },
  },
  {
    id: 'tuna-sandwich', name: '吞拿鱼玉米全麦三明治', emoji: '🥪', meal: '早餐', cuisine: '熟悉的西式', flavor: '玉米鲜甜 · 不辣', minutes: 10,
    ingredients: [g('全麦面包', 70, '约 2 片；按包装称重'), g('水浸吞拿鱼罐头', 80, '沥干重'), g('熟玉米粒', 40), g('减脂蛋黄酱', 10, '按品牌包装选择'), g('黄瓜', 100), g('黑胡椒', 0.2)],
    steps: ['吞拿鱼和玉米沥干，拌入蛋黄酱、黑胡椒。', '黄瓜洗净切片，和馅料夹进面包；也可干烘面包后再夹。', '做好即食；提前制作须及时冷藏，外带用保冷袋。'],
    portionTip: '蛋黄酱也需称量；剩余黄瓜作为配菜一起吃。',
    adaptation: '参考 NHS 吞拿鱼玉米三明治，改用全麦面包、明确沥干鱼重并加入黄瓜。原配餐和热量未沿用。',
    allergens: ['鱼', '小麦', '鸡蛋（蛋黄酱）', '可能含芥末或大豆（酱料）'], searchTerms: ['金枪鱼', 'tuna', '三文治'],
    source: nhs('Tuna mayonnaise and sweetcorn sandwich', 'tuna-mayonnaise-and-sweetcorn-sandwich'),
  },
  {
    id: 'banana-oats', name: '香蕉牛奶燕麦粥', emoji: '🍌', meal: '早餐', cuisine: '熟悉的西式', flavor: '水果自然甜 · 温热', minutes: 15,
    ingredients: [g('原味燕麦片', 45, '干重'), ml('低脂牛奶', 200), g('香蕉', 80, '去皮重'), g('原味无糖希腊酸奶', 100), g('鲜莓果', 50), ml('水', 100)],
    steps: ['燕麦加牛奶和水，小火煮软，边煮边搅拌防糊底。', '香蕉压碎拌入粥中；鲜莓果洗净。', '盛碗稍放凉，加酸奶和莓果，不再加糖或蜂蜜。'],
    portionTip: '按原味乳制品准备；果干、坚果酱和蜂蜜都不是零热量配料。',
    adaptation: '参考 NHS 香蕉莓果粥，重新设置一人份燕麦、奶和酸奶用量；可用常见的草莓或蓝莓。', allergens: ['牛奶', '可能含麸质（燕麦）'],
    source: nhs('Creamy banana porridge with mish-mash raspberries', 'banana-and-raspberry-porridge'),
  },
  {
    id: 'tomato-egg-rice', name: '少油番茄炒蛋饭', emoji: '🍅', meal: '午餐', cuisine: '中式家常', flavor: '家常酸甜 · 不辣', minutes: 15, timeNote: '用时以已有熟饭为前提',
    ingredients: [rice(), g('鸡蛋', 100, '去壳约 2 个'), g('番茄', 250), g('小白菜', 150), g('葱', 5), oil(), g('盐', 0.5), ml('水', 30)],
    steps: ['番茄切块，蛋打散；青菜焯熟，米饭热透。', '不粘锅用一半油炒蛋至凝固盛出，再用剩余油炒番茄。', '加水焖软番茄，回锅鸡蛋，加盐和葱炒匀，配饭和青菜。'],
    portionTip: '番茄熟透更有甜味，先尝味再决定是否需要调味。',
    adaptation: '参考番茄炒蛋，整份用油改为 5 克、不另加糖；加入饭和焯青菜组成一餐。', allergens: ['鸡蛋'], searchTerms: ['西红柿'],
    source: woks('Chinese Tomato Egg Stir-fry', 'stir-fried-tomato-and-egg'),
  },
  {
    id: 'chicken-broccoli-rice', name: '西兰花鸡片杂粮饭', emoji: '🥦', meal: '午餐', cuisine: '中式家常', flavor: '蒜香清炒 · 不辣', minutes: 25, timeNote: '用时以已有熟饭为前提',
    ingredients: [rice(), g('去皮鸡胸肉', 130, '生重'), g('西兰花', 250), g('蒜', 5), g('玉米淀粉', 3), oil(), soy(), ml('水', 60)],
    steps: ['鸡肉切薄片，用淀粉和一部分水拌匀，准备西兰花小朵。', '西兰花焯到略软捞出；锅中放油和蒜，加入鸡片炒散。', '加剩余水、生抽和西兰花，焖炒至鸡肉熟透，搭配热饭。'],
    portionTip: '生鸡肉 130 克与熟鸡肉 130 克不是同一份量，备料按生重。',
    adaptation: '参考西兰花鸡片，简化酱汁、减少油，增加每人蔬菜比例，搭配定量熟饭。', allergens: ['大豆（生抽）', '小麦（部分生抽）'],
    source: woks('Chicken and Broccoli', 'chinese-chicken-broccoli-brown-sauce'),
  },
  {
    id: 'mushroom-chicken-rice', name: '香菇蒸鸡配饭', emoji: '🍄', meal: '午餐', cuisine: '中式家常', flavor: '姜葱菌香 · 不辣', minutes: 30, timeNote: '使用鲜香菇和已有熟饭',
    ingredients: [rice(), g('去皮去骨鸡腿肉', 140, '生重'), g('鲜香菇', 100), g('小白菜', 150), g('姜', 5), g('葱', 5), g('玉米淀粉', 3), oil(3), soy(), ml('水', 20)],
    steps: ['鸡腿肉切小薄块，与生抽、淀粉、油和水拌匀，放置 10 分钟。', '香菇切片与鸡肉、姜丝平铺浅盘，水开后加盖蒸约 15 分钟；鸡肉须熟透。', '焯熟小白菜、热透米饭，蒸鸡出锅撒葱，一起装盘。'],
    portionTip: '鸡肉单层铺开，份量翻倍时分盘蒸，不机械照搬时间。',
    adaptation: '参考粤式香菇蒸鸡，改用鲜香菇和去皮鸡腿，省去干黄花菜、木耳和额外糖，加入青菜与饭。', allergens: ['大豆（生抽）', '小麦（部分生抽）'],
    source: woks('Steamed Chicken with Mushrooms & Dried Lily Flowers', 'steamed-chicken-mushrooms-dried-lily-flowers'),
  },
  {
    id: 'pepper-beef-rice', name: '彩椒洋葱牛肉饭', emoji: '🫑', meal: '午餐', cuisine: '中式家常', flavor: '黑椒咸香 · 微辛', minutes: 30, timeNote: '用时以已有熟饭为前提',
    ingredients: [rice(), g('瘦牛肉', 120, '生重'), g('彩椒', 200), g('洋葱', 80), g('姜', 3), g('蒜', 3), g('玉米淀粉', 3), oil(), soy(), g('黑胡椒', 0.3), ml('水', 40)],
    steps: ['牛肉逆纹切薄片，用淀粉、部分水拌匀；彩椒、洋葱切块。', '不粘锅用部分油炒牛肉，炒熟盛出。', '剩余油炒香姜蒜和彩椒洋葱，加生抽、黑胡椒和余下水，回锅牛肉炒匀，配热饭。'],
    portionTip: '用瘦肉和甜椒；怕辛辣可减少黑胡椒，不需额外加糖。',
    adaptation: '参考 Pepper Steak，省去蚝油、糖和嫩肉小苏打，减少用油，明确一人份主食。', allergens: ['大豆（生抽）', '小麦（部分生抽）'], searchTerms: ['青椒牛肉', '黑椒牛肉'],
    source: woks('Pepper Steak', 'pepper-steak-recipe'),
  },
  {
    id: 'rainbow-tofu-rice', name: '彩虹鱼肉豆腐饭', emoji: '🍚', meal: '午餐', cuisine: '中式家常', flavor: '清蒸鲜香 · 不辣', minutes: 30, timeNote: '使用鲜香菇和已有熟饭',
    ingredients: [rice(), g('无刺鱼肉', 90, '生重；剁碎，非调味鱼滑'), g('老豆腐', 150), g('鲜香菇', 50), g('胡萝卜', 50), g('青豆', 50), g('小白菜', 100), g('玉米淀粉', 3), soy(), g('香油', 2)],
    steps: ['豆腐沥水压碎，香菇与胡萝卜切细粒，青豆和胡萝卜先煮熟。', '鱼肉、豆腐、香菇、蔬菜粒与淀粉、生抽、香油拌匀，平铺浅盘。', '水开后蒸约 15 分钟至鱼肉熟透；焯熟小白菜，与热饭同食。'],
    portionTip: '选无预调味鱼肉，少用本身含盐较多的现成鱼滑。',
    adaptation: '参考香港卫生署「彩虹豆腐」的鱼肉豆腐蒸法，省去蛋白，改用鲜菇并加入主食、配菜；非原版营养数据。', allergens: ['鱼', '大豆', '芝麻', '小麦（部分生抽）'],
    source: { publisher: '香港卫生署 · 有「营」食肆', title: 'Rainbow Tofu · 彩虹豆腐', url: 'https://restaurant.eatsmart.gov.hk/gb/content.aspx?content_id=71' },
  },
  {
    id: 'ginger-steamed-fish', name: '姜葱清蒸鱼配饭', emoji: '🐟', meal: '晚餐', cuisine: '中式家常', flavor: '姜葱鲜香 · 不辣', minutes: 25, timeNote: '用时以已有熟饭为前提',
    ingredients: [rice(), g('无刺鳟鱼或白肉鱼片', 150, '生重'), g('小白菜', 250), g('姜', 6), g('葱', 10), g('蒜', 3), soy(), g('香油', 3)],
    steps: ['鱼片检查有无残留鱼刺，放浅盘，铺姜丝、蒜和葱白。', '水开后加盖蒸约 10–15 分钟，按厚度调整到中心熟透。', '青菜焯熟；鱼加生抽、香油和葱绿，与热饭、青菜同食。'],
    portionTip: '香油就是本餐用油，不再额外浇一勺热油。',
    adaptation: '参考 Diabetes UK 中式蒸鳟鱼，省去青柠，按家常姜葱口味重新配量并加饭、青菜。', allergens: ['鱼', '芝麻', '大豆（生抽）', '小麦（部分生抽）'],
    source: { publisher: 'Diabetes UK', title: 'Chinese steamed trout', url: 'https://www.diabetes.org.uk/guide-to-diabetes/recipes/chinese-steamed-trout' },
  },
  {
    id: 'pork-tofu-egg', name: '豆腐肉末蒸蛋套餐', emoji: '🥚', meal: '晚餐', cuisine: '中式家常', flavor: '滑嫩鲜香 · 不辣', minutes: 30, timeNote: '用时以已有熟饭为前提',
    ingredients: [rice(), g('嫩豆腐', 120), g('鸡蛋', 50, '去壳约 1 个'), g('瘦猪肉末', 60, '生重'), g('小白菜', 250), soy(), oil(2), ml('水', 80)],
    steps: ['猪肉末与生抽拌匀，豆腐切小块放浅碗。', '鸡蛋打散加水，拌入分散的肉末，倒在豆腐上。', '加盖隔水蒸约 18–20 分钟，到蛋液凝固且肉末中心熟透；青菜焯熟拌油，配热饭。'],
    portionTip: '使用浅碗避免中间不熟；多份分碗蒸。',
    adaptation: '参考香港卫生署校园食谱，仅借鉴豆腐肉末蒸蛋的组合；重新设计成人一人份和配餐，不沿用儿童份量。', allergens: ['鸡蛋', '大豆', '小麦（部分生抽）'],
    source: { publisher: '香港卫生署 · StartSmart', title: '豆腐肉碎蒸蛋', url: 'https://www.startsmart.gov.hk/en/photogalleryDetail.aspx?RecipeID=62' },
  },
  {
    id: 'ginger-shrimp-rice', name: '姜葱虾仁青菜饭', emoji: '🦐', meal: '晚餐', cuisine: '中式家常', flavor: '姜葱咸鲜 · 不辣', minutes: 20, timeNote: '虾仁已解冻、已有熟饭；解冻时间另计',
    ingredients: [rice(), g('虾仁', 150, '解冻去壳沥干生重'), g('小白菜', 250), g('姜', 5), g('葱', 15), oil(), soy(), ml('水', 20)],
    steps: ['虾仁检查虾线并沥干；青菜洗净，姜切丝、葱切段。', '一半油炒青菜，少量水焖熟盛出。', '余油炒姜和葱白，加虾仁、生抽和余下水，炒至虾肉完全不透明熟透，加葱绿，配热饭和青菜。'],
    portionTip: '油分两次使用，总量仍为配方里的 5 克。',
    adaptation: '参考姜葱虾，省去酒、糖和额外香油，重新控制油量并加入青菜与饭。', allergens: ['甲壳类（虾）', '大豆（生抽）', '小麦（部分生抽）'],
    source: woks('Scallion Ginger Shrimp Recipe', 'scallion-ginger-shrimp-redux'),
  },
  {
    id: 'broccoli-tofu-rice', name: '蒜香西兰花豆腐饭', emoji: '🥦', meal: '晚餐', cuisine: '中式家常', flavor: '蒜香酱汁 · 不辣', minutes: 20, timeNote: '用时以已有熟饭为前提',
    ingredients: [rice(), g('老豆腐', 200), g('西兰花', 250), g('蒜', 5), g('玉米淀粉', 3), oil(), soy(), ml('水', 100)],
    steps: ['豆腐沥干切块，西兰花切小朵并焯至略软。', '锅中放油炒香蒜，加豆腐、西兰花、生抽和大部分水，小火煮约 5 分钟。', '余水调匀淀粉入锅，煮到略收汁，配热饭。'],
    portionTip: '用原味老豆腐，不换成油豆腐；主食照常搭配。',
    adaptation: '参考西兰花豆腐碗，减少油和酱料、省去糖和酒，使用清水；明确豆腐、蔬菜和熟饭份量。', allergens: ['大豆', '小麦（部分生抽）'], searchTerms: ['素食'],
    source: woks('10-Minute Broccoli Tofu Bowls', 'broccoli-tofu-bowls'),
  },
  {
    id: 'salmon-pasta', name: '三文鱼西兰花意面', emoji: '🍝', meal: '晚餐', cuisine: '熟悉的西式', flavor: '淡奶蒜香 · 不辣', minutes: 30,
    ingredients: [g('全麦意面', 60, '干重'), g('三文鱼', 120, '去骨生重'), g('西兰花', 200), g('青豆', 40), ml('低脂牛奶', 80), g('低脂软奶酪', 20), g('蒜', 3), oil(3), g('黑胡椒', 0.2)],
    steps: ['意面按包装煮熟，西兰花和青豆另外煮熟，留少量煮面水。', '不粘锅放油和蒜，加入三文鱼，两面煎至中心熟透后分成大块。', '小火将牛奶、奶酪拌成酱，加入面、蔬菜和鱼，过稠加少量煮面水；撒黑胡椒。'],
    portionTip: '奶酪按份称量；不再加淡奶油或大块黄油。',
    adaptation: '参考 NHS 三文鱼西兰花意面，改为少油平底锅做法、蒜香调味，重新设置鱼、蔬菜与奶酱用量。', allergens: ['鱼', '牛奶', '小麦'], searchTerms: ['意大利面', 'salmon', 'pasta'],
    source: nhs('Salmon and broccoli pasta', 'salmon-and-broccoli-pasta'),
  },
];

export const recipes: Recipe[] = [...cantoneseRecipes, ...previousRecipes];
