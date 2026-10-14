# 原有食谱：来源与内容边界

以下为保留在「原有食谱」入口的首批 15 道内容。默认入口现已改为普通粤菜与茶餐厅菜单，新增菜单的份量与热量估算见 [粤菜与茶餐厅菜单](cantonese-menu.md)。下文“未核算热量”只针对本批原有食谱。

核对日期：2026-09-28。首批 15 道，早餐、午餐、晚餐各 5 道，12 道中式、3 道熟悉口味的西式餐。

本地食谱是 KeepFit 独立编写的份量与做法改编，不是原文翻译或原配方复刻。保留原作者、标题、链接、逐道改编说明；不转载照片，不复制整篇文章。原网站与作者未审核、背书本版本。改编配方尚未完成实厨房验证，用时仅作估计；多份需分锅/分盘，按实际熟度调整。

## 选择原则

参考 [NHS 的体重管理饮食建议](https://www.nhs.uk/better-health/lose-weight/healthy-eating-when-trying-to-lose-weight/)：每餐保留蛋白质食物、主食，正餐搭配蔬菜，量取油与酱料。以中国常见食材、姜葱蒜与番茄口味、蒸煮和少油炒为主。减脂取决于长期能量平衡，不能从菜名推断减脂效果。

用量是成人一人份的备餐起点，不是对所有人适用的日热量处方。已注明干重、生重、熟重和沥干重，人数按钮线性换算原料，不机械换算时间。以已有熟饭为前提的菜明确注明；解冻和浸泡不隐含在快手标签里。

改编后没有逐项营养核算，因此不展示未经核算的 kcal、蛋白质或原配方的营养数字。浏览或收藏不会写入实际饮食记录。主要过敏原仅作提醒，以实际包装配料为准。

## 原始食谱

| App 食谱 | 原始来源 |
| --- | --- |
| 番茄鸡蛋青菜汤面 | [The Woks of Life：Tomato Egg Drop Noodle Soup](https://thewoksoflife.com/tomato-egg-drop-noodle-soup/) |
| 姜丝鸡肉青菜粥 | [Made With Lau：Chicken Congee](https://www.madewithlau.com/recipes/chicken-congee) |
| 青菜鸡蛋咸燕麦 | [Omnivore’s Cookbook：Savory Oatmeal](https://omnivorescookbook.com/savory-oatmeal/) |
| 吞拿鱼玉米全麦三明治 | [NHS：Tuna mayonnaise and sweetcorn sandwich](https://www.nhs.uk/healthier-families/recipes/tuna-mayonnaise-and-sweetcorn-sandwich/) |
| 香蕉牛奶燕麦粥 | [NHS：Banana and raspberry porridge](https://www.nhs.uk/healthier-families/recipes/banana-and-raspberry-porridge/) |
| 少油番茄炒蛋饭 | [The Woks of Life：Tomato Egg Stir-fry](https://thewoksoflife.com/stir-fried-tomato-and-egg/) |
| 西兰花鸡片杂粮饭 | [The Woks of Life：Chicken and Broccoli](https://thewoksoflife.com/chinese-chicken-broccoli-brown-sauce/) |
| 香菇蒸鸡配饭 | [The Woks of Life：Steamed Chicken](https://thewoksoflife.com/steamed-chicken-mushrooms-dried-lily-flowers/) |
| 彩椒洋葱牛肉饭 | [The Woks of Life：Pepper Steak](https://thewoksoflife.com/pepper-steak-recipe/) |
| 彩虹鱼肉豆腐饭 | [香港卫生署有「营」食肆：彩虹豆腐](https://restaurant.eatsmart.gov.hk/gb/content.aspx?content_id=71) |
| 姜葱清蒸鱼配饭 | [Diabetes UK：Chinese steamed trout](https://www.diabetes.org.uk/guide-to-diabetes/recipes/chinese-steamed-trout) |
| 豆腐肉末蒸蛋套餐 | [香港卫生署 StartSmart：豆腐肉碎蒸蛋](https://www.startsmart.gov.hk/en/photogalleryDetail.aspx?RecipeID=62) |
| 姜葱虾仁青菜饭 | [The Woks of Life：Scallion Ginger Shrimp](https://thewoksoflife.com/scallion-ginger-shrimp-redux/) |
| 蒜香西兰花豆腐饭 | [The Woks of Life：Broccoli Tofu Bowls](https://thewoksoflife.com/broccoli-tofu-bowls/) |
| 三文鱼西兰花意面 | [NHS：Salmon and broccoli pasta](https://www.nhs.uk/healthier-families/recipes/salmon-and-broccoli-pasta/) |

彩虹豆腐页面正文通过搜索索引核对，直接页面抓取不稳定；保留官方链接。StartSmart 原文针对学校儿童，本应用只借鉴食材组合与蒸制方法，已重新设计成人份量，不宣称儿童减脂食谱。引用 Diabetes UK 仅为菜式方法，不表示本配方是个性化糖尿病餐。

## 功能和维护

- 内容随 App 打包，可离线搜索、按餐次/口味/20 分钟内筛选和查看；打开原链接需网络。
- 收藏独立保存到 `keepfit.recipe-favorites.v1`，写入成功后更新界面。读取失败提供重试，不覆盖不可读数据；写入队列防止快速操作或切页造成丢失。
- `src/recipes.ts` 是内容来源；添加条目需补全食材状态、份量、步骤、适配说明、来源和核对信息。当前版本是人工精选库，不会自动抓取或更新网页。
- `npm.cmd run typecheck`、`npm.cmd run test:recipes` 验证数据与交互。交互测试使用原生组件替身，不能替代实际手机布局验证。
