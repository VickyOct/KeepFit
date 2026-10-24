import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { advanceVerticalTime, VERTICAL_BEATS, VERTICAL_DURATION, verticalSceneAt } from '../referee3dMotion';
import type { CourtView, createVerticalCourt } from './referee3d/scene.web';

type CourtScene = ReturnType<typeof createVerticalCourt>;
const VIEWS: { id: CourtView; label: string }[] = [
  { id: 'sideline', label: '斜侧视角' }, { id: 'side', label: '侧面视角' }, { id: 'overhead', label: '俯视' },
];

export function Referee3DPreview() {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [time, setTime] = useState(0);
  const [view, setView] = useState<CourtView>('sideline');
  const [cylinder, setCylinder] = useState(true);
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<CourtScene | null>(null);
  const playback = useRef({ time: 0, playing: true, speed: 1 });
  const cameraView = useRef<CourtView>('sideline');
  const cylinderVisible = useRef(true);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      playback.current.playing = false; setPlaying(false);
    }
  }, []);

  useEffect(() => {
    if (!expanded) return;
    let cancelled = false, frameId = 0, previous = 0, lastLabel = 0;
    setLoading(true); setFailed(false);
    import('./referee3d/scene.web').then(({ createVerticalCourt: createCourt }) => {
      if (cancelled || !host.current) return;
      try {
        scene.current = createCourt(host.current, () => {
          if (!cancelled) { playback.current.playing = false; setPlaying(false); setFailed(true); }
        });
        scene.current.setView(cameraView.current);
        scene.current.setCylinder(cylinderVisible.current);
        setLoading(false);
        function tick(now: number) {
          if (cancelled) return;
          const delta = previous ? (now - previous) / 1000 : 0;
          previous = now;
          const state = playback.current;
          if (state.playing && document.visibilityState === 'visible') state.time = advanceVerticalTime(state.time, delta, state.speed);
          scene.current?.draw(verticalSceneAt(state.time));
          if (now - lastLabel > 90) { setTime(state.time); lastLabel = now; }
          frameId = requestAnimationFrame(tick);
        }
        frameId = requestAnimationFrame(tick);
      } catch (error) {
        console.warn('3D court could not start:', error);
        if (!cancelled) { setLoading(false); setFailed(true); }
      }
    }).catch((error) => {
      console.warn('3D court could not load:', error);
      if (!cancelled) { setLoading(false); setFailed(true); }
    });
    return () => { cancelled = true; cancelAnimationFrame(frameId); scene.current?.dispose(); scene.current = null; };
  }, [expanded, retry]);

  function seek(value: number) {
    playback.current.time = verticalSceneAt(value).time;
    playback.current.playing = false; setPlaying(false); setTime(playback.current.time);
  }
  function togglePlay() { const next = !playback.current.playing; playback.current.playing = next; setPlaying(next); }
  function changeView(next: CourtView) { cameraView.current = next; setView(next); scene.current?.setView(next); }
  const disabled = loading || failed;

  return <View style={styles.shell} testID="referee-3d-preview">
    <Pressable accessibilityRole="button" accessibilityLabel={expanded ? '收起 3D 小人样例' : '体验 3D 小人'}
      accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)} style={styles.entry}>
      <View style={styles.entryCopy}>
        <Text style={styles.eyebrow}>3D COURT LAB · 浏览器样例</Text>
        <Text style={styles.title}>换个角度，看清每次接触</Text>
        <Text style={styles.subtitle}>卡通球员 · 垂直防守 · 自由旋转</Text>
      </View>
      <View style={styles.entryAction}><Text style={styles.entryActionText}>{expanded ? '收起 −' : '体验 3D ↗'}</Text></View>
    </Pressable>

    {expanded && <View style={styles.content}>
      <View style={[styles.stage, failed && { display: 'none' }]}>
        <div ref={host} style={{ width: '100%', height: 'clamp(300px, 48vw, 420px)', overflow: 'hidden' }} />
        <View pointerEvents="none" style={styles.overlay}>
          <Text style={styles.stageBadge}>垂直防守 · {verticalSceneAt(time).phase}</Text>
          <Text style={styles.stageHint}>拖动旋转视角</Text>
        </View>
        {loading && <View style={styles.loading}><Text style={styles.loadingText}>正在准备 3D 球场…</Text></View>}
      </View>
      {failed && <View style={styles.fallback}>
        <Text accessibilityRole="alert" style={styles.description}>3D 场景暂时无法加载，可先看原有示意动图。</Text>
        <Image source={require('../../assets/referee/vertical-cylinder.gif')} accessibilityLabel="垂直防守平面示意动图" resizeMode="contain" style={{ width: '100%', aspectRatio: 640 / 360 }} />
        <Pressable accessibilityRole="button" onPress={() => setRetry(retry + 1)} style={styles.button}><Text style={styles.buttonText}>重新加载 3D</Text></Pressable>
      </View>}
      <View style={styles.legend}>
        <Text style={styles.attacker}>● A2 进攻球员</Text><Text style={styles.defender}>● B5 防守球员</Text>
      </View>
      <Text style={styles.description}>观察防守人的起跳方向、手臂位置和落点。圆柱体辅助线固定在防守人的原站位。</Text>
      <View style={styles.row}>
        <Pressable accessibilityRole="button" accessibilityLabel={playing ? '暂停 3D 动画' : '播放 3D 动画'} disabled={disabled} onPress={togglePlay} style={[styles.button, styles.primary]}>
          <Text style={styles.primaryText}>{playing ? 'Ⅱ 暂停' : '▶ 播放'}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="切换慢放速度" accessibilityState={{ selected: speed === 0.5 }} disabled={disabled}
          onPress={() => { const next = speed === 1 ? 0.5 : 1; playback.current.speed = next; setSpeed(next); }} style={[styles.button, speed === 0.5 && styles.selected]}>
          <Text style={styles.buttonText}>{speed === 1 ? '1× 正常' : '0.5× 慢放'}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="重播 3D 动画" disabled={disabled} onPress={() => { playback.current.time = 0; playback.current.playing = true; setTime(0); setPlaying(true); }} style={styles.button}>
          <Text style={styles.buttonText}>↺ 重播</Text>
        </Pressable>
      </View>
      <View style={styles.timeline}>
        <Text style={styles.time}>{time.toFixed(1)} / {VERTICAL_DURATION.toFixed(1)} 秒</Text>
        <input type="range" aria-label="3D 动画进度" min={0} max={VERTICAL_DURATION} step={1 / 30} value={time}
          disabled={disabled} onChange={(event) => seek(Number(event.target.value))}
          style={{ width: '100%', minWidth: 0, height: 30, accentColor: '#2E6950', cursor: 'pointer', margin: 0 }} />
      </View>
      <View style={styles.row}>
        <Pressable accessibilityRole="button" accessibilityLabel="3D 动画上一帧" disabled={disabled} onPress={() => seek(playback.current.time - 1 / 30)} style={styles.button}><Text style={styles.buttonText}>‹ 上一帧</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="3D 动画下一帧" disabled={disabled} onPress={() => seek(playback.current.time + 1 / 30)} style={styles.button}><Text style={styles.buttonText}>下一帧 ›</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="显示防守圆柱体" accessibilityState={{ checked: cylinder }} disabled={disabled}
          onPress={() => { cylinderVisible.current = !cylinder; setCylinder(!cylinder); scene.current?.setCylinder(!cylinder); }} style={[styles.button, cylinder && styles.selected]}>
          <Text style={styles.buttonText}>{cylinder ? '✓ 圆柱体' : '圆柱体'}</Text>
        </Pressable>
      </View>
      <View style={styles.separator} />
      <View style={styles.row}>{VIEWS.map((item) => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`3D ${item.label}`} accessibilityState={{ selected: view === item.id }}
        disabled={disabled} onPress={() => changeView(item.id)} style={[styles.button, view === item.id && styles.selected]}><Text style={styles.buttonText}>{item.label}</Text></Pressable>)}</View>
      <View style={styles.beats}>{VERTICAL_BEATS.map((beat, index) => <Pressable key={beat.time} accessibilityRole="button" accessibilityLabel={`观察${beat.label}`} disabled={disabled}
        onPress={() => seek(beat.time)} style={styles.beat}><Text style={styles.beatNumber}>0{index + 1}</Text><Text style={styles.beatText}>{beat.label}</Text></Pressable>)}</View>
      <Text style={styles.footnote}>原创 3D 教学示意 · 可暂停后转动视角。动作经过简化，判罚条件仍以题目和官方条款为准。</Text>
    </View>}
  </View>;
}

const styles = StyleSheet.create({
  shell: { backgroundColor: '#F6F7F0', borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#DDE5D9' },
  entry: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  entryCopy: { flex: 1, gap: 6 },
  eyebrow: { fontSize: 9, letterSpacing: 1.2, fontWeight: '800', color: '#5B715F' },
  title: { color: '#243E2E', fontSize: 17, fontWeight: '800', lineHeight: 25 },
  subtitle: { color: '#627365', fontSize: 11, lineHeight: 18 },
  entryAction: { backgroundColor: '#2E6950', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 13 },
  entryActionText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  content: { padding: 12, paddingTop: 0, gap: 12 },
  stage: { borderRadius: 14, overflow: 'hidden', backgroundColor: '#E7EEE9' },
  overlay: { position: 'absolute', top: 12, left: 12, right: 12, gap: 5, alignItems: 'flex-start' },
  stageBadge: { color: '#FFFFFF', backgroundColor: '#294A3E', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 11, fontWeight: '700' },
  stageHint: { color: '#3F5548', fontSize: 10, marginLeft: 2 },
  loading: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E7EEE9' },
  loadingText: { color: '#294A3E', fontSize: 13 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  attacker: { color: '#2E6950', fontSize: 12, fontWeight: '700' },
  defender: { color: '#9C463E', fontSize: 12, fontWeight: '700' },
  description: { color: '#506556', fontSize: 12, lineHeight: 21 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  button: { minHeight: 42, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 9, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D8E1D6', borderRadius: 10 },
  selected: { borderColor: '#7C9B80', backgroundColor: '#E1ECDE' },
  primary: { backgroundColor: '#2E6950', borderColor: '#2E6950', minWidth: 88 },
  buttonText: { color: '#304C3B', fontSize: 12, fontWeight: '700' },
  primaryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  timeline: { gap: 2 },
  time: { color: '#627365', fontSize: 11, fontVariant: ['tabular-nums'], textAlign: 'right' },
  separator: { backgroundColor: '#DDE5D9', height: 1 },
  beats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  beat: { minHeight: 42, flexGrow: 1, flexBasis: 75, paddingHorizontal: 10, paddingVertical: 9, borderRadius: 10, backgroundColor: '#E8EDE3', gap: 5 },
  beatNumber: { color: '#809079', fontSize: 10, fontWeight: '800' },
  beatText: { color: '#3D5843', fontSize: 11, fontWeight: '700' },
  footnote: { color: '#6C7B6B', fontSize: 10, lineHeight: 18 },
  fallback: { gap: 10 },
});
