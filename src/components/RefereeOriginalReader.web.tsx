import { useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { REFEREE_SOURCE_URL } from '../data/refereeLessons';
import { referencePage } from '../refereeUtils';
import { colors } from '../theme';

export function RefereeOriginalReader({ reference }: { reference: string }) {
  const { height } = useWindowDimensions();
  const [failed, setFailed] = useState(false);
  const page = referencePage(reference);

  return <View style={styles.panel}>
    <Text style={styles.title}>FIBA 官方英文原文 · {reference}</Text>
    <Text style={styles.note}>PDF 第 {page} 页 · August 2026 v1.0</Text>
    {failed ? <Text accessibilityRole="alert" style={styles.note}>原文暂时无法在本页加载，请使用下方链接打开官方 PDF。</Text> :
      <iframe title={`FIBA 英文原文 · 条款 ${reference} · PDF 第 ${page} 页`}
        src={`${REFEREE_SOURCE_URL}#page=${page}&view=FitH`}
        loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)}
        style={{ width: '100%', height: Math.min(760, Math.max(420, height * 0.7)), display: 'block', border: '1px solid ' + colors.border, borderRadius: 12, background: colors.surface }} />}
    <Text style={styles.note}>原文由 FIBA 官方网站提供，需要联网。如果手机阅读器未自动定位，请手动跳到第 {page} 页，查找条款 {reference}；也可用下方链接单独打开。</Text>
  </View>;
}

const styles = StyleSheet.create({
  panel: { gap: 10 },
  title: { color: colors.ink, fontSize: 15, fontWeight: '700', lineHeight: 24 },
  note: { color: colors.muted, fontSize: 13, lineHeight: 22 },
});
