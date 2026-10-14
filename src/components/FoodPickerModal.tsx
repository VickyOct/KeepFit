import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FOOD_CATALOG, FOOD_CATEGORIES } from '../data/foods';
import { searchUsdaFoods } from '../services/foodDatabase';
import { colors } from '../theme';
import type { FoodCatalogItem } from '../types';
import { createId } from '../utils';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (food: FoodCatalogItem) => void;
};

type OnlineState = 'idle' | 'loading' | 'success' | 'error';

export function FoodPickerModal({ visible, onClose, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<(typeof FOOD_CATEGORIES)[number]>('全部');
  const [onlineFoods, setOnlineFoods] = useState<FoodCatalogItem[]>([]);
  const [onlineState, setOnlineState] = useState<OnlineState>('idle');
  const [manualOpen, setManualOpen] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualProtein, setManualProtein] = useState('');
  const [manualGrams, setManualGrams] = useState('100');
  const insets = useSafeAreaInsets();

  const normalizedQuery = query.trim().toLowerCase();

  const localFoods = useMemo(() => {
    return FOOD_CATALOG.filter((food) => {
      const inCategory = category === '全部' || food.category === category;
      const searchableText = [food.name, ...(food.searchTerms ?? [])].join(' ').toLowerCase();
      return inCategory && (!normalizedQuery || searchableText.includes(normalizedQuery));
    });
  }, [category, normalizedQuery]);

  useEffect(() => {
    if (!visible || normalizedQuery.length < 2) {
      setOnlineFoods([]);
      setOnlineState('idle');
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setOnlineState('loading');
      searchUsdaFoods(normalizedQuery, controller.signal)
        .then((foods) => {
          setOnlineFoods(foods);
          setOnlineState('success');
        })
        .catch((error: unknown) => {
          if (error instanceof Error && error.name === 'AbortError') return;
          setOnlineFoods([]);
          setOnlineState('error');
        });
    }, 450);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [normalizedQuery, visible]);

  function resetAndClose() {
    setQuery('');
    setCategory('全部');
    setOnlineFoods([]);
    setOnlineState('idle');
    setManualOpen(false);
    setManualName('');
    setManualProtein('');
    setManualGrams('100');
    onClose();
  }

  function choose(food: FoodCatalogItem) {
    onSelect(food);
    setQuery('');
    setCategory('全部');
    setManualOpen(false);
  }

  function updateQuery(value: string) {
    setQuery(value);
    if (value.trim()) setCategory('全部');
  }

  const proteinValue = Number(manualProtein.replace(',', '.'));
  const gramValue = Number(manualGrams.replace(',', '.'));
  const manualReady =
    manualName.trim().length > 0 &&
    Number.isFinite(proteinValue) &&
    proteinValue >= 0 &&
    proteinValue <= 100 &&
    Number.isFinite(gramValue) &&
    gramValue > 0 &&
    gramValue <= 1000;

  function addManualFood() {
    if (!manualReady) return;
    choose({
      id: createId('custom'),
      name: manualName.trim(),
      emoji: '',
      proteinPer100g: Math.round(proteinValue * 10) / 10,
      defaultGrams: Math.round(gramValue),
      tint: '#E8E6EF',
      category: '自定义',
      source: 'manual',
    });
  }

  function renderFoodRow(food: FoodCatalogItem, sourceLabel?: string) {
    return (
      <Pressable
        key={food.id}
        style={({ pressed }) => [styles.foodRow, pressed && styles.foodRowPressed]}
        onPress={() => choose(food)}
      >
        {food.emoji ? (
          <View style={[styles.foodIcon, { backgroundColor: food.tint }]}>
            <Text style={styles.foodIconText}>{food.emoji}</Text>
          </View>
        ) : null}
        <View style={[styles.foodCopy, !food.emoji && styles.foodCopyNoIcon]}>
          <View style={styles.foodNameRow}>
            <Text numberOfLines={2} style={styles.foodName}>{food.name}</Text>
            {sourceLabel ? <Text style={styles.sourcePill}>{sourceLabel}</Text> : null}
          </View>
          <Text style={styles.foodMeta}>默认 {food.defaultGrams} 克 · 每 100 克</Text>
        </View>
        <Text style={styles.proteinValue}>{food.proteinPer100g}g</Text>
        <Text style={styles.addGlyph}>＋</Text>
      </Pressable>
    );
  }

  return (
    <Modal animationType="slide" visible={visible} onRequestClose={resetAndClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.page, { paddingTop: Math.max(insets.top, 18) }]}
      >
        <View style={styles.header}>
          <Pressable accessibilityLabel="关闭食物菜单" style={styles.closeButton} onPress={resetAndClose}>
            <Text style={styles.closeGlyph}>×</Text>
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>添加食物</Text>
            <Text style={styles.headerHint}>本地菜单 + 在线营养库</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.searchBox}>
          <Text style={styles.searchGlyph}>⌕</Text>
          <TextInput
            autoCorrect={false}
            placeholder="搜索：鸡蛋、牛肉、cheese…"
            placeholderTextColor={colors.subtle}
            returnKeyType="search"
            style={styles.searchInput}
            value={query}
            onChangeText={updateQuery}
          />
          {query ? (
            <Pressable accessibilityLabel="清除搜索" hitSlop={10} onPress={() => setQuery('')}>
              <Text style={styles.clearGlyph}>×</Text>
            </Pressable>
          ) : null}
        </View>

        {!normalizedQuery ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
          >
            {FOOD_CATEGORIES.map((item) => {
              const selected = item === category;
              return (
                <Pressable
                  key={item}
                  style={[styles.categoryChip, selected && styles.categoryChipSelected]}
                  onPress={() => setCategory(item)}
                >
                  <Text style={[styles.categoryText, selected && styles.categoryTextSelected]}>{item}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.list, { paddingBottom: Math.max(insets.bottom, 24) }]}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>{normalizedQuery ? '本地匹配' : `${category}菜单`}</Text>
            <Text style={styles.sectionCount}>{localFoods.length} 种</Text>
          </View>
          {localFoods.map((food) => renderFoodRow(food))}

          {normalizedQuery.length >= 2 ? (
            <View style={styles.onlineSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.onlineTitleRow}>
                  <Text style={styles.sectionLabel}>在线完整食物库</Text>
                  <Text style={styles.usdaPill}>USDA</Text>
                </View>
                {onlineState === 'loading' ? <ActivityIndicator color={colors.primary} size="small" /> : null}
              </View>

              {onlineState === 'success' && onlineFoods.map((food) => renderFoodRow(food, '在线'))}

              {onlineState === 'success' && onlineFoods.length === 0 ? (
                <Text style={styles.statusText}>在线营养库也没有找到匹配项。</Text>
              ) : null}

              {onlineState === 'error' ? (
                <View style={styles.onlineError}>
                  <Text style={styles.onlineErrorTitle}>在线搜索暂时不可用</Text>
                  <Text style={styles.statusText}>本地菜单和手动添加仍可正常使用。</Text>
                </View>
              ) : null}

              <Text style={styles.onlineNote}>在线结果可能包含不同品牌或烹饪方式，请选择最接近的一项。</Text>
            </View>
          ) : null}

          <View style={styles.manualSection}>
            <Pressable style={styles.manualToggle} onPress={() => setManualOpen((current) => !current)}>
              <View>
                <Text style={styles.manualTitle}>找不到？手动添加</Text>
                <Text style={styles.manualHint}>填写包装上的每 100 克蛋白质</Text>
              </View>
              <Text style={styles.manualGlyph}>{manualOpen ? '−' : '＋'}</Text>
            </Pressable>

            {manualOpen ? (
              <View style={styles.manualForm}>
                <Text style={styles.inputLabel}>食物名称</Text>
                <TextInput
                  placeholder="例如：我的蛋白棒"
                  placeholderTextColor={colors.subtle}
                  style={styles.formInput}
                  value={manualName}
                  onChangeText={setManualName}
                />
                <View style={styles.formRow}>
                  <View style={styles.formColumn}>
                    <Text style={styles.inputLabel}>蛋白质 / 100克</Text>
                    <View style={styles.numberInputWrap}>
                      <TextInput
                        keyboardType="decimal-pad"
                        placeholder="20"
                        placeholderTextColor={colors.subtle}
                        style={styles.numberInput}
                        value={manualProtein}
                        onChangeText={setManualProtein}
                      />
                      <Text style={styles.inputUnit}>克</Text>
                    </View>
                  </View>
                  <View style={styles.formColumn}>
                    <Text style={styles.inputLabel}>本次份量</Text>
                    <View style={styles.numberInputWrap}>
                      <TextInput
                        keyboardType="decimal-pad"
                        placeholder="100"
                        placeholderTextColor={colors.subtle}
                        style={styles.numberInput}
                        value={manualGrams}
                        onChangeText={setManualGrams}
                      />
                      <Text style={styles.inputUnit}>克</Text>
                    </View>
                  </View>
                </View>
                <Pressable
                  disabled={!manualReady}
                  style={[styles.manualAddButton, !manualReady && styles.manualAddButtonDisabled]}
                  onPress={addManualFood}
                >
                  <Text style={styles.manualAddButtonText}>添加到这一餐</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  header: {
    height: 58,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  closeGlyph: { color: colors.ink, fontSize: 26, lineHeight: 29, fontWeight: '300' },
  headerCopy: { alignItems: 'center' },
  headerTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  headerHint: { marginTop: 2, color: colors.muted, fontSize: 10 },
  headerSpacer: { width: 40 },
  searchBox: {
    height: 50,
    marginTop: 8,
    marginHorizontal: 20,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchGlyph: { marginRight: 10, color: colors.muted, fontSize: 23 },
  searchInput: { flex: 1, color: colors.ink, fontSize: 15 },
  clearGlyph: { color: colors.subtle, fontSize: 21 },
  categoryList: { paddingTop: 15, paddingHorizontal: 20, paddingBottom: 3, gap: 8 },
  categoryChip: {
    height: 34,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  categoryTextSelected: { color: colors.surface },
  list: { paddingTop: 16, paddingHorizontal: 20 },
  sectionHeader: {
    minHeight: 28,
    marginBottom: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  sectionCount: { color: colors.muted, fontSize: 11 },
  onlineTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  usdaPill: {
    paddingVertical: 3,
    paddingHorizontal: 7,
    overflow: 'hidden',
    borderRadius: 7,
    backgroundColor: colors.primarySoft,
    color: colors.primary,
    fontSize: 9,
    fontWeight: '900',
  },
  foodRow: {
    minHeight: 74,
    marginBottom: 9,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  foodRowPressed: { opacity: 0.7, transform: [{ scale: 0.99 }] },
  foodIcon: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 15 },
  foodIconText: { fontSize: 23 },
  foodCopy: { flex: 1, marginLeft: 12 },
  foodCopyNoIcon: { marginLeft: 2 },
  foodNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  foodName: { flexShrink: 1, color: colors.ink, fontSize: 14, lineHeight: 18, fontWeight: '700' },
  sourcePill: {
    paddingVertical: 2,
    paddingHorizontal: 5,
    overflow: 'hidden',
    borderRadius: 6,
    backgroundColor: '#EEF1EA',
    color: colors.muted,
    fontSize: 8,
    fontWeight: '800',
  },
  foodMeta: { marginTop: 4, color: colors.muted, fontSize: 11 },
  proteinValue: { marginLeft: 8, color: colors.primary, fontSize: 13, fontWeight: '800' },
  addGlyph: { marginLeft: 8, color: colors.muted, fontSize: 20, fontWeight: '300' },
  onlineSection: { marginTop: 19 },
  onlineNote: { marginTop: 3, color: colors.subtle, fontSize: 10, lineHeight: 15 },
  statusText: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  onlineError: {
    marginBottom: 8,
    padding: 13,
    borderRadius: 14,
    backgroundColor: colors.dangerSoft,
  },
  onlineErrorTitle: { marginBottom: 3, color: colors.danger, fontSize: 12, fontWeight: '800' },
  manualSection: {
    marginTop: 22,
    overflow: 'hidden',
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  manualToggle: {
    minHeight: 70,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  manualTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  manualHint: { marginTop: 4, color: colors.muted, fontSize: 11 },
  manualGlyph: { color: colors.primary, fontSize: 20 },
  manualForm: { paddingHorizontal: 16, paddingBottom: 16 },
  inputLabel: { marginBottom: 6, color: colors.muted, fontSize: 10, fontWeight: '700' },
  formInput: {
    height: 46,
    paddingHorizontal: 13,
    borderRadius: 13,
    backgroundColor: colors.surfaceMuted,
    color: colors.ink,
    fontSize: 14,
  },
  formRow: { marginTop: 13, flexDirection: 'row', gap: 10 },
  formColumn: { flex: 1 },
  numberInputWrap: {
    height: 46,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 13,
    backgroundColor: colors.surfaceMuted,
  },
  numberInput: { flex: 1, color: colors.ink, fontSize: 14 },
  inputUnit: { color: colors.muted, fontSize: 11 },
  manualAddButton: {
    height: 46,
    marginTop: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.primary,
  },
  manualAddButtonDisabled: { backgroundColor: '#AEB9B0' },
  manualAddButtonText: { color: colors.surface, fontSize: 13, fontWeight: '800' },
});
