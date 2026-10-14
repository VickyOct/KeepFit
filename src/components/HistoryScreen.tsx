import { Alert } from '../alert';
import { useMemo } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';
import type { MealRecord } from '../types';
import { formatHistoryDate, formatTime, getLocalDateKey, roundProtein } from '../utils';

type Props = {
  meals: MealRecord[];
  onDeleteMeal: (id: string) => void | Promise<void>;
};

type MealGroup = {
  key: string;
  date: Date;
  meals: MealRecord[];
  totalProtein: number;
};

export function HistoryScreen({ meals, onDeleteMeal }: Props) {
  const groups = useMemo<MealGroup[]>(() => {
    const grouped = new Map<string, MealRecord[]>();

    meals.forEach((meal) => {
      const key = getLocalDateKey(new Date(meal.createdAt));
      grouped.set(key, [...(grouped.get(key) ?? []), meal]);
    });

    return Array.from(grouped.entries())
      .sort(([first], [second]) => second.localeCompare(first))
      .map(([key, entries]) => ({
        key,
        date: new Date(entries[0].createdAt),
        meals: entries,
        totalProtein: roundProtein(entries.reduce((sum, meal) => sum + meal.totalProtein, 0)),
      }));
  }, [meals]);

  function confirmDelete(meal: MealRecord) {
    Alert.alert('删除这条记录？', `${meal.mealType}的记录将从手机中移除。`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => onDeleteMeal(meal.id) },
    ]);
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.page}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>KEEPFIT</Text>
          <Text style={styles.title}>饮食记录</Text>
        </View>
        <View style={styles.counter}>
          <Text style={styles.counterValue}>{meals.length}</Text>
          <Text style={styles.counterLabel}>餐</Text>
        </View>
      </View>

      {groups.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyMark}>
            <Text style={styles.emptyGlyph}>≡</Text>
          </View>
          <Text style={styles.emptyTitle}>还没有饮食记录</Text>
          <Text style={styles.emptyText}>点击下方“记录”，拍摄第一餐后会出现在这里。</Text>
        </View>
      ) : (
        groups.map((group) => (
          <View key={group.key} style={styles.group}>
            <View style={styles.groupHeader}>
              <View>
                <Text style={styles.groupDate}>{formatHistoryDate(group.date)}</Text>
                <Text style={styles.groupCount}>{group.meals.length} 餐</Text>
              </View>
              <View style={styles.dayTotal}>
                <Text style={styles.dayTotalValue}>{group.totalProtein}</Text>
                <Text style={styles.dayTotalUnit}> 克蛋白质</Text>
              </View>
            </View>

            <View style={styles.mealList}>
              {group.meals.map((meal) => (
                <View key={meal.id} style={styles.mealCard}>
                  {meal.imageUri ? (
                    <Image source={{ uri: meal.imageUri }} style={styles.image} />
                  ) : (
                    <View style={styles.imageFallback}>
                      <Text style={styles.imageFallbackText}>餐</Text>
                    </View>
                  )}

                  <View style={styles.mealBody}>
                    <View style={styles.mealTop}>
                      <View style={styles.mealNameRow}>
                        <Text style={styles.mealName}>{meal.mealType}</Text>
                        <Text style={styles.mealTime}>{formatTime(new Date(meal.createdAt))}</Text>
                      </View>
                      <Pressable accessibilityLabel={`删除${meal.mealType}记录`} hitSlop={10} onPress={() => confirmDelete(meal)}>
                        <Text style={styles.moreGlyph}>•••</Text>
                      </Pressable>
                    </View>

                    <Text numberOfLines={2} style={styles.foodNames}>
                      {meal.foods.map((food) => `${food.name} ${food.grams}g`).join(' · ')}
                    </Text>
                    <Text style={styles.protein}>约 {meal.totalProtein} 克蛋白质</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))
      )}

      <Text style={styles.footer}>照片和记录仅保存在当前设备中。</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 20,
    paddingTop: 17,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },
  title: {
    marginTop: 8,
    color: colors.ink,
    fontSize: 31,
    fontWeight: '800',
    letterSpacing: -1.1,
  },
  counter: {
    height: 45,
    minWidth: 64,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
  },
  counterValue: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '900',
  },
  counterLabel: {
    marginLeft: 4,
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  empty: {
    marginTop: 58,
    paddingVertical: 52,
    paddingHorizontal: 28,
    alignItems: 'center',
    borderRadius: 25,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyMark: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: colors.primaryPale,
  },
  emptyGlyph: {
    color: colors.primary,
    fontSize: 29,
    lineHeight: 31,
    fontWeight: '500',
  },
  emptyTitle: {
    marginTop: 20,
    color: colors.ink,
    fontSize: 17,
    fontWeight: '800',
  },
  emptyText: {
    maxWidth: 245,
    marginTop: 8,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  group: {
    marginTop: 29,
  },
  groupHeader: {
    marginBottom: 12,
    paddingHorizontal: 2,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  groupDate: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '800',
  },
  groupCount: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 11,
  },
  dayTotal: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  dayTotalValue: {
    color: colors.primary,
    fontSize: 19,
    fontWeight: '900',
  },
  dayTotalUnit: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '600',
  },
  mealList: {
    gap: 10,
  },
  mealCard: {
    minHeight: 106,
    padding: 11,
    flexDirection: 'row',
    borderRadius: 21,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: {
    width: 82,
    height: 82,
    borderRadius: 17,
    backgroundColor: colors.surfaceMuted,
  },
  imageFallback: {
    width: 82,
    height: 82,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: colors.primarySoft,
  },
  imageFallbackText: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '900',
  },
  mealBody: {
    flex: 1,
    marginLeft: 13,
    paddingVertical: 2,
  },
  mealTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  mealNameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  mealName: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  mealTime: {
    color: colors.subtle,
    fontSize: 10,
  },
  moreGlyph: {
    marginTop: -7,
    color: colors.subtle,
    fontSize: 14,
    letterSpacing: 1,
  },
  foodNames: {
    minHeight: 30,
    marginTop: 8,
    color: colors.muted,
    fontSize: 11,
    lineHeight: 15,
  },
  protein: {
    marginTop: 6,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  footer: {
    marginTop: 25,
    color: colors.subtle,
    fontSize: 10,
    textAlign: 'center',
  },
});
