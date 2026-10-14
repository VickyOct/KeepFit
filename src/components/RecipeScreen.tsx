import { Alert } from '../alert';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { recipes, RECIPE_NUTRITION_NOTE, RECIPE_REVIEWED_ON } from '../recipes';
import { cantoneseRecipes } from '../cantoneseRecipes';
import { ENERGY_METHOD_NOTE, recipeEnergy } from '../recipeEnergy';
import { loadRecipeFavorites, toggleRecipeFavorite } from '../recipeStorage';
import type { Recipe, RecipeFilters, RecipeServings } from '../recipeTypes';
import { filterRecipes, ingredientQuantity } from '../recipeUtils';
import { colors } from '../theme';

const initialFilters: RecipeFilters = { meal: '全部', cuisine: '全部口味', query: '', quickOnly: false, favoritesOnly: false, collection: '港式菜单' };

async function openSource(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('暂时无法打开来源', '请检查网络后重试。食谱内容仍可离线查看。');
  }
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected }} onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
  </Pressable>;
}

export function RecipeScreen() {
  const [filters, setFilters] = useState(initialFilters);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoritesStatus, setFavoritesStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [servings, setServings] = useState<RecipeServings>(1);
  const [showGuide, setShowGuide] = useState(false);
  const [showEnergy, setShowEnergy] = useState(false);
  const mounted = useRef(false);
  const changingFavorite = useRef(false);
  const loadingFavorites = useRef(false);

  async function initializeFavorites() {
    if (loadingFavorites.current) return;
    loadingFavorites.current = true;
    setFavoritesStatus('loading');
    try {
      const stored = await loadRecipeFavorites();
      if (mounted.current) { setFavorites(stored); setFavoritesStatus('ready'); }
    } catch {
      if (mounted.current) setFavoritesStatus('error');
    } finally {
      loadingFavorites.current = false;
    }
  }

  useEffect(() => {
    mounted.current = true;
    void initializeFavorites();
    return () => { mounted.current = false; };
  }, []);

  async function toggleFavorite(id: string) {
    if (favoritesStatus !== 'ready' || changingFavorite.current) return;
    changingFavorite.current = true;
    setSaving(true);
    try {
      const next = await toggleRecipeFavorite(id);
      if (mounted.current) setFavorites(next);
    } catch {
      Alert.alert('收藏未保存', '原有收藏保持不变，请稍后重试。');
    } finally {
      changingFavorite.current = false;
      if (mounted.current) setSaving(false);
    }
  }

  const visible = useMemo(() => filterRecipes(recipes, filters, favorites), [filters, favorites]);
  const favoriteCount = recipes.filter((recipe) => favorites.includes(recipe.id)).length;
  const favoriteDisabled = favoritesStatus !== 'ready' || saving;
  const selectedEnergy = selected ? recipeEnergy(selected, servings) : null;
  const cuisines = filters.collection === '原有食谱'
    ? (['全部口味', '中式家常', '熟悉的西式'] as const)
    : (['全部口味', '粤菜', '茶餐厅'] as const);

  function favoriteButton(recipe: Recipe) {
    const saved = favorites.includes(recipe.id);
    return <Pressable accessibilityRole="button" accessibilityLabel={`${saved ? '取消收藏' : '收藏'}${recipe.name}`} accessibilityState={{ disabled: favoriteDisabled, selected: saved }} disabled={favoriteDisabled} onPress={() => void toggleFavorite(recipe.id)} style={[styles.favorite, favoriteDisabled && styles.disabled]}>
      <Text style={styles.favoriteText}>{saved ? '★ 已收藏' : '☆ 收藏'}</Text>
    </Pressable>;
  }

  return <View style={styles.screen}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>KEEPFIT · 每天好好吃饭</Text>
        <Text style={styles.title}>粤菜与茶餐厅</Text>
        <Text style={styles.subtitle}>简单基础的菜单，熟悉的日常味道。</Text>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>从一份早餐，到一碟家常菜</Text>
        <Text style={styles.heroText}>{cantoneseRecipes.length} 道基础菜单 · 普通家常做法{ '\n' }每份标注大概卡路里，米饭和配餐算清楚。</Text>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: showGuide }} onPress={() => setShowGuide(!showGuide)} style={styles.guideButton}>
          <Text style={styles.link}>{showGuide ? '收起热量说明 −' : '大概卡路里是怎样算的？ ＋'}</Text>
        </Pressable>
        {showGuide && <View style={styles.guide}>
          <Text style={styles.body}>这里的「卡路里」指千卡（kcal）。按每道菜列出的一份用量估算；单碟菜不自动包含米饭，饭类则明确计入米饭。饮品另计。</Text>
          <Text style={styles.note}>{ENERGY_METHOD_NOTE}</Text>
          <Text style={styles.note}>这是普通粤菜和茶餐厅家做版，不以低卡筛选；详情可以查看每项食材的估算依据。</Text>
        </View>}
      </View>

      <View style={styles.chips}>
        <Chip label="粤菜与茶餐厅菜单" selected={filters.collection === '港式菜单'} onPress={() => setFilters({ ...initialFilters })} />
        <Chip label="原有食谱" selected={filters.collection === '原有食谱'} onPress={() => setFilters({ ...initialFilters, collection: '原有食谱' })} />
      </View>
      <TextInput accessibilityLabel="搜索食谱或食材" value={filters.query} onChangeText={(query) => setFilters({ ...filters, query })} placeholder="搜通粉、炒蛋、牛河、吞拿鱼…" placeholderTextColor={colors.muted} style={styles.search} returnKeyType="search" />
      <View style={styles.chips}>
        {(['全部', '早餐', '午餐', '晚餐'] as const).map((meal) => <Chip key={meal} label={meal} selected={filters.meal === meal} onPress={() => setFilters({ ...filters, meal })} />)}
      </View>
      <View style={styles.chips}>
        {cuisines.map((cuisine) => <Chip key={cuisine} label={cuisine} selected={filters.cuisine === cuisine} onPress={() => setFilters({ ...filters, cuisine })} />)}
      </View>
      <View style={styles.chips}>
        <Chip label="20 分钟内" selected={filters.quickOnly} onPress={() => setFilters({ ...filters, quickOnly: !filters.quickOnly })} />
        <Chip label={`我的收藏${favoritesStatus === 'ready' ? ` · ${favoriteCount}` : ''}`} selected={filters.favoritesOnly} onPress={() => setFilters({ ...filters, favoritesOnly: !filters.favoritesOnly })} />
      </View>
      {favoritesStatus === 'loading' && <View style={styles.statusRow}><ActivityIndicator color={colors.primary} /><Text style={styles.note}>正在读取收藏，食谱可以先看。</Text></View>}
      {favoritesStatus === 'error' && <View style={styles.errorBox}>
        <Text style={styles.body}>收藏暂时无法读取，食谱仍可浏览。</Text>
        <Pressable accessibilityRole="button" onPress={() => void initializeFavorites()} style={styles.sourceButton}><Text style={styles.link}>重新读取收藏</Text></Pressable>
      </View>}
      {saving && <Text accessibilityLiveRegion="polite" style={styles.note}>正在保存收藏…</Text>}

      <View style={styles.resultsRow}><Text style={styles.sectionTitle}>{filters.favoritesOnly ? '收藏的味道' : '今天想吃哪一道'}</Text><Text style={styles.note}>{visible.length} 道</Text></View>
      {visible.map((recipe) => <View key={recipe.id} style={styles.card}>
        <Pressable accessibilityRole="button" accessibilityLabel={`查看${recipe.name}`} onPress={() => { setSelected(recipe); setServings(1); setShowEnergy(false); }} style={styles.cardMain}>
          <View style={styles.emojiBox}><Text style={styles.emoji}>{recipe.emoji}</Text></View>
          <View style={styles.cardText}>
            <Text style={styles.cardMeta}>{recipe.meal} · {recipe.cuisine}</Text>
            <Text style={styles.cardTitle}>{recipe.name}</Text>
            <Text style={styles.note}>{recipe.flavor}</Text>
            {recipeEnergy(recipe) && <Text style={styles.energy}>约 {recipeEnergy(recipe)!.perServing} 千卡 / 份</Text>}
            {recipe.energyPortion && <Text style={styles.smallNote}>{recipe.energyPortion.label}</Text>}
          </View>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
        <View style={styles.cardFooter}>
          <View style={styles.cardText}><Text style={styles.time}>约 {recipe.minutes} 分钟 · 1 人份</Text>{recipe.timeNote && <Text style={styles.smallNote}>{recipe.timeNote}</Text>}</View>
          {favoriteButton(recipe)}
        </View>
      </View>)}
      {visible.length === 0 && <View style={styles.empty}>
        <Text style={styles.sectionTitle}>{filters.favoritesOnly && favoritesStatus !== 'ready' ? '收藏尚未载入' : '暂时没有匹配的食谱'}</Text>
        <Text style={styles.body}>{filters.favoritesOnly ? '先收藏喜欢的菜，或切换菜单、放宽筛选。原有收藏可在「原有食谱」查看。' : '试试其他食材，或清除筛选看看本组全部三餐。'}</Text>
        <Pressable accessibilityRole="button" onPress={() => setFilters({ ...initialFilters, collection: filters.collection })} style={styles.sourceButton}><Text style={styles.link}>查看全部食谱</Text></Pressable>
      </View>}
      <Text style={styles.footer}>资料核对：{RECIPE_REVIEWED_ON} · 来源链接需联网{ '\n' }内容为 KeepFit 改编，原作者未审核或背书本版本。</Text>
    </ScrollView>

    <Modal visible={selected !== null} animationType="slide" onRequestClose={() => setSelected(null)}>
      <SafeAreaView style={styles.screen}>
        {selected && <>
          <View style={styles.detailNav}>
            <Pressable accessibilityRole="button" accessibilityLabel="返回食谱列表" onPress={() => setSelected(null)} style={styles.backButton}><Text style={styles.link}>‹ 返回食谱</Text></Pressable>
            {favoriteButton(selected)}
          </View>
          <ScrollView key={selected.id} contentContainerStyle={styles.detailPage}>
            <View style={styles.detailHero}>
              <Text style={styles.detailEmoji}>{selected.emoji}</Text>
              <Text style={styles.cardMeta}>{selected.meal} · {selected.cuisine}</Text>
              <Text style={styles.detailTitle}>{selected.name}</Text>
              <Text style={styles.body}>{selected.flavor} · 约 {selected.minutes} 分钟</Text>
              {selected.timeNote && <Text style={styles.note}>{selected.timeNote}</Text>}
            </View>
            {selectedEnergy && selected.energyPortion && <View style={[styles.panel, styles.tipPanel]}>
              <Text style={styles.sectionTitle}>大概卡路里</Text>
              <Text style={styles.energyLarge}>约 {selectedEnergy.perServing} 千卡 / 份</Text>
              <Text style={styles.body}>{selected.energyPortion.label}</Text>
              <Text style={styles.note}>{selected.energyPortion.includes}</Text>
              {servings > 1 && <Text style={styles.body}>{servings} 份合计约 {selectedEnergy.total} 千卡；每份热量不变。</Text>}
              <Pressable accessibilityRole="button" accessibilityLabel="查看热量估算明细" accessibilityState={{ expanded: showEnergy }} style={styles.sourceButton} onPress={() => setShowEnergy(!showEnergy)}><Text style={styles.link}>{showEnergy ? '收起估算明细 −' : '查看热量估算明细 ＋'}</Text></Pressable>
              {showEnergy && <View style={styles.guide}>
                <Text style={styles.note}>{ENERGY_METHOD_NOTE}</Text>
                <Text style={styles.note}>下面按 1 份计算，单项取整后可能与总数略有差异。</Text>
                {selectedEnergy.items.map((item) => <View key={item.name} style={styles.energyItem}>
                  <Text style={styles.body}>{item.name} · 约 {Math.round(item.kcal)} 千卡</Text>
                  <Text style={styles.smallNote}>{item.factor.kcalPer100} 千卡 / 100 克或毫升 · {item.factor.basis}</Text>
                  {item.factor.sourceUrl && <Pressable accessibilityRole="link" accessibilityLabel={`查看${item.name}热量来源`} onPress={() => void openSource(item.factor.sourceUrl!)} style={styles.sourceButton}><Text style={styles.link}>查看 USDA 食材数据 ↗</Text></Pressable>}
                </View>)}
              </View>}
            </View>}
            <View style={styles.panel}>
              <Text style={styles.sectionTitle}>准备几人份？</Text>
              <View style={styles.chips}>{([1, 2, 4] as const).map((count) => <Chip key={count} label={`${count} 人份`} selected={servings === count} onPress={() => setServings(count)} />)}</View>
              <Text style={styles.note}>用量随人数换算；时间为 1 人份估计，多份请分锅或分盘，按熟度调整。</Text>
              <Text style={styles.sectionTitle}>食材清单 · {servings} 人份</Text>
              {selected.ingredients.map((ingredient) => <View key={ingredient.name} style={styles.ingredient}>
                <View style={styles.cardText}><Text style={styles.body}>{ingredient.name}</Text>{ingredient.note && <Text style={styles.smallNote}>{ingredient.note}{servings > 1 ? '（备注以 1 人份计）' : ''}</Text>}</View>
                <Text style={styles.quantity}>{ingredientQuantity(ingredient, servings)}</Text>
              </View>)}
              <Text style={styles.note}>除特别注明外，按烹调前可食部分称重。水量可按锅具与喜好微调。</Text>
            </View>
            <View style={styles.panel}>
              <Text style={styles.sectionTitle}>跟着做</Text>
              {selected.steps.map((step, index) => <View key={step} style={styles.step}><Text style={styles.stepNumber}>{index + 1}</Text><Text style={[styles.body, styles.cardText]}>{step}</Text></View>)}
            </View>
            <View style={[styles.panel, styles.tipPanel]}>
              <Text style={styles.sectionTitle}>份量小提醒</Text><Text style={styles.body}>{selected.portionTip}</Text>
              <Text style={styles.note}>用量是家做版一份的参考，可按食量调整；米饭、饮品和额外配料请按实际搭配计入。</Text>
              <Text style={styles.note}>{selectedEnergy ? '热量是食材用量的粗估，不是餐厅出品的实测值，也不会自动写入饮食记录。' : RECIPE_NUTRITION_NOTE}</Text>
            </View>
            <View style={styles.panel}>
              <Text style={styles.sectionTitle}>原始来源与改编</Text>
              <Text style={styles.body}>{selected.adaptation}</Text>
              <Text style={styles.note}>{selected.source.publisher}{'\n'}{selected.source.title}</Text>
              <Pressable accessibilityRole="link" accessibilityLabel="查看原始食谱" onPress={() => void openSource(selected.source.url)} style={styles.sourceButton}><Text style={styles.link}>查看原始食谱 ↗</Text></Pressable>
              <Text selectable style={styles.smallNote}>{selected.source.url}</Text>
              <Text style={styles.note}>核对日期：{RECIPE_REVIEWED_ON} · 改编版未做实厨房测试。</Text>
            </View>
            <Text style={styles.note}>主要过敏原：{selected.allergens.join('、')}。酱料与包装食品请核对实际配料表。</Text>
          </ScrollView>
        </>}
      </SafeAreaView>
    </Modal>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  page: { padding: 20, paddingBottom: 32, gap: 12 },
  header: { paddingTop: 12, paddingBottom: 6, gap: 8 },
  eyebrow: { fontSize: 11, letterSpacing: 1.3, color: colors.primary, fontWeight: '700' },
  title: { fontSize: 30, fontWeight: '800', color: colors.ink },
  subtitle: { fontSize: 14, lineHeight: 21, color: colors.muted },
  hero: { backgroundColor: colors.primarySoft, padding: 20, borderRadius: 22, gap: 10 },
  heroTitle: { fontSize: 18, fontWeight: '700', color: colors.primary, lineHeight: 26 },
  heroText: { color: colors.primary, fontSize: 13, lineHeight: 23 },
  guideButton: { minHeight: 44, justifyContent: 'center' },
  guide: { gap: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border },
  search: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingVertical: 14, color: colors.ink, fontSize: 14, minHeight: 50 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 44, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 15, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, justifyContent: 'center' },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.muted },
  chipTextSelected: { color: colors.surface },
  resultsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 12, paddingBottom: 2 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.ink, lineHeight: 25 },
  card: { borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  cardMain: { flexDirection: 'row', padding: 16, gap: 12, alignItems: 'center' },
  emojiBox: { width: 56, height: 66, borderRadius: 18, backgroundColor: colors.primaryPale, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 30 },
  cardText: { flex: 1, gap: 4 },
  cardMeta: { fontSize: 11, fontWeight: '600', color: colors.primary },
  cardTitle: { fontSize: 17, fontWeight: '700', lineHeight: 25, color: colors.ink },
  arrow: { fontSize: 27, color: colors.muted },
  cardFooter: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12 },
  time: { color: colors.ink, fontSize: 12, lineHeight: 18 },
  energy: { color: colors.primary, fontSize: 15, lineHeight: 23, fontWeight: '700' },
  energyLarge: { color: colors.primary, fontSize: 25, lineHeight: 34, fontWeight: '800' },
  energyItem: { gap: 4, paddingBottom: 8 },
  favorite: { paddingHorizontal: 12, minHeight: 44, justifyContent: 'center', borderRadius: 14, backgroundColor: colors.primaryPale },
  favoriteText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  disabled: { opacity: 0.45 },
  body: { color: colors.ink, fontSize: 14, lineHeight: 23 },
  note: { color: colors.muted, fontSize: 12, lineHeight: 20 },
  smallNote: { color: colors.muted, fontSize: 11, lineHeight: 17 },
  link: { color: colors.primary, fontSize: 14, fontWeight: '700', lineHeight: 22 },
  sourceButton: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  empty: { alignItems: 'flex-start', padding: 22, gap: 10, borderRadius: 18, backgroundColor: colors.surface },
  errorBox: { padding: 14, borderRadius: 14, backgroundColor: colors.dangerSoft },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  footer: { textAlign: 'center', fontSize: 11, lineHeight: 19, color: colors.muted, paddingTop: 12 },
  detailNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  backButton: { minHeight: 44, paddingHorizontal: 4, justifyContent: 'center' },
  detailPage: { padding: 20, paddingBottom: 40, gap: 16 },
  detailHero: { gap: 12, paddingVertical: 8 },
  detailEmoji: { fontSize: 48 },
  detailTitle: { fontSize: 28, lineHeight: 37, fontWeight: '800', color: colors.ink },
  panel: { borderRadius: 20, padding: 18, backgroundColor: colors.surface, gap: 14 },
  tipPanel: { backgroundColor: colors.primaryPale },
  ingredient: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  quantity: { fontSize: 14, lineHeight: 23, color: colors.primary, fontWeight: '700' },
  step: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepNumber: { width: 26, lineHeight: 26, textAlign: 'center', borderRadius: 13, overflow: 'hidden', backgroundColor: colors.primarySoft, color: colors.primary, fontWeight: '700' },
});
