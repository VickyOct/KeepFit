import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { readAll, writeEntries } from '../kvStore.web';
import { backupDefaults, validateBackup } from '../webBackup';
import { colors } from '../theme';

export function WebTools() {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [installed] = useState(window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const status = () => setOnline(navigator.onLine);
    const cached = () => setOfflineReady(true);
    window.addEventListener('online', status);
    window.addEventListener('offline', status);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => setOfflineReady(true)).catch(() => {});
      navigator.serviceWorker.addEventListener('controllerchange', cached);
    }
    return () => { window.removeEventListener('online', status); window.removeEventListener('offline', status); navigator.serviceWorker?.removeEventListener('controllerchange', cached); };
  }, []);

  async function exportBackup() {
    setBusy(true);
    try {
      const data = { ...backupDefaults, ...await readAll() };
      const blob = new Blob([JSON.stringify({ format: 'keepfit-web', version: 1, exportedAt: new Date().toISOString(), data })], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = `KeepFit-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      setMessage('备份已生成，请保存到「文件」；其中包含你的记录和照片。');
    } catch { setMessage('暂时无法导出，请重试。'); }
    finally { setBusy(false); }
  }

  async function importBackup(file: File) {
    setBusy(true);
    try {
      if (file.size > 100 * 1024 * 1024) throw new Error('备份超过 100 MB，暂时无法导入。');
      const data = validateBackup(await file.text());
      if (!window.confirm('恢复备份会替换此浏览器中的全部 KeepFit 记录、草稿、收藏和学习进度。建议先导出当前备份。继续恢复？')) return;
      await writeEntries(data);
      window.location.reload();
    } catch (error) { setMessage(error instanceof Error ? error.message : '恢复失败，当前记录未改变。'); }
    finally { setBusy(false); if (input.current) input.current.value = ''; }
  }

  return <View style={styles.card}>
    <Text style={styles.title}>{installed ? 'KeepFit 网页版' : '把 KeepFit 放到主屏幕'}</Text>
    {!installed && <Text style={styles.copy}>用 Safari 打开网址，点击「分享」→「添加到主屏幕」。</Text>}
    <Text style={styles.copy}>{!online ? '当前离线，在线食物搜索暂不可用。' : offlineReady ? '离线内容已就绪，断网也能记录和查看。' : '联网打开后会准备离线内容，请稍候。'}</Text>
    <Text style={styles.copy}>记录和照片只保存在当前浏览器，不会自动同步。清除网站数据会删除记录，请定期备份。Expo Go 的旧记录需要另行迁移。</Text>
    <View style={styles.actions}>
      <Pressable accessibilityRole="button" disabled={busy} onPress={exportBackup} style={styles.button}><Text style={styles.label}>导出备份</Text></Pressable>
      <Pressable accessibilityRole="button" disabled={busy} onPress={() => input.current?.click()} style={styles.button}><Text style={styles.label}>恢复备份</Text></Pressable>
    </View>
    <input ref={input} type="file" accept="application/json,.json" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void importBackup(file); }} />
    {message ? <Text accessibilityLiveRegion="polite" style={styles.copy}>{message}</Text> : null}
  </View>;
}

const styles = StyleSheet.create({
  card: { padding: 18, gap: 10, borderRadius: 20, backgroundColor: colors.primaryPale, marginBottom: 24 },
  title: { color: colors.primary, fontSize: 16, fontWeight: '700' },
  copy: { color: colors.muted, fontSize: 13, lineHeight: 21 },
  actions: { flexDirection: 'row', gap: 12 },
  button: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 14, backgroundColor: colors.surface },
  label: { color: colors.primary, fontSize: 14, fontWeight: '600' },
});
