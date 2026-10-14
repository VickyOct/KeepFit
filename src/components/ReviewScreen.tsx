import { Alert } from '../alert';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { recognizeFoodPhoto } from '../services/foodRecognition';
import { colors, shadows } from '../theme';
import type { FoodCatalogItem, MealFood, MealRecord, MealType } from '../types';
import {
  calculateFoodProtein,
  calculateMealProtein,
  createId,
  getMealType,
  MEAL_TYPES,
} from '../utils';
import { FoodPickerModal } from './FoodPickerModal';

type Props = {
  imageUri: string | null;
  onBack: () => void;
  onSave: (meal: MealRecord) => void;
};

export function ReviewScreen({ imageUri, onBack, onSave }: Props) {
  const [foods, setFoods] = useState<MealFood[]>([]);
  const [mealType, setMealType] = useState<MealType>(() => getMealType(new Date()));
  const [analyzing, setAnalyzing] = useState(Boolean(imageUri));
  const [foodPickerOpen, setFoodPickerOpen] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let active = true;
    setFoods([]);

    if (!imageUri) {
      setAnalyzing(false);
      return () => {
        active = false;
      };
    }

    setAnalyzing(true);

    recognizeFoodPhoto(imageUri)
      .then((result) => {
        if (active) setFoods(result.foods);
      })
      .catch(() => {
        if (active) {
          Alert.alert('暂时无法分析', '你仍然可以从食物列表中手动添加。');
        }
      })
      .finally(() => {
        if (active) setAnalyzing(false);
      });

    return () => {
      active = false;
    };
  }, [imageUri]);

  const totalProtein = useMemo(() => calculateMealProtein(foods), [foods]);

  function updateGrams(entryId: string, amount: number) {
    setFoods((current) =>
      current.map((food) =>
        food.entryId === entryId
          ? { ...food, grams: Math.min(1000, Math.max(10, food.grams + amount)) }
          : food,
      ),
    );
  }

  function removeFood(entryId: string) {
    setFoods((current) => current.filter((food) => food.entryId !== entryId));
  }

  function addFood(item: FoodCatalogItem) {
    setFoods((current) => {
      const existing = current.find((food) => food.id === item.id);
      if (existing) {
        return current.map((food) =>
          food.entryId === existing.entryId
            ? { ...food, grams: Math.min(1000, food.grams + item.defaultGrams) }
            : food,
        );
      }

      return [
        ...current,
        { ...item, entryId: createId('food'), grams: item.defaultGrams },
      ];
    });
    setFoodPickerOpen(false);
  }

  function save() {
    if (!foods.length) {
      Alert.alert('还没有食物', '请先添加至少一种食物。');
      return;
    }

    const now = new Date();
    onSave({
      id: createId('meal'),
      createdAt: now.toISOString(),
      mealType,
      imageUri,
      foods,
      totalProtein,
    });
  }

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="返回" style={styles.headerButton} onPress={onBack}>
          <Text style={styles.backGlyph}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{imageUri ? '确认这一餐' : '手动记录一餐'}</Text>
        <View style={styles.headerButtonPlaceholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 18) + 98 }]}
      >
        <View style={styles.mealTypeCard}>
          <View style={styles.mealTypeHeading}>
            <Text style={styles.mealTypeTitle}>这是哪一顿？</Text>
            <Text style={styles.mealTypeHint}>已按当前时间预选</Text>
          </View>
          <View style={styles.mealTypeOptions}>
            {MEAL_TYPES.map((item) => {
              const selected = mealType === item.name;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  key={item.name}
                  style={[styles.mealTypeOption, selected && styles.mealTypeOptionSelected]}
                  onPress={() => setMealType(item.name)}
                >
                  <Text style={styles.mealTypeEmoji}>{item.emoji}</Text>
                  <Text style={[styles.mealTypeName, selected && styles.mealTypeNameSelected]}>{item.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {imageUri ? (
          <View style={styles.imageWrap}>
            <Image source={{ uri: imageUri }} style={styles.image} />
            <View style={styles.imageBadge}>
              <View style={styles.imageBadgeDot} />
              <Text style={styles.imageBadgeText}>本次照片</Text>
            </View>
          </View>
        ) : (
          <View style={styles.manualHero}>
            <View style={styles.manualHeroIcon}>
              <Text style={styles.manualHeroGlyph}>＋</Text>
            </View>
            <View style={styles.manualHeroCopy}>
              <Text style={styles.manualHeroTitle}>这一餐没有照片</Text>
              <Text style={styles.manualHeroText}>从菜单选择吃过的食物，再调整实际份量。</Text>
            </View>
            <Pressable style={styles.manualHeroButton} onPress={() => setFoodPickerOpen(true)}>
              <Text style={styles.manualHeroButtonText}>添加食物</Text>
            </Pressable>
          </View>
        )}

        {imageUri ? <View style={styles.analysisCard}>
          {analyzing ? (
            <>
              <ActivityIndicator color={colors.primary} size="small" />
              <View style={styles.analysisCopy}>
                <Text style={styles.analysisTitle}>正在整理食物建议…</Text>
                <Text style={styles.analysisText}>第一版会载入演示结果，所有份量都可以修改。</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.demoMark}>
                <Text style={styles.demoMarkText}>AI</Text>
              </View>
              <View style={styles.analysisCopy}>
                <View style={styles.analysisTitleRow}>
                  <Text style={styles.analysisTitle}>演示识别建议</Text>
                  <View style={styles.demoPill}>
                    <Text style={styles.demoPillText}>尚未接入模型</Text>
                  </View>
                </View>
                <Text style={styles.analysisText}>目前显示示例食物，请按照片中的实际内容增删和调整。</Text>
              </View>
            </>
          )}
        </View> : null}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>食物与份量</Text>
            <Text style={styles.sectionHint}>每次按 ±10 克调整</Text>
          </View>
          <Pressable style={styles.addButton} onPress={() => setFoodPickerOpen(true)}>
            <Text style={styles.addButtonText}>＋ 添加</Text>
          </Pressable>
        </View>

        {foods.map((food) => (
          <View key={food.entryId} style={styles.foodCard}>
            {food.emoji ? (
              <View style={[styles.foodIcon, { backgroundColor: food.tint }]}>
                <Text style={styles.foodIconText}>{food.emoji}</Text>
              </View>
            ) : null}

            <View style={[styles.foodMain, !food.emoji && styles.foodMainNoIcon]}>
              <View style={styles.foodTitleRow}>
                <View style={styles.foodNameWrap}>
                  <Text style={styles.foodName}>{food.name}</Text>
                  <Text style={styles.foodRate}>每 100 克含 {food.proteinPer100g} 克</Text>
                </View>
                <Pressable accessibilityLabel={`移除${food.name}`} hitSlop={10} onPress={() => removeFood(food.entryId)}>
                  <Text style={styles.removeGlyph}>×</Text>
                </Pressable>
              </View>

              <View style={styles.foodBottom}>
                <View style={styles.gramStepper}>
                  <Pressable accessibilityLabel={`减少${food.name}份量`} style={styles.gramButton} onPress={() => updateGrams(food.entryId, -10)}>
                    <Text style={styles.gramButtonText}>−</Text>
                  </Pressable>
                  <Text style={styles.gramValue}>{food.grams}g</Text>
                  <Pressable accessibilityLabel={`增加${food.name}份量`} style={styles.gramButton} onPress={() => updateGrams(food.entryId, 10)}>
                    <Text style={styles.gramButtonText}>＋</Text>
                  </Pressable>
                </View>
                <View style={styles.foodProteinWrap}>
                  <Text style={styles.foodProteinValue}>{calculateFoodProtein(food)}</Text>
                  <Text style={styles.foodProteinUnit}>克蛋白质</Text>
                </View>
              </View>
            </View>
          </View>
        ))}

        {!analyzing && foods.length === 0 && (
          <Pressable style={styles.emptyFoods} onPress={() => setFoodPickerOpen(true)}>
            <Text style={styles.emptyFoodsTitle}>没有食物项目</Text>
            <Text style={styles.emptyFoodsText}>点击这里搜索或添加食物</Text>
          </Pressable>
        )}

        <View style={styles.estimateNote}>
          <Text style={styles.estimateNoteMark}>i</Text>
          <Text style={styles.estimateNoteText}>蛋白质依据每 100 克参考值估算，烹饪方式和品牌会影响实际结果。</Text>
        </View>
      </ScrollView>

      <View style={[styles.saveBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View>
          <Text style={styles.totalLabel}>这一餐约含</Text>
          <Text style={styles.totalValue}>{totalProtein}<Text style={styles.totalUnit}> 克蛋白质</Text></Text>
        </View>
        <Pressable
          disabled={analyzing || foods.length === 0}
          style={({ pressed }) => [
            styles.saveButton,
            (analyzing || foods.length === 0) && styles.saveButtonDisabled,
            pressed && styles.saveButtonPressed,
          ]}
          onPress={save}
        >
          <Text style={styles.saveButtonText}>保存记录</Text>
        </Pressable>
      </View>

      <FoodPickerModal
        visible={foodPickerOpen}
        onClose={() => setFoodPickerOpen(false)}
        onSelect={addFood}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 58,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerButtonPlaceholder: {
    width: 40,
  },
  backGlyph: {
    marginTop: -3,
    color: colors.ink,
    fontSize: 34,
    lineHeight: 35,
    fontWeight: '300',
  },
  headerTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 7,
  },
  mealTypeCard: {
    marginBottom: 13,
    padding: 15,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  mealTypeHeading: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mealTypeTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  mealTypeHint: {
    color: colors.subtle,
    fontSize: 10,
  },
  mealTypeOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  mealTypeOption: {
    flex: 1,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  mealTypeOptionSelected: {
    backgroundColor: colors.primaryPale,
    borderColor: colors.primary,
  },
  mealTypeEmoji: {
    fontSize: 20,
  },
  mealTypeName: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  mealTypeNameSelected: {
    color: colors.primary,
    fontWeight: '800',
  },
  imageWrap: {
    height: 224,
    overflow: 'hidden',
    borderRadius: 25,
    backgroundColor: colors.surfaceMuted,
    ...shadows.card,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageBadge: {
    position: 'absolute',
    left: 13,
    bottom: 13,
    height: 30,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(24, 32, 25, 0.75)',
  },
  imageBadgeDot: {
    width: 6,
    height: 6,
    marginRight: 7,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  imageBadgeText: {
    color: colors.surface,
    fontSize: 11,
    fontWeight: '700',
  },
  manualHero: {
    minHeight: 112,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: colors.primaryPale,
    borderWidth: 1,
    borderColor: '#D9E7D8',
  },
  manualHeroIcon: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: colors.primary,
  },
  manualHeroGlyph: {
    color: colors.surface,
    fontSize: 25,
    lineHeight: 28,
    fontWeight: '300',
  },
  manualHeroCopy: {
    flex: 1,
    marginLeft: 12,
  },
  manualHeroTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  manualHeroText: {
    marginTop: 5,
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
  },
  manualHeroButton: {
    height: 34,
    marginLeft: 8,
    paddingHorizontal: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: colors.surface,
  },
  manualHeroButtonText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  analysisCard: {
    minHeight: 76,
    marginTop: 13,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 19,
    backgroundColor: colors.primaryPale,
    borderWidth: 1,
    borderColor: '#D9E7D8',
  },
  analysisCopy: {
    flex: 1,
    marginLeft: 12,
  },
  analysisTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  analysisTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  analysisText: {
    marginTop: 5,
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
  },
  demoMark: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: colors.primary,
  },
  demoMarkText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  demoPill: {
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 8,
    backgroundColor: '#F4E4BF',
  },
  demoPillText: {
    color: '#72541C',
    fontSize: 9,
    fontWeight: '800',
  },
  sectionHeader: {
    marginTop: 26,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  sectionHint: {
    marginTop: 4,
    color: colors.subtle,
    fontSize: 10,
  },
  addButton: {
    height: 36,
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: colors.primarySoft,
  },
  addButtonText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  foodCard: {
    marginBottom: 10,
    padding: 13,
    flexDirection: 'row',
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  foodIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
  },
  foodIconText: {
    fontSize: 24,
  },
  foodMain: {
    flex: 1,
    marginLeft: 12,
  },
  foodMainNoIcon: {
    marginLeft: 2,
  },
  foodTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  foodNameWrap: {
    flex: 1,
  },
  foodName: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  foodRate: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 10,
  },
  removeGlyph: {
    marginTop: -7,
    color: colors.subtle,
    fontSize: 23,
    fontWeight: '300',
  },
  foodBottom: {
    marginTop: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gramStepper: {
    height: 34,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
  },
  gramButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gramButtonText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '500',
  },
  gramValue: {
    minWidth: 50,
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  foodProteinWrap: {
    alignItems: 'flex-end',
  },
  foodProteinValue: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '900',
  },
  foodProteinUnit: {
    color: colors.muted,
    fontSize: 9,
  },
  emptyFoods: {
    paddingVertical: 30,
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyFoodsTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  emptyFoodsText: {
    marginTop: 6,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  estimateNote: {
    marginTop: 8,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 16,
    backgroundColor: '#F0F1EA',
  },
  estimateNoteMark: {
    width: 19,
    height: 19,
    marginRight: 9,
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 19,
    textAlign: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.subtle,
  },
  estimateNoteText: {
    flex: 1,
    color: colors.muted,
    fontSize: 10,
    lineHeight: 16,
  },
  saveBar: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    minHeight: 88,
    paddingTop: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  totalLabel: {
    color: colors.muted,
    fontSize: 10,
  },
  totalValue: {
    marginTop: 4,
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900',
  },
  totalUnit: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  saveButton: {
    height: 52,
    minWidth: 132,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: colors.primary,
  },
  saveButtonDisabled: {
    backgroundColor: '#AEB9B0',
  },
  saveButtonPressed: {
    opacity: 0.78,
  },
  saveButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '800',
  },
});
