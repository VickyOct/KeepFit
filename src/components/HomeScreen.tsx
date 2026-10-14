import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, shadows } from '../theme';
import type { MealRecord, ReminderStatus } from '../types';
import { formatLongDate, formatTime, roundProtein } from '../utils';
import { WebTools } from './WebTools';

type Props = {
  meals: MealRecord[];
  proteinTarget: number;
  todayProtein: number;
  onCapture: () => void;
  onEditTarget: () => void;
  reminderStatus: ReminderStatus;
  onSetupReminders: () => void;
  onSeeHistory: () => void;
};

export function HomeScreen({
  meals,
  proteinTarget,
  todayProtein,
  onCapture,
  onEditTarget,
  reminderStatus,
  onSetupReminders,
  onSeeHistory,
}: Props) {
  const progress = Math.min(todayProtein / proteinTarget, 1);
  const remaining = Math.max(proteinTarget - todayProtein, 0);
  const displayProtein = roundProtein(todayProtein);
  const reminderStatusText = {
    checking: '设置中',
    scheduled: '已开启',
    denied: '去开启',
    error: '重试',
    unsupported: '未支持',
  }[reminderStatus];

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.page}
    >
      <View style={styles.topRow}>
        <View>
          <Text style={styles.brand}>KEEPFIT</Text>
          <Text style={styles.date}>{formatLongDate(new Date())}</Text>
        </View>
        <View style={styles.avatar}>
          <View style={styles.avatarDot} />
          <Text style={styles.avatarText}>K</Text>
        </View>
      </View>

      <Text style={styles.headline}>把今天吃的，{`\n`}简单记下来。</Text>

      <View style={styles.progressCard}>
        <View style={styles.progressTop}>
          <View>
            <Text style={styles.progressLabel}>今日蛋白质</Text>
            <View style={styles.progressNumberRow}>
              <Text style={styles.progressNumber}>{displayProtein}</Text>
              <Text style={styles.progressUnit}> / {proteinTarget} 克</Text>
            </View>
          </View>
          <Pressable style={styles.targetButton} onPress={onEditTarget}>
            <Text style={styles.targetButtonText}>调整目标</Text>
          </Pressable>
        </View>

        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.max(progress * 100, 2)}%` }]} />
        </View>

        <View style={styles.progressFooter}>
          <Text style={styles.progressHint}>
            {remaining > 0 ? `还差约 ${roundProtein(remaining)} 克` : '今天的目标已完成'}
          </Text>
          <Text style={styles.progressPercent}>{Math.round(progress * 100)}%</Text>
        </View>
      </View>

      <View style={styles.metrics}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>已记录</Text>
          <Text style={styles.metricValue}>{meals.length}<Text style={styles.metricUnit}> 餐</Text></Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>平均每餐</Text>
          <Text style={styles.metricValue}>
            {meals.length ? roundProtein(todayProtein / meals.length) : 0}
            <Text style={styles.metricUnit}> 克</Text>
          </Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [styles.captureCard, pressed && styles.capturePressed]}
        onPress={onCapture}
      >
        <View style={styles.captureIcon}>
          <View style={styles.lensOuter}>
            <View style={styles.lensInner} />
          </View>
        </View>
        <View style={styles.captureCopy}>
          <Text style={styles.captureTitle}>拍下这一餐</Text>
          <Text style={styles.captureSubtitle}>识别食物后，再确认实际份量</Text>
        </View>
        <Text style={styles.captureArrow}>›</Text>
      </Pressable>

      <View style={styles.reminderCard}>
        <View style={styles.reminderIcon}>
          <Text style={styles.reminderIconText}>铃</Text>
        </View>
        <View style={styles.reminderCopy}>
          <Text style={styles.reminderTitle}>每日记录提醒</Text>
          <Text style={styles.reminderTimes}>{reminderStatus === 'unsupported' ? '网页版暂不支持定时通知，可使用 iPhone「提醒事项」。' : '09:00 · 12:00 · 18:00'}</Text>
        </View>
        {reminderStatus === 'scheduled' ? (
          <View style={styles.reminderStatusPill}>
            <View style={styles.reminderStatusDot} />
            <Text style={styles.reminderStatusText}>{reminderStatusText}</Text>
          </View>
        ) : reminderStatus === 'unsupported' ? null : (
          <Pressable
            disabled={reminderStatus === 'checking'}
            style={styles.reminderAction}
            onPress={onSetupReminders}
          >
            <Text style={styles.reminderActionText}>{reminderStatusText}</Text>
          </Pressable>
        )}
      </View>

      <WebTools />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>今天的记录</Text>
        {meals.length > 0 && (
          <Pressable onPress={onSeeHistory}>
            <Text style={styles.sectionAction}>查看全部</Text>
          </Pressable>
        )}
      </View>

      {meals.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyMark}>
            <Text style={styles.emptyMarkText}>＋</Text>
          </View>
          <Text style={styles.emptyTitle}>今天还没有记录</Text>
          <Text style={styles.emptyText}>拍一张照片开始，份量和食物都可以稍后修改。</Text>
        </View>
      ) : (
        <View style={styles.mealList}>
          {meals.slice(0, 3).map((meal) => (
            <View key={meal.id} style={styles.mealCard}>
              {meal.imageUri ? (
                <Image source={{ uri: meal.imageUri }} style={styles.mealImage} />
              ) : (
                <View style={styles.mealImageFallback}>
                  <Text style={styles.mealImageFallbackText}>餐</Text>
                </View>
              )}
              <View style={styles.mealContent}>
                <View style={styles.mealTitleRow}>
                  <Text style={styles.mealTitle}>{meal.mealType}</Text>
                  <Text style={styles.mealTime}>{formatTime(new Date(meal.createdAt))}</Text>
                </View>
                <Text numberOfLines={1} style={styles.mealFoods}>
                  {meal.foods.map((food) => food.name).join(' · ')}
                </Text>
                <Text style={styles.mealProtein}>约 {meal.totalProtein} 克蛋白质</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.disclaimer}>营养数值为估算值，仅用于日常记录。</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },
  date: {
    marginTop: 5,
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  avatar: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  avatarText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '900',
  },
  headline: {
    marginTop: 27,
    color: colors.ink,
    fontSize: 31,
    lineHeight: 39,
    fontWeight: '800',
    letterSpacing: -1.2,
  },
  progressCard: {
    marginTop: 24,
    padding: 20,
    borderRadius: 24,
    backgroundColor: colors.primary,
    ...shadows.card,
  },
  progressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    color: '#CDE0D2',
    fontSize: 12,
    fontWeight: '700',
  },
  progressNumberRow: {
    marginTop: 7,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  progressNumber: {
    color: colors.surface,
    fontSize: 35,
    fontWeight: '800',
    letterSpacing: -1.2,
  },
  progressUnit: {
    color: '#BFD2C4',
    fontSize: 14,
    fontWeight: '600',
  },
  targetButton: {
    height: 32,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  targetButtonText: {
    color: '#E4EFE7',
    fontSize: 11,
    fontWeight: '700',
  },
  track: {
    height: 8,
    marginTop: 20,
    overflow: 'hidden',
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  fill: {
    height: '100%',
    maxWidth: '100%',
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  progressFooter: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressHint: {
    color: '#BFD2C4',
    fontSize: 12,
  },
  progressPercent: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '800',
  },
  metrics: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 17,
    borderRadius: 19,
    backgroundColor: colors.surface,
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  metricValue: {
    marginTop: 7,
    color: colors.ink,
    fontSize: 22,
    fontWeight: '800',
  },
  metricUnit: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  captureCard: {
    minHeight: 96,
    marginTop: 22,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#DCE5D9',
    ...shadows.card,
  },
  capturePressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
  captureIcon: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: colors.primarySoft,
  },
  lensOuter: {
    width: 25,
    height: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  lensInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  captureCopy: {
    flex: 1,
    marginLeft: 14,
  },
  captureTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  captureSubtitle: {
    marginTop: 6,
    color: colors.muted,
    fontSize: 12,
  },
  captureArrow: {
    color: colors.primary,
    fontSize: 30,
    fontWeight: '300',
  },
  reminderCard: {
    minHeight: 72,
    marginTop: 12,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 19,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reminderIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
  },
  reminderIconText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  reminderCopy: {
    flex: 1,
    marginLeft: 12,
  },
  reminderTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  reminderTimes: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 11,
  },
  reminderStatusPill: {
    height: 29,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: colors.primaryPale,
  },
  reminderStatusDot: {
    width: 6,
    height: 6,
    marginRight: 5,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  reminderStatusText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  reminderAction: {
    height: 31,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: colors.primarySoft,
  },
  reminderActionText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  sectionHeader: {
    marginTop: 29,
    marginBottom: 13,
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
  sectionAction: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    paddingVertical: 28,
    paddingHorizontal: 30,
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyMark: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: colors.surface,
  },
  emptyMarkText: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '300',
  },
  emptyTitle: {
    marginTop: 13,
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  emptyText: {
    maxWidth: 245,
    marginTop: 7,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  mealList: {
    gap: 10,
  },
  mealCard: {
    minHeight: 88,
    padding: 10,
    flexDirection: 'row',
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  mealImage: {
    width: 68,
    height: 68,
    borderRadius: 15,
    backgroundColor: colors.surfaceMuted,
  },
  mealImageFallback: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: colors.primarySoft,
  },
  mealImageFallbackText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  mealContent: {
    flex: 1,
    marginLeft: 13,
    paddingVertical: 3,
  },
  mealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mealTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  mealTime: {
    color: colors.subtle,
    fontSize: 11,
  },
  mealFoods: {
    marginTop: 5,
    color: colors.muted,
    fontSize: 12,
  },
  mealProtein: {
    marginTop: 6,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  disclaimer: {
    marginTop: 20,
    color: colors.subtle,
    fontSize: 10,
    textAlign: 'center',
  },
});
