import { Alert } from '../alert';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { REFERENCE_CHECKED_AT } from '../data/exerciseReferences';
import { colors } from '../theme';
import type { TechniqueReference } from '../workoutTypes';

export function TechniqueReferences({ references, checkedAt = REFERENCE_CHECKED_AT }: { references: TechniqueReference[]; checkedAt?: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>技术参考</Text>
      <Text style={styles.caption}>中文要点为整理说明；原文链接需联网。来源核对：{checkedAt}。</Text>
      {references.map((reference) => (
        <Pressable key={reference.url} accessibilityRole="link" accessibilityLabel={`打开技术参考：${reference.title}`} onPress={() => { void Linking.openURL(reference.url).catch(() => Alert.alert('无法打开技术参考', '请检查网络连接后重试。')); }} style={styles.card}>
          <Text style={styles.kind}>{reference.kind} · {reference.publisher}</Text>
          <Text style={styles.link}>{reference.title} ↗</Text>
          {reference.note ? <Text style={styles.caption}>{reference.note}</Text> : null}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 24, gap: 10 },
  title: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  caption: { color: colors.muted, fontSize: 11, lineHeight: 19 },
  card: { padding: 15, minHeight: 48, gap: 6, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  kind: { color: colors.muted, fontSize: 10, lineHeight: 16 },
  link: { color: colors.primary, fontSize: 13, lineHeight: 21, fontWeight: '700' },
});
