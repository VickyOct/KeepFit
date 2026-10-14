import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DIAGRAM_REVIEWS } from '../data/diagramReview';
import { EXERCISES } from '../data/exercises';
import { colors } from '../theme';
import type { Exercise } from '../workoutTypes';
import { TechniqueReferences } from './TechniqueReferences';

export function DiagramReview({ onOpenExercise }: { onOpenExercise: (exercise: Exercise) => void }) {
  return (
    <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
      <Text style={styles.eyebrow}>动作与肌群 · 逐图核对</Text>
      <Text style={styles.title}>可作入门索引，不能当精准肌肉地图</Text>
      <Text style={styles.intro}>一个动作通常有多个肌群共同参与。肌肉有参与，不代表它是这个动作的主要训练目标；文字所在位置也不等于真实的解剖边界。</Text>
      {DIAGRAM_REVIEWS.map((diagram) => (
        <View key={diagram.id} style={styles.group}>
          <Text style={styles.groupTitle}>{diagram.title}</Text>
          <Text style={styles.copy}>{diagram.summary}</Text>
          {diagram.findings.map((finding) => (
            <View key={finding.title} style={styles.card}>
              <Text style={[styles.verdict, finding.verdict === '基本合理' && styles.correct]}>{finding.verdict}</Text>
              <Text style={styles.findingTitle}>{finding.title}</Text>
              <Text style={styles.copy}>{finding.explanation}</Text>
              <View style={styles.links}>
                {finding.exerciseIds.map((id) => {
                  const exercise = EXERCISES.find((entry) => entry.id === id);
                  return exercise ? <Pressable key={id} accessibilityRole="button" accessibilityLabel={`从图解查看${exercise.nameZh}技术参考`} onPress={() => onOpenExercise(exercise)} style={styles.button}><Text style={styles.buttonText}>{exercise.nameZh} ›</Text></Pressable> : null;
                })}
              </View>
            </View>
          ))}
          <TechniqueReferences references={diagram.references} />
        </View>
      ))}
      <Text style={styles.intro}>这里核对的是动作名称与肌群关系。原图没有展示动作过程，无法据此判断某个人的实际姿势是否正确。</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 20, paddingBottom: 36 },
  eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  title: { color: colors.ink, fontSize: 25, fontWeight: '800', lineHeight: 34, marginTop: 12 },
  intro: { color: colors.muted, fontSize: 13, lineHeight: 23, marginTop: 14 },
  group: { marginTop: 30 },
  groupTitle: { color: colors.ink, fontSize: 18, lineHeight: 27, fontWeight: '800' },
  copy: { color: colors.muted, fontSize: 13, lineHeight: 23, marginTop: 8 },
  card: { padding: 17, marginTop: 12, backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  verdict: { color: '#876028', fontSize: 11, lineHeight: 18, fontWeight: '700' },
  correct: { color: colors.primary },
  findingTitle: { color: colors.ink, fontSize: 15, fontWeight: '800', lineHeight: 23, marginTop: 6 },
  links: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  button: { minHeight: 44, paddingHorizontal: 12, paddingVertical: 10, justifyContent: 'center', backgroundColor: colors.primaryPale, borderRadius: 12 },
  buttonText: { color: colors.primary, fontSize: 12, lineHeight: 20, fontWeight: '600' },
});
