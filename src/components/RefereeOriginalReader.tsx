import { StyleSheet, Text, View } from 'react-native';

import { referencePage } from '../refereeUtils';
import { colors } from '../theme';

// Expo Go uses the system PDF reader; the web implementation embeds the
// publisher's document, so learners can read the actual English source in place.
export function RefereeOriginalReader({ reference }: { reference: string }) {
  return <View style={styles.panel}>
    <Text style={styles.title}>FIBA 官方英文原文 · {reference}</Text>
    <Text style={styles.note}>PDF 第 {referencePage(reference)} 页。点击下方原文链接，在系统阅读器中查看对应条款。</Text>
  </View>;
}

const styles = StyleSheet.create({
  panel: { gap: 10 },
  title: { color: colors.ink, fontSize: 15, fontWeight: '700', lineHeight: 24 },
  note: { color: colors.muted, fontSize: 13, lineHeight: 22 },
});
