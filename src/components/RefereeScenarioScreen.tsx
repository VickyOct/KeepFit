import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Alert } from '../alert';
import { refereeLessons } from '../data/refereeLessons';
import { saveScenarioAnswer, submitScenarioExam } from '../refereeStorage';
import { examProgress, passedQuiz, referencePage } from '../refereeUtils';
import type { RefereeState, ScenarioExam } from '../refereeTypes';
import { colors } from '../theme';

type Props = {
  exam: ScenarioExam;
  state: RefereeState;
  status: 'loading' | 'ready' | 'error';
  startWithResult: boolean;
  onStateChange: (state: RefereeState) => void;
  onRetry: () => void;
  onBack: () => void;
  onNext?: () => void;
  onStudy: (lessonId: string, sectionId: string, reference?: string) => void;
};

function Button({ label, onPress, disabled = false, secondary = false }: { label: string; onPress: () => void; disabled?: boolean; secondary?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} accessibilityState={{ disabled }} onPress={onPress}
    style={[styles.button, secondary && styles.secondary, disabled && styles.disabled]}><Text style={[styles.buttonText, secondary && styles.secondaryText]}>{label}</Text></Pressable>;
}

export function RefereeScenarioScreen({ exam, state, status, startWithResult, onStateChange, onRetry, onBack, onNext, onStudy }: Props) {
  const progress = examProgress(state, exam.id);
  const [mode, setMode] = useState<'intro' | 'quiz' | 'result'>(() => startWithResult && progress.latestAttempt ? 'result' : 'intro');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [wrongOnly, setWrongOnly] = useState(true);
  const mounted = useRef(false);
  const writing = useRef(false);
  const scroll = useRef<ScrollView>(null);
  const disabled = busy || status !== 'ready';

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  function changeMode(next: 'intro' | 'quiz' | 'result') {
    setMode(next); scroll.current?.scrollTo({ y: 0, animated: false });
  }

  function start() {
    if (disabled) return;
    const first = exam.questions.findIndex((q) => !Object.hasOwn(progress.draftAnswers, q.id));
    setQuestionIndex(first < 0 ? 0 : first); changeMode('quiz');
  }

  async function save(operation: () => Promise<RefereeState>, submitted = false) {
    if (writing.current || status !== 'ready') return;
    writing.current = true; setBusy(true); setSaveError(false);
    try {
      const next = await operation();
      if (mounted.current) {
        onStateChange(next);
        if (submitted) { setWrongOnly(true); changeMode('result'); }
      }
    } catch {
      if (mounted.current) {
        setSaveError(true);
        Alert.alert('综合测验未保存', '本次操作未生效，原有草稿和成绩保留。请再次点击重试。');
      }
    } finally { writing.current = false; if (mounted.current) setBusy(false); }
  }

  const answered = Object.keys(progress.draftAnswers).length;
  const attempt = progress.latestAttempt;

  return <View style={styles.screen}>
    <View style={styles.toolbar}>
      <Pressable accessibilityRole="button" accessibilityLabel="返回综合测试列表" disabled={busy} onPress={onBack} style={styles.back}><Text style={styles.backText}>‹ 综合测试</Text></Pressable>
      <Text style={styles.note}>第 {exam.order} 套 / 5</Text>
    </View>
    <ScrollView key={mode} ref={scroll} contentContainerStyle={styles.page}>
      {status !== 'ready' && <View style={styles.notice}><Text style={styles.note}>{status === 'loading' ? '正在读取综合测验进度…' : '暂时无法读取进度。重试成功后可以答题，原记录不会被覆盖。'}</Text>{status === 'error' && <Button label="重新读取学习进度" secondary onPress={onRetry} />}</View>}
      {saveError && <Text accessibilityRole="alert" style={styles.error}>未保存，请重试。原有草稿与成绩保留。</Text>}
      <Text style={styles.eyebrow}>综合情景测试 · 第 {exam.order} 套</Text>
      <Text style={styles.title}>{exam.title}</Text>
      {mode === 'intro' ? <>
        <Text style={styles.body}>{exam.subtitle}</Text>
        <View style={styles.card}>
          <Text style={styles.heading}>从现场作出完整决定</Text>
          <Text style={styles.body}>10 道情景单选题，约 15 分钟。每题选择一项完整处理：是否吹哨、判什么、得分／罚球／球权／计时怎样恢复。</Text>
          <Text style={styles.body}>既有应判罚的情况，也有应该继续比赛的合法动作。题目给出的时间、位置、犯规次数和先后顺序都是判断条件。</Text>
          <Text style={styles.note}>建议读完 16 课后练习，也可以直接开始。答题时不显示解析，提交后再逐题复盘。8 / 10 是本模块复习门槛。</Text>
        </View>
        {attempt && <View style={styles.notice}><Text style={styles.heading}>最近 {attempt.score}/10 · 最高 {progress.bestAttempt?.score}/10</Text><Text style={styles.note}>已提交 {progress.attemptCount} 次 · {passedQuiz(progress.bestAttempt) ? '本套已通过' : '继续巩固'}</Text></View>}
        <Button label={answered ? `继续综合模拟 ${exam.order} · 已答 ${answered}/10` : attempt ? `重做综合模拟 ${exam.order} · 10 题` : `开始综合模拟 ${exam.order} · 10 题`} disabled={disabled} onPress={start} />
        {attempt && <Button label="查看综合测验成绩与解析" secondary disabled={busy} onPress={() => { setWrongOnly(true); changeMode('result'); }} />}
        <Text style={styles.note}>每次选择自动保存。五套测验分别保留草稿、最近成绩和最高成绩，可离开后继续。</Text>
      </> : mode === 'quiz' ? (() => {
        const q = exam.questions[questionIndex];
        const answer = progress.draftAnswers[q.id];
        return <>
          <View style={styles.meta}><Text style={styles.heading}>情景 {questionIndex + 1} / 10</Text><Text style={styles.note}>已答 {answered} / 10</Text></View>
          <View style={styles.track}><View style={[styles.fill, { width: `${answered * 10}%` }]} /></View>
          <View style={styles.card}><Text style={styles.question}>{q.prompt}</Text><Text style={styles.note}>选择完整处理决定：</Text>
            {q.options.map((option, index) => <Pressable key={option} accessibilityRole="radio" accessibilityLabel={`${String.fromCharCode(65 + index)} ${option}`} accessibilityState={{ checked: answer === index, disabled }} disabled={disabled}
              onPress={() => void save(() => saveScenarioAnswer(exam.id, q.id, index))} style={[styles.option, answer === index && styles.selected]}>
              <Text style={styles.letter}>{String.fromCharCode(65 + index)}</Text><Text style={styles.optionText}>{option}</Text>
            </Pressable>)}
          </View>
          {busy && <Text style={styles.note}>正在保存答案…</Text>}
          <View style={styles.dots}>{exam.questions.map((item, i) => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`跳到情景 ${i + 1}`} accessibilityState={{ selected: i === questionIndex, disabled: busy }} disabled={busy} onPress={() => setQuestionIndex(i)} style={[styles.dot, Object.hasOwn(progress.draftAnswers, item.id) && styles.selected, i === questionIndex && styles.current]}><Text style={styles.letter}>{i + 1}</Text></Pressable>)}</View>
          <View style={styles.navigation}><View style={styles.flex}><Button label="上一情景" secondary disabled={busy || questionIndex === 0} onPress={() => setQuestionIndex(questionIndex - 1)} /></View><View style={styles.flex}><Button label="下一情景" disabled={busy || questionIndex === 9} onPress={() => setQuestionIndex(questionIndex + 1)} /></View></View>
          <Button label={answered === 10 ? '提交综合测验 · 查看成绩' : `还剩 ${10 - answered} 道情景未答`} disabled={disabled || answered !== 10} onPress={() => void save(() => submitScenarioExam(exam.id), true)} />
          <Button label="返回本套说明 · 保留草稿" secondary disabled={busy} onPress={() => changeMode('intro')} />
        </>;
      })() : attempt ? (() => {
        const wrong = exam.questions.filter((q) => attempt.answers[q.id] !== q.correctIndex);
        const reviews = wrongOnly ? wrong : exam.questions;
        return <>
          <View style={styles.hero}><Text style={styles.score}>{attempt.score} / 10</Text><Text style={styles.heading}>{passedQuiz(attempt) ? '本套综合测试通过' : '再练稳这些临场判断'}</Text><Text style={styles.note}>最高 {progress.bestAttempt?.score}/10 · 已提交 {progress.attemptCount} 次{ '\n' }{wrong.length ? `${wrong.length} 道错题，先看关键条件再看恢复程序。` : '全部答对，可打开全部解析巩固判断依据。'}</Text></View>
          <View style={styles.tabs}><Button label={`只看综合错题 · ${wrong.length}`} secondary onPress={() => setWrongOnly(true)} /><Button label="综合测验全部解析" secondary onPress={() => setWrongOnly(false)} /></View>
          {wrongOnly && wrong.length === 0 && <View style={styles.card}><Text style={styles.heading}>这一套没有错题</Text><Text style={styles.body}>打开全部解析，检查你是否也判断对了后续罚则和计时。</Text></View>}
          {reviews.map((q) => {
            const correct = attempt.answers[q.id] === q.correctIndex;
            const lesson = refereeLessons.find((item) => item.id === q.lessonId)!;
            return <View key={q.id} style={styles.card}>
              <Text style={[styles.eyebrow, !correct && styles.error]}>{correct ? '✓ 正确' : '需复习'} · 情景 {exam.questions.indexOf(q) + 1}</Text>
              <Text style={styles.question}>{q.prompt}</Text><Text style={styles.body}>你的决定：{q.options[attempt.answers[q.id]]}</Text>
              <Text style={styles.correct}>正确处理：{q.options[q.correctIndex]}</Text>
              <Text style={styles.note}>{q.whistle ? '本情景需要鸣哨或停止比赛处理。' : '本情景无需追加违例或犯规哨。'}</Text>
              <Text selectable style={styles.body}>{q.explanation}</Text>
              <Text style={styles.note}>依据 {q.reference} · PDF 第 {referencePage(q.reference)} 页</Text>
              <Button label={`复习课程 · 第 ${lesson.order} 课 ${lesson.title}`} secondary onPress={() => onStudy(q.lessonId, q.studySectionId)} />
              <Button label={`查看情景英文原文 · ${q.reference}`} secondary onPress={() => onStudy(q.lessonId, q.studySectionId, q.reference)} />
            </View>;
          })}
          <Button label={`重做综合模拟 ${exam.order} · 10 题`} disabled={disabled} onPress={start} />
          {onNext && <Button label={`继续综合模拟 ${exam.order + 1}`} secondary disabled={busy} onPress={onNext} />}
          <Button label="返回综合测试列表" secondary disabled={busy} onPress={onBack} />
        </>;
      })() : null}
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, page: { padding: 22, paddingBottom: 36, gap: 16 },
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  back: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 6 }, backText: { color: colors.primary, fontSize: 16, fontWeight: '700' },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '700', lineHeight: 20 }, title: { color: colors.ink, fontSize: 27, fontWeight: '800', lineHeight: 38 },
  heading: { color: colors.ink, fontSize: 17, fontWeight: '700', lineHeight: 26 }, body: { color: colors.ink, fontSize: 15, lineHeight: 28 }, note: { color: colors.muted, fontSize: 13, lineHeight: 22 },
  card: { borderRadius: 20, backgroundColor: colors.surface, padding: 20, gap: 14, borderWidth: 1, borderColor: colors.border }, hero: { borderRadius: 20, backgroundColor: colors.primaryPale, padding: 22, gap: 16 }, notice: { backgroundColor: colors.surfaceMuted, padding: 16, borderRadius: 16, gap: 10 },
  button: { minHeight: 48, backgroundColor: colors.primary, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, justifyContent: 'center', alignItems: 'center' }, buttonText: { color: colors.surface, fontSize: 14, lineHeight: 22, fontWeight: '700', textAlign: 'center' }, secondary: { backgroundColor: colors.surfaceMuted }, secondaryText: { color: colors.primary }, disabled: { opacity: 0.45 },
  question: { color: colors.ink, fontSize: 17, lineHeight: 29, fontWeight: '700' }, option: { minHeight: 56, padding: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }, optionText: { flex: 1, color: colors.ink, fontSize: 14, lineHeight: 24 }, letter: { color: colors.primary, fontWeight: '700', fontSize: 13 }, selected: { backgroundColor: colors.primaryPale, borderColor: colors.primary },
  meta: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 }, track: { height: 7, borderRadius: 4, backgroundColor: colors.primarySoft, overflow: 'hidden' }, fill: { height: 7, backgroundColor: colors.primary },
  dots: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, dot: { minHeight: 44, width: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }, current: { borderColor: colors.primary, borderWidth: 2 }, navigation: { flexDirection: 'row', gap: 12 }, flex: { flex: 1 }, tabs: { gap: 8 },
  score: { color: colors.primary, fontSize: 42, fontWeight: '800' }, correct: { color: colors.primary, fontSize: 15, fontWeight: '700', lineHeight: 26 }, error: { color: colors.danger, fontSize: 13, lineHeight: 22 },
});
