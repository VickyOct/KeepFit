# 基础粤菜与茶餐厅菜单

更新与网络核对：2026-09-28。按用户新偏好，默认食谱页改为普通粤菜和茶餐厅家做版，不要求减脂、不因热量较高排除菜式。共 12 道：6 道粤菜家常餐点、6 道茶餐厅餐点。原来的 15 道食谱与收藏 ID 未删除，可在「原有食谱」入口查看。

## 一份大致热量

以下为 App 内所列用量的计算结果，四舍五入至十位；不是餐厅平均值，也不是食谱作者提供的营养数据。卡路里在这里指千卡（kcal）。均不含饮品。

| 菜式 | 本页一份口径 | 约千卡 |
| --- | --- | ---: |
| 港式炒蛋多士 | 白面包 70g、2 只蛋、牛油 10g、全脂奶 20ml | 410 |
| 火腿通粉 | 干通粉 70g、火腿 50g、青豆玉米及整碗汤 | 410 |
| 餐蛋面 | 干面及粉包 85g、餐肉 60g、1 只蛋、煎油 5g | 690 |
| 吞拿鱼三文治 | 白面包 70g、水浸鱼沥干 80g、普通蛋黄酱 20g 等 | 450 |
| 干炒牛河 | 鲜河粉 250g、牛肉 100g、炒油 20g 及配菜酱料 | 710 |
| 豉油皇炒面 | 干蛋面 80g、炒油 15g 及配菜酱料 | 510 |
| 番茄炒蛋饭 | 2 只蛋、番茄 250g、油 12g、糖 5g，含熟白饭 200g | 580 |
| 冬菇蒸鸡饭 | 去皮鸡腿肉 160g、泡发冬菇及酱汁，含熟白饭 200g | 630 |
| 家常蒸水蛋 | 2 只蛋做的一小碗，含油与生抽；不含饭 | 180 |
| 姜葱清蒸鱼柳 | 无骨白肉鱼 180g、油 10g 及豉油汁；不含饭 | 260 |
| 虾仁炒蛋 | 虾仁 100g、2 只蛋、油 10g；不含饭 | 320 |
| 榨菜蒸肉饼 | 普通猪肉末 120g、榨菜荸荠及调味料；不含饭 | 440 |

单碟菜另配 200g 熟白饭约增加 260 千卡。餐蛋面的额外液体油包、三文治附送的薯条、早餐配的奶茶都不自动算入。餐次仅用于浏览，不表示只能在该时段吃。

## 计算方法与证据强度

`src/recipeEnergy.ts` 保存食材能量系数；`src/cantoneseRecipes.ts` 的每项食材绑定系数与生熟/沥干口径。按 `用量 × 每 100g（或 ml）能量 / 100` 求和，最终取整到 10 千卡。油与酱汁按全部吃下计算。多人总量用未取整值乘人数再取整，避免累计舍入误差，因此可能和“显示的单份值 × 人数”相差 10 千卡。

以下数据已通过 USDA FoodData Central 的公开 API（SR Legacy）实际查询，单位 kcal/100g：

| 食材 | 系数 | 官方记录 |
| --- | ---: | --- |
| 生全蛋 | 143 | [FDC 171287](https://fdc.nal.usda.gov/food-details/171287/nutrients) |
| 熟白米饭 | 130 | [FDC 168878](https://fdc.nal.usda.gov/food-details/168878/nutrients) |
| 白面包，未烘烤重量 | 266 | [FDC 174924](https://fdc.nal.usda.gov/food-details/174924/nutrients) |
| 菜籽油 | 884 | [FDC 172336](https://fdc.nal.usda.gov/food-details/172336/nutrients) |
| 有盐黄油 | 717 | [FDC 173410](https://fdc.nal.usda.gov/food-details/173410/nutrients) |
| 全脂牛奶 | 61 | [FDC 171265](https://fdc.nal.usda.gov/food-details/171265/nutrients) |
| 干意面/通心粉 | 371 | [FDC 169736](https://fdc.nal.usda.gov/food-details/169736/nutrients) |
| 熟米粉 | 108 | [FDC 168914](https://fdc.nal.usda.gov/food-details/168914/nutrients) |

其余肉类、蔬菜、加工食品和酱料采用 **KeepFit 编辑近似系数**，没有声称已逐项从数据库核对或实测；界面逐项明确区分这类系数和 USDA 数据。公开 API 后续返回限流错误，未将失败的查询标作已验证。完整取值保存在 `energyFactors`，可随着取得具体品牌营养表而替换。

主要近似包括：普通猪肉末 260、瘦牛肉 180、去皮鸡腿肉 150、生白肉鱼 85、生虾仁 85、火腿 150、午餐肉 320、水浸鱼沥干 115、普通蛋黄酱 680、干蛋面 370、方便面与粉包 450 kcal/100g。这些不是对应品牌的化验值。

尤其注意鲜河粉用 USDA **熟米粉**系数近似，两者含水和含油量可能有明显差异；泡发冬菇用鲜香菇系数近似；牛奶与酱油体积暂按 ml≈g 处理。肉末肥瘦、包装面食、沙律酱和汤底品牌、实际吃下的汤汁都会影响估值。不得把这里的数字作为特定餐厅大碟的确定热量。

## 做法来源

食谱以自行编写的简短步骤、重新设定的家庭份量呈现。没有复制照片或整篇文章，也没有把原作者的营养数值套到修改后的配方。来源只支持做法参考，不能当作本版本热量的背书。

| 菜式 | 来源 |
| --- | --- |
| 炒蛋多士 | [Made With Lau：Scrambled Eggs](https://www.madewithlau.com/recipes/scrambled-eggs)，借鉴炒蛋手法，另配多士 |
| 火腿通粉 | [基丝汀：火腿通粉](https://www.christinesrecipes.com/2010/12/macaroni-soup-with-ham.html) |
| 餐蛋面 | [SPAM：Classic and Beef Ramen](https://www.spam.com/recipes/spam-classic-and-beef-ramen)，参考餐肉、煎蛋与汤面的组合 |
| 吞拿鱼三文治 | [NHS：Tuna mayonnaise and sweetcorn sandwich](https://www.nhs.uk/healthier-families/recipes/tuna-mayonnaise-and-sweetcorn-sandwich/)，本版改为普通蛋黄酱与白面包 |
| 干炒牛河 | [Made With Lau：Beef Chow Fun](https://www.madewithlau.com/recipes/beef-chow-fun) |
| 豉油皇炒面 | [Made With Lau：Cantonese Chow Mein](https://www.madewithlau.com/recipes/cantonese-chow-mein) |
| 番茄炒蛋饭 | [The Woks of Life：Tomato Egg Stir-fry](https://thewoksoflife.com/stir-fried-tomato-and-egg/)，跨地区家常菜，并非粤菜独有 |
| 冬菇蒸鸡饭 | [The Woks of Life：Steamed Chicken](https://thewoksoflife.com/steamed-chicken-mushrooms-dried-lily-flowers/) |
| 蒸水蛋 | [The Woks of Life：Steamed Eggs](https://thewoksoflife.com/steamed-egg/) |
| 姜葱蒸鱼 | [Made With Lau：Steamed Fish](https://www.madewithlau.com/recipes/steamed-fish) |
| 虾仁炒蛋 | [The Woks of Life：Stir-fried Shrimp and Eggs](https://thewoksoflife.com/stir-fried-shrimp-eggs/) |
| 榨菜蒸肉饼 | [Made With Lau：Steamed Pork Patty](https://www.madewithlau.com/recipes/steamed-pork-patty) |

## 验证

类型检查及全套 24 项自动测试通过。新增验证覆盖热量完整性、油脂纳入计算、按未取整数据换算多份总量、未知营养不当成 0、单碟与含饭份量说明、菜系与餐次筛选、原有食谱可访问。使用原生组件替身进行交互测试；尚无手机真机视觉验证，家庭改编做法未实厨房测试。
