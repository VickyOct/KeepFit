import { Alert } from '../alert';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { REFEREE_CONTENT_NOTE, REFEREE_PASS_PERCENT, REFEREE_SOURCE_TITLE, REFEREE_SOURCE_URL, refereeLessons } from '../data/refereeLessons';
import { completeRefereeLesson, loadRefereeState, saveRefereeAnswer, submitRefereeQuiz } from '../refereeStorage';
import { refereeScenarioExams } from '../data/refereeScenarioExams';
import type { RefereeLesson, RefereeState } from '../refereeTypes';
import { emptyRefereeState, examProgress, filterRefereeLessons, lessonProgress, passedQuiz, referencePage } from '../refereeUtils';
import { colors } from '../theme';
import { RefereeOriginalReader } from './RefereeOriginalReader';
import { RefereeRealQuiz } from './RefereeRealQuiz';
import { RefereeScenarioScreen } from './RefereeScenarioScreen';

type Filter = '全部' | '未完成' | '已完成' | '待巩固';

async function openSource(reference?: string) {
  try {
    await Linking.openURL(reference ? `${REFEREE_SOURCE_URL}#page=${referencePage(reference)}` : REFEREE_SOURCE_URL);
  } catch {
    Alert.alert('暂时无法打开原文', '请检查网络后重试。中文课程与测验仍可离线使用。');
  }
}

function Button({ label, onPress, disabled = false, secondary = false }: { label: string; onPress: () => void; disabled?: boolean; secondary?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled}
    onPress={onPress} style={[styles.button, secondary && styles.secondaryButton, disabled && styles.disabled]}>
    <Text style={[styles.buttonText, secondary && styles.secondaryButtonText]}>{label}</Text>
  </Pressable>;
}

function Source({ reference }: { reference: string }) {
  return <Pressable accessibilityRole="link" accessibilityLabel={`查看条款 ${reference} 原文`} onPress={() => void openSource(reference)} style={styles.sourceButton}>
    <Text style={styles.sourceText}>原文 {reference} · PDF 第 {referencePage(reference)} 页 ↗</Text>
  </Pressable>;
}

export function RefereeScreen() {
  const [state, setState] = useState<RefereeState>(emptyRefereeState);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('全部');
  const [selected, setSelected] = useState<RefereeLesson | null>(null);
  const [mode, setMode] = useState<'lesson' | 'quiz' | 'result'>('lesson');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [wrongOnly, setWrongOnly] = useState(true);
  const [readingTarget, setReadingTarget] = useState<string | null>(null);
  const [original, setOriginal] = useState<{ sectionId: string; reference: string } | null>(null);
  const [examSelection, setExamSelection] = useState<{ id: string; review: boolean } | null>(null);
  const [examReturn, setExamReturn] = useState<string | null>(null);
  const mounted = useRef(false);
  const writing = useRef(false);
  const loading = useRef(false);
  const scroll = useRef<ScrollView>(null);
  const sectionPositions = useRef<Record<string, number>>({});
  const pendingSection = useRef<string | null>(null);
  const contentHeight = useRef(0);

  async function initialize() {
    if (loading.current) return;
    loading.current = true;
    setStatus('loading');
    try {
      const stored = await loadRefereeState();
      if (mounted.current) { setState(stored); setStatus('ready'); }
    } catch {
      if (mounted.current) setStatus('error');
    } finally { loading.current = false; }
  }

  useEffect(() => {
    mounted.current = true;
    void initialize();
    return () => { mounted.current = false; };
  }, []);

  async function mutate(operation: () => Promise<RefereeState>, after?: (next: RefereeState) => void) {
    if (writing.current || status !== 'ready') return;
    writing.current = true;
    setBusy(true);
    setSaveError(false);
    try {
      const next = await operation();
      if (mounted.current) { setState(next); after?.(next); }
    } catch {
      if (mounted.current) {
        setSaveError(true);
        Alert.alert('学习进度未保存', '本次操作未生效，原有进度保留。请再次点击重试。');
      }
    } finally {
      writing.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  const visible = useMemo(() => filterRefereeLessons(state, query, filter), [state, query, filter]);
  const completed = refereeLessons.filter((lesson) => lessonProgress(state, lesson.id).completedAt).length;
  const mastered = refereeLessons.filter((lesson) => passedQuiz(lessonProgress(state, lesson.id).bestAttempt)).length;
  const progress = selected ? lessonProgress(state, selected.id) : null;
  const nextLesson = refereeLessons.find((lesson) => !lessonProgress(state, lesson.id).completedAt);
  const disabled = busy || status !== 'ready';

  function showLesson(lesson: RefereeLesson) {
    setExamReturn(null);
    setOriginal(null);
    pendingSection.current = null; sectionPositions.current = {}; contentHeight.current = 0;
    setReadingTarget(null);
    setSelected(lesson); setMode('lesson'); setSaveError(false);
    scroll.current?.scrollTo({ y: 0, animated: false });
  }

  function startQuiz() {
    if (!selected || !progress?.completedAt || disabled) return;
    setOriginal(null);
    const first = selected.questions.findIndex((q) => !Object.hasOwn(progress.draftAnswers, q.id));
    pendingSection.current = null;
    setQuestionIndex(first < 0 ? 0 : first); setMode('quiz');
    scroll.current?.scrollTo({ y: 0, animated: false });
  }

  function showResult() { setOriginal(null); setWrongOnly(true); setMode('result'); scroll.current?.scrollTo({ y: 0, animated: false }); }

  function back() {
    if (busy) return;
    setOriginal(null);
    pendingSection.current = null; setReadingTarget(null);
    if (mode !== 'lesson') setMode('lesson'); else setSelected(null);
    scroll.current?.scrollTo({ y: 0, animated: false });
  }

  function scrollToPendingSection() {
    const id = pendingSection.current;
    if (!id) return;
    const y = sectionPositions.current[id];
    // Wait for the new lesson layout instead of using the review page's height.
    if (y !== undefined && contentHeight.current > y && scroll.current) {
      scroll.current.scrollTo({ y: Math.max(0, y - 12), animated: true });
      pendingSection.current = null;
    }
  }

  function readSection(id: string) {
    if (!selected?.sections.some((section) => section.id === id)) return;
    setReadingTarget(id); pendingSection.current = id;
    if (mode !== 'lesson') {
      sectionPositions.current = {}; contentHeight.current = 0;
      setMode('lesson');
    } else scrollToPendingSection();
  }

  function showScenarioCatalog() {
    setExamSelection(null); setExamReturn(null); setSelected(null); setMode('lesson'); setOriginal(null);
    sectionPositions.current = {}; contentHeight.current = 0;
    pendingSection.current = 'scenario-exams';
  }

  const loadNotice = status !== 'ready' && <View style={styles.notice}>
    {status === 'loading' ? <><ActivityIndicator color={colors.primary} /><Text style={styles.note}>正在读取学习进度…</Text></> : <>
      <Text style={styles.note}>暂时无法读取原有进度。课程仍可阅读；重试成功后才能标记和答题。</Text>
      <Button label="重新读取学习进度" secondary onPress={() => void initialize()} />
    </>}
  </View>;

  if (examSelection) {
    const exam = refereeScenarioExams.find((item) => item.id === examSelection.id)!;
    return <RefereeScenarioScreen key={exam.id} exam={exam} state={state} status={status} startWithResult={examSelection.review}
      onStateChange={setState} onRetry={() => void initialize()} onBack={showScenarioCatalog}
      onNext={exam.order < refereeScenarioExams.length ? () => setExamSelection({ id: refereeScenarioExams[exam.order].id, review: false }) : undefined}
      onStudy={(lessonId, sectionId, reference) => {
        const lesson = refereeLessons.find((item) => item.id === lessonId)!;
        showLesson(lesson); setExamSelection(null); setExamReturn(exam.id);
        pendingSection.current = sectionId; setReadingTarget(sectionId);
        if (reference) setOriginal({ sectionId, reference });
      }} />;
  }

  return <View style={styles.screen}>
    {selected && <View style={styles.toolbar}>
      <Pressable accessibilityRole="button" accessibilityLabel={mode === 'lesson' ? '返回课程列表' : '返回本课阅读'} disabled={busy} onPress={back} style={styles.back}>
        <Text style={styles.backText}>‹ {mode === 'lesson' ? '课程列表' : '本课阅读'}</Text>
      </Pressable>
      <Text style={styles.toolbarText}>{mode === 'quiz' ? '章节测验' : mode === 'result' ? '测验复盘' : `第 ${selected.order} 课 / ${refereeLessons.length}`}</Text>
    </View>}
    <ScrollView ref={scroll} key={`${selected?.id ?? 'catalog'}-${mode}`} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page}
      onContentSizeChange={(_, height) => { contentHeight.current = height; scrollToPendingSection(); }}>
      {loadNotice}
      {saveError && <View style={styles.errorNotice}><Text style={styles.errorText}>未保存，请再次点击重试。原有进度未被覆盖。</Text></View>}
      {!selected ? <>
        <Text style={styles.eyebrow}>KEEPFIT · REFEREE ACADEMY</Text>
        <Text style={styles.title}>篮球裁判学习</Text>
        <Text style={styles.subtitle}>读懂规则，也练会场上的判断。</Text>
        <View style={styles.hero}>
          <View style={styles.heroTop}><Text style={styles.version}>FIBA 2026</Text><Text style={styles.versionDate}>2026.10.01 起适用</Text></View>
          <Text style={styles.heroTitle}>从第一声哨，到最后一次判罚</Text>
          <Text style={styles.heroText}>16 个主题课程 · 每课 10 题{ '\n' }10 个随机动图判例 · 5 套综合情景测试</Text>
          <View style={styles.stats}>
            <View style={styles.stat}><Text style={styles.statValue}>{status === 'ready' ? completed : '—'}<Text style={styles.statTotal}> / 16</Text></Text><Text style={styles.statLabel}>阅读完成</Text></View>
            <View style={styles.stat}><Text style={styles.statValue}>{status === 'ready' ? mastered : '—'}<Text style={styles.statTotal}> / 16</Text></Text><Text style={styles.statLabel}>测验已通过</Text></View>
          </View>
          <View accessibilityRole="progressbar" accessibilityLabel="课程阅读进度" accessibilityValue={{ min: 0, max: 16, now: completed }} style={styles.track}><View style={[styles.trackFill, { width: `${completed / 16 * 100}%` }]} /></View>
          <Text style={styles.heroText}>通过标准 {REFEREE_PASS_PERCENT}%（8 / 10）· 可重复练习</Text>
          {status === 'ready' && <Button label={nextLesson ? `继续学习 · 第 ${nextLesson.order} 课` : '课程已读完 · 复习第 1 课'} onPress={() => showLesson(nextLesson ?? refereeLessons[0])} />}
          <Button label="前往综合情景测试 · 5 套 50 题" secondary onPress={() => { pendingSection.current = 'scenario-exams'; scrollToPendingSection(); }} />
        </View>
        <RefereeRealQuiz onOpenReference={(reference) => void openSource(reference)} onStudy={(lessonId, sectionId, reference) => {
          const lesson = refereeLessons.find((item) => item.id === lessonId)!;
          showLesson(lesson); pendingSection.current = sectionId; setReadingTarget(sectionId);
          setOriginal({ sectionId, reference });
        }} />
        <TextInput accessibilityLabel="搜索裁判课程" placeholder="搜中文、travelling、shot clock、条款编号…" placeholderTextColor={colors.muted} value={query} onChangeText={setQuery} returnKeyType="search" style={styles.search} />
        <Text style={styles.note}>关键术语括号内附英文，方便对照课堂用语；同一段内重复出现时以中文为主。</Text>
        <View style={styles.chips}>{(['全部', '未完成', '已完成', '待巩固'] as const).map((item) => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: filter === item }} onPress={() => setFilter(item)} style={[styles.chip, filter === item && styles.chipActive]}><Text style={[styles.chipText, filter === item && styles.chipTextActive]}>{item}</Text></Pressable>)}</View>
        <Text style={styles.listLabel}>{visible.length} 个课程 · 可按自己的节奏学习</Text>
        {visible.map((lesson) => {
          const p = lessonProgress(state, lesson.id);
          const badge = status !== 'ready' ? '进度待读取' : passedQuiz(p.bestAttempt) ? '✓ 测验通过' : p.completedAt ? '✓ 阅读完成' : '待学习';
          return <Pressable key={lesson.id} accessibilityRole="button" accessibilityLabel={`第 ${lesson.order} 课 ${lesson.title}，${badge}`} onPress={() => showLesson(lesson)} style={styles.courseCard}>
            <View style={styles.courseNumber}><Text style={styles.courseNumberText}>{String(lesson.order).padStart(2, '0')}</Text></View>
            <View style={styles.courseMain}>
              <View style={styles.courseMeta}><Text style={styles.category}>{lesson.category}</Text><Text style={[styles.badge, p.completedAt && styles.badgeComplete]}>{badge}</Text></View>
              <Text style={styles.courseTitle}>{lesson.title}</Text><Text style={styles.note}>{lesson.subtitle}</Text>
              <Text style={styles.courseFooter}>{lesson.articles} · 约 {lesson.minutes} 分钟 · 10 题{p.bestAttempt ? ` · 最高 ${p.bestAttempt.score}/10` : ''}</Text>
            </View><Text style={styles.chevron}>›</Text>
          </Pressable>;
        })}
        {visible.length === 0 && <View style={styles.card}><Text style={styles.sectionTitle}>没有匹配课程</Text><Text style={styles.body}>换个关键词或筛选项试试。</Text></View>}
        <View style={styles.card} testID="scenario-exam-catalog" onLayout={(event) => { sectionPositions.current['scenario-exams'] = event.nativeEvent.layout.y; scrollToPendingSection(); }}>
          <Text style={styles.eyebrow}>课程最后 · 综合练习</Text>
          <Text style={styles.sectionTitle}>综合情景测试 · 5 套 50 题</Text>
          <Text style={styles.body}>判断是否吹哨，再决定判什么、罚球、球权和计时。每套混合多个课程主题，提交后逐题复盘。</Text>
          <Text style={styles.note}>建议完成 16 课后练习，也可直接进入。已通过 {status === 'ready' ? refereeScenarioExams.filter((exam) => passedQuiz(examProgress(state, exam.id).bestAttempt)).length : '—'} / 5 套。</Text>
          {refereeScenarioExams.map((exam) => {
            const p = examProgress(state, exam.id);
            const badge = status !== 'ready' ? '进度待读取' : passedQuiz(p.bestAttempt) ? '✓ 已通过' : p.latestAttempt ? '待巩固' : Object.keys(p.draftAnswers).length ? '答题中' : '未开始';
            return <Pressable key={exam.id} accessibilityRole="button" accessibilityLabel={`${exam.title}，${badge}`} onPress={() => { setExamReturn(null); setExamSelection({ id: exam.id, review: false }); }} style={styles.courseCard}>
              <View style={styles.courseMain}><Text style={styles.courseTitle}>{exam.title}</Text><Text style={styles.note}>{exam.subtitle}</Text><Text style={styles.courseFooter}>10 道情景 · {badge}{p.bestAttempt ? ` · 最高 ${p.bestAttempt.score}/10` : ''}{Object.keys(p.draftAnswers).length ? ` · 草稿 ${Object.keys(p.draftAnswers).length}/10` : ''}</Text></View><Text style={styles.chevron}>›</Text>
            </Pressable>;
          })}
        </View>
        <View style={styles.card}><Text style={styles.sectionTitle}>备训资料</Text><Text style={styles.note}>{REFEREE_CONTENT_NOTE}</Text><Text style={styles.note}>8 / 10 是本学习模块的复习门槛，并非 FIBA 裁判资格考试合格标准。进度保存在当前设备。</Text><Pressable accessibilityRole="link" onPress={() => void openSource()} style={styles.sourceButton}><Text style={styles.sourceText}>打开官方英文 PDF ↗</Text></Pressable><Text style={styles.finePrint}>{REFEREE_SOURCE_TITLE} · August 2026 v1.0</Text></View>
      </> : mode === 'lesson' ? <>
        <Text style={styles.eyebrow}>{selected.category} · {selected.articles}</Text><Text style={styles.title}>{selected.title}</Text><Text style={styles.subtitle}>{selected.subtitle}</Text>
        {examReturn && <Button label="返回综合测验复盘" secondary onPress={() => { setExamSelection({ id: examReturn, review: true }); setExamReturn(null); }} />}
        <View style={styles.card}><Text style={styles.sectionTitle}>这一课要学会</Text>{selected.objectives.map((goal) => <Text key={goal} style={styles.body}>• {goal}</Text>)}</View>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>本课学习目录</Text>
          <Text style={styles.note}>{selected.sections.length} 节详细讲解 · 约 {selected.minutes} 分钟{ '\n' }本课 {selected.questions.length} 道测验的考点均有对应讲解。点击目录可跳转，读完后再做题。</Text>
          {selected.sections.map((section, i) => <Pressable key={section.id} accessibilityRole="button" accessibilityLabel={`阅读讲解 ${i + 1} ${section.title}`} onPress={() => readSection(section.id)} style={styles.contentsItem}>
            <Text style={styles.sourceText}>{String(i + 1).padStart(2, '0')} · {section.title} →</Text>
          </Pressable>)}
        </View>
        {selected.sections.map((section, i) => <View key={section.id} testID={`reading-section-${section.id}`}
          onLayout={(event) => { sectionPositions.current[section.id] = event.nativeEvent.layout.y; scrollToPendingSection(); }}
          style={[styles.card, readingTarget === section.id && styles.readingTarget]}>
          <Text style={styles.sectionEyebrow}>讲解 {i + 1} / {selected.sections.length}{readingTarget === section.id ? ' · 当前复习' : ''}</Text>
          <Text style={styles.sectionTitle}>{section.title}</Text><Text selectable style={styles.body}>{section.body}</Text>
          <View style={styles.example}><Text style={styles.sectionEyebrow}>场上案例</Text><Text selectable style={styles.body}>{section.example.scenario}</Text><Text style={styles.caseLabel}>判罚与理由</Text><Text selectable style={styles.body}>{section.example.ruling}</Text></View>
          <View style={styles.pitfall}><Text style={styles.caseLabel}>易错点</Text><Text selectable style={styles.note}>{section.pitfall}</Text></View>
          <View style={styles.originalSources}>
            <Text style={styles.sectionTitle}>对应英文原文</Text>
            <Text style={styles.note}>选择下方条款，对照官方英文规则或案例。</Text>
            <View style={styles.chips}>{[section.reference, ...section.additionalReferences].map((reference) => {
              const active = original?.sectionId === section.id && original.reference === reference;
              return <Pressable key={reference} accessibilityRole="button" accessibilityLabel={`阅读英文原文 ${reference}`}
                accessibilityState={{ selected: active }} onPress={() => setOriginal({ sectionId: section.id, reference })}
                style={[styles.chip, active && styles.chipActive]}><Text style={[styles.chipText, active && styles.chipTextActive]}>{reference} · 第 {referencePage(reference)} 页</Text></Pressable>;
            })}</View>
            {original?.sectionId === section.id && <>
              <RefereeOriginalReader key={original.reference} reference={original.reference} />
              <Button label="收起英文原文" secondary onPress={() => setOriginal(null)} />
            </>}
            <Source reference={original?.sectionId === section.id ? original.reference : section.reference} />
          </View>
        </View>)}
        <View style={styles.checklist}><Text style={styles.sectionTitle}>上场前的判断清单</Text>{selected.checklist.map((item) => <Text key={item} style={styles.body}>✓ {item}</Text>)}</View>
        <Text style={styles.note}>本课是中文学习讲解。点击条款可查官方原文；页码按 PDF 文件页面计，部分手机阅读器需手动跳页。</Text>
        {progress?.completedAt ? <>
          <View style={styles.completedNotice}><Text style={styles.completedText}>✓ 已标记阅读完成 · {new Date(progress.completedAt).toLocaleDateString('zh-CN')}</Text></View>
          <Button label={Object.keys(progress.draftAnswers).length ? `继续测验 · 已答 ${Object.keys(progress.draftAnswers).length}/10` : progress.latestAttempt ? '重做本课 10 题' : '开始本课测验 · 10 题'} disabled={disabled} onPress={startQuiz} />
          {progress.latestAttempt && <><Text style={styles.note}>最近 {progress.latestAttempt.score}/10 · 最高 {progress.bestAttempt?.score}/10 · 已做 {progress.attemptCount} 次</Text><Button label="查看上次成绩与解析" secondary onPress={showResult} disabled={busy} /></>}
        </> : <>
          <Text style={styles.note}>读完以上要点后标记完成，即可解锁这一课的 10 道测验。</Text>
          <Button label={busy ? '正在保存…' : '标记为已完成 · Mark as completed'} disabled={disabled} onPress={() => void mutate(() => completeRefereeLesson(selected.id))} />
          <Button label="测验尚未解锁 · 请先完成阅读" secondary disabled onPress={() => undefined} />
        </>}
        {selected.order < refereeLessons.length && <Button label={`阅读下一课 · ${refereeLessons[selected.order].title}`} secondary disabled={busy} onPress={() => showLesson(refereeLessons[selected.order])} />}
        {selected.order === refereeLessons.length && <Button label="进入综合情景测试 · 5 套 50 题" secondary disabled={busy} onPress={showScenarioCatalog} />}
      </> : mode === 'quiz' && progress ? (() => {
        const q = selected.questions[questionIndex];
        const answer = progress.draftAnswers[q.id];
        const answered = Object.keys(progress.draftAnswers).length;
        return <>
          <Text style={styles.eyebrow}>第 {selected.order} 课 · 10 道单选题</Text><Text style={styles.quizTitle}>{selected.title}</Text>
          <View style={styles.quizMeta}><Text style={styles.sectionTitle}>第 {questionIndex + 1} / 10 题</Text><Text style={styles.note}>已答 {answered} / 10</Text></View>
          <View style={styles.track}><View style={[styles.trackFill, { width: `${answered / selected.questions.length * 100}%` }]} /></View>
          <Text style={styles.note}>每次选择后自动保存，可返回阅读或切换页面后继续。提交后显示解析。</Text>
          <View style={styles.card}><Text style={styles.question}>{q.prompt}</Text>{q.options.map((option, index) => <Pressable key={option} accessibilityRole="radio" accessibilityLabel={`${String.fromCharCode(65 + index)} ${option}`} accessibilityState={{ checked: answer === index, disabled }} disabled={disabled} onPress={() => void mutate(() => saveRefereeAnswer(selected.id, q.id, index))} style={[styles.option, answer === index && styles.optionSelected]}><Text style={[styles.optionLetter, answer === index && styles.optionLetterSelected]}>{String.fromCharCode(65 + index)}</Text><Text style={styles.optionText}>{option}</Text></Pressable>)}</View>
          {busy && <Text style={styles.note}>正在保存答案…</Text>}
          <View style={styles.questionDots}>{selected.questions.map((item, index) => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`跳到第 ${index + 1} 题`} accessibilityState={{ selected: questionIndex === index, disabled: busy }} disabled={busy} onPress={() => setQuestionIndex(index)} style={[styles.questionDot, Object.hasOwn(progress.draftAnswers, item.id) && styles.questionDotAnswered, questionIndex === index && styles.questionDotCurrent]}><Text style={styles.questionDotText}>{index + 1}</Text></Pressable>)}</View>
          <View style={styles.quizNavigation}><View style={styles.navButton}><Button label="上一题" secondary disabled={busy || questionIndex === 0} onPress={() => setQuestionIndex(questionIndex - 1)} /></View><View style={styles.navButton}><Button label="下一题" disabled={busy || questionIndex === selected.questions.length - 1} onPress={() => setQuestionIndex(questionIndex + 1)} /></View></View>
          <Button label={busy ? '正在保存…' : answered === selected.questions.length ? '提交测验 · 查看成绩' : `还剩 ${selected.questions.length - answered} 题未答`} disabled={disabled || answered !== selected.questions.length} onPress={() => void mutate(() => submitRefereeQuiz(selected.id), showResult)} />
        </>;
      })() : progress?.latestAttempt ? (() => {
        const attempt = progress.latestAttempt;
        const wrong = selected.questions.filter((q) => attempt.answers[q.id] !== q.correctIndex);
        const passed = passedQuiz(attempt);
        const reviews = wrongOnly ? wrong : selected.questions;
        return <>
          <Text style={styles.eyebrow}>第 {selected.order} 课 · 测验复盘</Text><Text style={styles.quizTitle}>{selected.title}</Text>
          <View style={styles.hero}><Text style={styles.resultScore}>{attempt.score}<Text style={styles.resultTotal}> / {attempt.total}</Text></Text><Text style={styles.heroTitle}>{passed ? '本课测验通过' : '再把这些重点练稳'}</Text><Text style={styles.heroText}>通过标准 8 / 10 · 最高 {progress.bestAttempt?.score}/10{ '\n' }{wrong.length ? `${wrong.length} 道错题，下面逐题回看判断依据。` : '全部答对。也可以打开全部解析再巩固一次。'}</Text></View>
          <View style={styles.chips}><Pressable accessibilityRole="button" accessibilityState={{ selected: wrongOnly }} onPress={() => setWrongOnly(true)} style={[styles.chip, wrongOnly && styles.chipActive]}><Text style={styles.chipText}>只看错题 · {wrong.length}</Text></Pressable><Pressable accessibilityRole="button" accessibilityState={{ selected: !wrongOnly }} onPress={() => setWrongOnly(false)} style={[styles.chip, !wrongOnly && styles.chipActive]}><Text style={styles.chipText}>全部解析</Text></Pressable></View>
          {wrongOnly && wrong.length === 0 && <View style={styles.card}><Text style={styles.sectionTitle}>这一轮没有错题</Text><Text style={styles.body}>点击「全部解析」可以回顾每题的判断依据。</Text></View>}
          {reviews.map((q) => {
            const correct = attempt.answers[q.id] === q.correctIndex;
            const section = selected.sections.find((item) => item.id === q.studySectionId)!;
            return <View key={q.id} style={styles.card}><Text style={[styles.reviewStatus, !correct && styles.errorText]}>{correct ? '✓ 正确' : '需复习'} · 第 {selected.questions.indexOf(q) + 1} 题</Text><Text style={styles.question}>{q.prompt}</Text><Text style={styles.body}>你的答案：{q.options[attempt.answers[q.id]]}</Text>{!correct && <Text style={styles.correctAnswer}>正确答案：{q.options[q.correctIndex]}</Text>}<Text selectable style={styles.body}>{q.explanation}</Text><Source reference={q.reference} />
              <Button label={`回看本课讲解 · ${section.title}`} secondary onPress={() => readSection(q.studySectionId)} />
              <Button label={`阅读对应英文原文 · ${q.reference}`} secondary onPress={() => { readSection(q.studySectionId); setOriginal({ sectionId: q.studySectionId, reference: q.reference }); }} />
            </View>;
          })}
          <Button label="重做本课 10 题" disabled={disabled} onPress={startQuiz} /><Button label="返回本课阅读" secondary onPress={() => setMode('lesson')} />
          {selected.order < refereeLessons.length && <Button label={`继续第 ${selected.order + 1} 课`} secondary onPress={() => showLesson(refereeLessons[selected.order])} />}
          {selected.order === refereeLessons.length && <Button label="进入综合情景测试 · 5 套 50 题" secondary onPress={showScenarioCatalog} />}
        </>;
      })() : null}
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  page: { padding: 22, paddingBottom: 36, gap: 16 },
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  back: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 6 }, backText: { color: colors.primary, fontSize: 16, fontWeight: '700' }, toolbarText: { color: colors.muted, fontSize: 12 },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: colors.ink, fontSize: 29, fontWeight: '800', lineHeight: 40 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 23 },
  hero: { borderRadius: 24, backgroundColor: colors.primaryPale, padding: 22, gap: 16, borderWidth: 1, borderColor: colors.primarySoft },
  heroTop: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  version: { color: colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 1.2 }, versionDate: { color: colors.muted, fontSize: 11 },
  heroTitle: { color: colors.ink, fontSize: 22, fontWeight: '800', lineHeight: 32 }, heroText: { color: colors.muted, fontSize: 13, lineHeight: 23 },
  stats: { flexDirection: 'row', gap: 24 }, stat: { flex: 1, gap: 6 }, statValue: { color: colors.primary, fontSize: 32, fontWeight: '800' }, statTotal: { color: colors.muted, fontSize: 14, fontWeight: '500' }, statLabel: { color: colors.muted, fontSize: 12 },
  track: { height: 7, backgroundColor: colors.primarySoft, borderRadius: 4, overflow: 'hidden' }, trackFill: { height: 7, backgroundColor: colors.primary, borderRadius: 4 },
  button: { minHeight: 48, paddingVertical: 14, paddingHorizontal: 16, backgroundColor: colors.primary, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: colors.surface, fontSize: 14, fontWeight: '700', textAlign: 'center', lineHeight: 22 }, secondaryButton: { backgroundColor: colors.surfaceMuted }, secondaryButtonText: { color: colors.primary }, disabled: { opacity: 0.45 },
  search: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 16, minHeight: 50, paddingHorizontal: 16, fontSize: 14, color: colors.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, chip: { minHeight: 42, paddingHorizontal: 13, paddingVertical: 11, backgroundColor: colors.surface, borderRadius: 22, borderWidth: 1, borderColor: colors.border }, chipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primarySoft }, chipText: { color: colors.muted, fontSize: 12, fontWeight: '600' }, chipTextActive: { color: colors.primary }, listLabel: { color: colors.muted, fontSize: 12 },
  courseCard: { backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }, courseNumber: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryPale }, courseNumberText: { color: colors.primary, fontSize: 15, fontWeight: '800' }, courseMain: { flex: 1, gap: 8 }, courseMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' }, category: { color: colors.muted, fontSize: 10 }, badge: { color: colors.subtle, fontSize: 10 }, badgeComplete: { color: colors.primary }, courseTitle: { color: colors.ink, fontSize: 16, fontWeight: '700', lineHeight: 24 }, courseFooter: { color: colors.muted, fontSize: 10, lineHeight: 17 }, chevron: { color: colors.subtle, fontSize: 24 },
  card: { borderRadius: 20, backgroundColor: colors.surface, padding: 20, gap: 14, borderWidth: 1, borderColor: colors.border }, sectionEyebrow: { color: colors.primary, fontSize: 11, fontWeight: '700' }, sectionTitle: { color: colors.ink, fontSize: 17, fontWeight: '700', lineHeight: 26 }, body: { color: colors.ink, fontSize: 15, lineHeight: 28 }, note: { color: colors.muted, fontSize: 13, lineHeight: 22 }, finePrint: { color: colors.muted, fontSize: 10, lineHeight: 18 },
  sourceButton: { minHeight: 44, justifyContent: 'center' }, sourceText: { color: colors.primary, fontSize: 12, fontWeight: '600', lineHeight: 21 },
  originalSources: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: 16, gap: 12 },
  contentsItem: { minHeight: 44, justifyContent: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, paddingVertical: 10 },
  readingTarget: { borderColor: colors.primary, borderWidth: 2 },
  example: { backgroundColor: colors.primaryPale, borderRadius: 14, padding: 16, gap: 10 },
  pitfall: { backgroundColor: colors.surfaceMuted, borderRadius: 14, padding: 14, gap: 8 },
  caseLabel: { color: colors.primary, fontSize: 13, fontWeight: '700', lineHeight: 22 },
  checklist: { backgroundColor: colors.primaryPale, padding: 20, borderRadius: 20, gap: 12 }, notice: { padding: 16, borderRadius: 16, backgroundColor: colors.surfaceMuted, gap: 12 }, errorNotice: { padding: 16, borderRadius: 16, backgroundColor: colors.dangerSoft }, errorText: { color: colors.danger, fontSize: 13, lineHeight: 22 }, completedNotice: { padding: 16, borderRadius: 16, backgroundColor: colors.primarySoft }, completedText: { color: colors.primary, fontSize: 13, fontWeight: '700', lineHeight: 22 },
  quizTitle: { color: colors.ink, fontSize: 23, fontWeight: '800', lineHeight: 34 }, quizMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }, question: { color: colors.ink, fontSize: 17, fontWeight: '700', lineHeight: 29 },
  option: { minHeight: 52, padding: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 16, flexDirection: 'row', gap: 12, alignItems: 'center' }, optionSelected: { borderColor: colors.primary, backgroundColor: colors.primaryPale }, optionLetter: { color: colors.muted, fontWeight: '800', fontSize: 14 }, optionLetterSelected: { color: colors.primary }, optionText: { color: colors.ink, flex: 1, fontSize: 14, lineHeight: 23 },
  questionDots: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, questionDot: { width: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, questionDotAnswered: { backgroundColor: colors.primarySoft }, questionDotCurrent: { borderColor: colors.primary, borderWidth: 2 }, questionDotText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  quizNavigation: { flexDirection: 'row', gap: 12 }, navButton: { flex: 1 }, resultScore: { color: colors.primary, fontSize: 52, fontWeight: '800' }, resultTotal: { color: colors.muted, fontSize: 20, fontWeight: '500' }, reviewStatus: { color: colors.primary, fontWeight: '700', fontSize: 12 }, correctAnswer: { color: colors.primary, fontSize: 14, lineHeight: 24, fontWeight: '700' },
});
