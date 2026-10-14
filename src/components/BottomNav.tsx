import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../theme';

type Props = {
  active: 'home' | 'history' | 'workout' | 'recipes' | 'referee';
  onHome: () => void;
  onCapture: () => void;
  onHistory: () => void;
  onWorkout: () => void;
  onRecipes: () => void;
  onReferee: () => void;
};

export function BottomNav({ active, onHome, onCapture, onHistory, onWorkout, onRecipes, onReferee }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.shell, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <Pressable accessibilityRole="button" accessibilityState={{ selected: active === 'home' }} style={styles.tab} onPress={onHome}>
        <View style={[styles.tabIcon, active === 'home' && styles.tabIconActive]}>
          <Text style={[styles.tabGlyph, active === 'home' && styles.tabGlyphActive]}>⌂</Text>
        </View>
        <Text style={[styles.tabLabel, active === 'home' && styles.tabLabelActive]}>今日</Text>
      </Pressable>

      <Pressable accessibilityRole="button" accessibilityState={{ selected: active === 'workout' }} style={styles.tab} onPress={onWorkout}>
        <View style={[styles.tabIcon, active === 'workout' && styles.tabIconActive]}>
          <View style={styles.dumbbell}>
            <View style={[styles.dumbbellEnd, active === 'workout' && styles.dumbbellActive]} />
            <View style={[styles.dumbbellBar, active === 'workout' && styles.dumbbellActive]} />
            <View style={[styles.dumbbellEnd, active === 'workout' && styles.dumbbellActive]} />
          </View>
        </View>
        <Text style={[styles.tabLabel, active === 'workout' && styles.tabLabelActive]}>健身</Text>
      </Pressable>

      <Pressable accessibilityRole="button" accessibilityLabel="记录饮食" style={styles.captureWrap} onPress={onCapture}>
        <View style={styles.captureButton}>
          <Text style={styles.captureGlyph}>＋</Text>
        </View>
        <Text style={styles.captureLabel}>记饮食</Text>
      </Pressable>

      <Pressable accessibilityRole="button" accessibilityLabel="食谱" accessibilityState={{ selected: active === 'recipes' }} style={styles.tab} onPress={onRecipes}>
        <View style={[styles.tabIcon, active === 'recipes' && styles.tabIconActive]}>
          <Text style={[styles.tabGlyph, active === 'recipes' && styles.tabGlyphActive]}>♧</Text>
        </View>
        <Text style={[styles.tabLabel, active === 'recipes' && styles.tabLabelActive]}>食谱</Text>
      </Pressable>

      <Pressable accessibilityRole="button" accessibilityLabel="篮球裁判学习" accessibilityState={{ selected: active === 'referee' }} style={styles.tab} onPress={onReferee}>
        <View style={[styles.tabIcon, active === 'referee' && styles.tabIconActive]}>
          <Text style={[styles.tabGlyph, active === 'referee' && styles.tabGlyphActive]}>⚑</Text>
        </View>
        <Text style={[styles.tabLabel, active === 'referee' && styles.tabLabelActive]}>裁判</Text>
      </Pressable>

      <Pressable accessibilityRole="button" accessibilityState={{ selected: active === 'history' }} style={styles.tab} onPress={onHistory}>
        <View style={[styles.tabIcon, active === 'history' && styles.tabIconActive]}>
          <Text style={[styles.tabGlyph, active === 'history' && styles.tabGlyphActive]}>≡</Text>
        </View>
        <Text style={[styles.tabLabel, active === 'history' && styles.tabLabelActive]}>饮食历史</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    minHeight: 68,
    paddingTop: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  tab: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  tabIcon: {
    width: 30,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconActive: {
    backgroundColor: colors.primarySoft,
  },
  tabGlyph: {
    color: colors.subtle,
    fontSize: 21,
    lineHeight: 23,
  },
  tabGlyphActive: {
    color: colors.primary,
  },
  dumbbell: { flexDirection: 'row', alignItems: 'center', transform: [{ rotate: '-30deg' }] },
  dumbbellEnd: { width: 5, height: 16, borderRadius: 2, backgroundColor: colors.subtle },
  dumbbellBar: { width: 11, height: 4, backgroundColor: colors.subtle },
  dumbbellActive: { backgroundColor: colors.primary },
  tabLabel: {
    color: colors.subtle,
    fontSize: 11,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: colors.primary,
  },
  captureWrap: {
    width: 64,
    alignItems: 'center',
    gap: 3,
  },
  captureButton: {
    width: 50,
    height: 50,
    marginTop: -17,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderWidth: 4,
    borderColor: colors.surface,
  },
  captureGlyph: {
    color: colors.surface,
    fontSize: 29,
    fontWeight: '300',
    lineHeight: 31,
  },
  captureLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
  },
});
