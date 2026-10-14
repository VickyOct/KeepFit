import { StyleSheet, Text, View } from 'react-native';
import { FEMALE_FRIENDLY_EXPLANATION, FEMALE_FRIENDLY_LABEL, FIT_CHECKED_AT, FIT_REFERENCES } from '../data/femaleFriendlyFit';
import type { Exercise } from '../workoutTypes';
import { colors } from '../theme';
import { TechniqueReferences } from './TechniqueReferences';

type Props = { fit: NonNullable<Exercise['femaleFriendlyFit']> };

export function FemaleFriendlyBadge({ fit }: Props) {
  return <View style={styles.badge}><Text style={styles.badgeText}>{FEMALE_FRIENDLY_LABEL} · {fit.basis}</Text></View>;
}

export function FemaleFriendlyFitCard({ fit, exerciseId }: Props & { exerciseId: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{FEMALE_FRIENDLY_LABEL} · 适配参考</Text>
      <Text style={styles.copy}>{FEMALE_FRIENDLY_EXPLANATION}</Text>
      <Text style={styles.label}>{fit.basis}</Text>
      <Text style={styles.copy}>{fit.reason}</Text>
      <Text style={styles.label}>适用条件</Text>
      <Text style={styles.copy}>{fit.check}</Text>
      <TechniqueReferences references={exerciseId === 'bodyweight-squat' ? FIT_REFERENCES : [FIT_REFERENCES[0]]} checkedAt={FIT_CHECKED_AT} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', backgroundColor: '#E9EDF8', borderRadius: 7, paddingHorizontal: 8, paddingVertical: 5, marginTop: 6 },
  badgeText: { color: '#354C7A', fontSize: 10, lineHeight: 16, fontWeight: '700' },
  card: { padding: 17, marginTop: 18, borderRadius: 19, borderColor: '#D7DFEF', borderWidth: 1, backgroundColor: '#F1F4FA' },
  title: { color: '#354C7A', fontSize: 16, lineHeight: 24, fontWeight: '800' },
  label: { color: colors.ink, fontSize: 13, fontWeight: '700', marginTop: 14 },
  copy: { color: colors.muted, fontSize: 12, lineHeight: 21, marginTop: 7 },
});
