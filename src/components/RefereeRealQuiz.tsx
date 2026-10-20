import { useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { createRealQuizQueue, refereeRealQuizQuestions, refereeSignals } from '../data/refereeRealQuiz';
import { referencePage } from '../refereeUtils';
import { colors } from '../theme';
import { Referee3DPreview } from './Referee3DPreview';

// Rulebook figures share one height so a step's signals line up; two portrait figures fit a phone row.
const FIGURE_HEIGHT = 200;

type Props = {
  onOpenReference: (reference: string) => void;
  onStudy: (lessonId: string, sectionId: string, reference: string) => void;
};

export function RefereeRealQuiz({ onOpenReference, onStudy }: Props) {
  const [questionId, setQuestionId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const queue = useRef<string[]>([]);
  const question = refereeRealQuizQuestions.find((item) => item.id === questionId) ?? null;
  const hasSignals = question?.signalSequence.some((step) => step.signals?.length) ?? false;

  function generate() {
    let remaining = queue.current;
    if (remaining.length === 0) remaining = createRealQuizQueue(questionId);
    const [next, ...rest] = remaining;
    queue.current = rest;
    setQuestionId(next);
    setRevealed(false);
  }

  return <View style={styles.shell} testID="referee-real-quiz">
    <View style={styles.headingRow}>
      <View style={styles.headingCopy}>
        <Text style={styles.eyebrow}>RANDOM COURT CALL · 随机临场判断</Text>
        <Text style={styles.title}>真实判例练习</Text>
      </View>
      <View style={styles.countBadge}><Text style={styles.countText}>10 CLIPS</Text></View>
    </View>
    <Text style={styles.body}>点击后随机抽取判例动图。先像在场上一样吹哨或做手势，再展开答案；不用打字，也不会调用麦克风或摄像头。</Text>
    <Text style={styles.note}>题库按打乱顺序完整轮换，不按章节排列；一轮内不会重复。动图为离线战术示意，并非官方比赛录像。</Text>
    <Referee3DPreview />
    <Pressable accessibilityRole="button" accessibilityLabel={question ? '再来一题 · Generate Next Quiz' : '生成真实判例 · Generate Real Quiz'} onPress={generate} style={styles.generateButton}>
      <Text style={styles.generateButtonText}>{question ? '再来一题 · Generate Next Quiz' : '生成真实判例 · Generate Real Quiz'}</Text>
      <Text style={styles.generateArrow}>↻</Text>
    </Pressable>

    {question && <View style={styles.quizCard}>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>{question.animationLabel}</Text>
        <Text style={styles.meta}>FIBA 2026</Text>
      </View>
      <View style={styles.replayFrame}>
        <Image key={question.id} source={question.animation} accessible accessibilityLabel={question.animationAlt} resizeMode="contain" style={styles.replay} />
        <View style={styles.replayBadge}><Text style={styles.replayBadgeText}>示意动图 · 循环播放</Text></View>
      </View>
      <Text style={styles.prompt}>{question.prompt}</Text>
      <View style={styles.courtCue}>
        <Text style={styles.courtCueTitle}>你的临场决定</Text>
        <Text style={styles.courtCueText}>现在吹哨或做出手势。准备好后再展开判罚。</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={revealed ? '收起答案 · Hide ruling' : '展开答案 · Reveal ruling'}
        accessibilityState={{ expanded: revealed }} onPress={() => setRevealed((value) => !value)} style={styles.revealButton}>
        <Text style={styles.revealText}>{revealed ? '收起答案 · Hide ruling' : '展开答案 · Reveal ruling'}</Text>
        <Text style={styles.revealIcon}>{revealed ? '−' : '+'}</Text>
      </Pressable>

      {revealed && <View style={styles.answer} accessibilityLiveRegion="polite">
        <Text style={[styles.decision, !question.whistle && styles.decisionPlayOn]}>{question.whistle ? '吹哨 · STOP PLAY' : '不吹哨 · PLAY ON'}</Text>
        <Text style={styles.ruling}>{question.options[question.correctIndex]}</Text>
        <Text style={styles.explanation}>{question.explanation}</Text>
        <View style={styles.learningBlock}>
          <Text style={styles.learningLabel}>英文术语 · ENGLISH TERMS</Text>
          <View style={styles.termList}>
            {question.englishTerms.map((term) => <View key={`${question.id}-${term.english}`} style={styles.termChip}>
              <Text style={styles.termChinese}>{term.chinese}</Text>
              <Text style={styles.termEnglish}>{term.english}</Text>
            </View>)}
          </View>
        </View>
        <View style={styles.learningBlock}>
          <Text style={styles.learningLabel}>裁判手势顺序 · SIGNAL SEQUENCE</Text>
          <View style={styles.signalList}>
            {question.signalSequence.map((step, index) => <View key={`${question.id}-signal-${index}`} style={styles.signalStep}>
              <View style={styles.signalRow}>
                <View style={styles.signalNumber}><Text style={styles.signalNumberText}>{index + 1}</Text></View>
                <Text style={styles.signalText}>{step.text}</Text>
              </View>
              {step.signals && <View style={styles.figureRow}>
                {step.signals.map((id) => {
                  const signal = refereeSignals[id];
                  return <View key={`${question.id}-${index}-${id}`} style={[styles.figure, { width: FIGURE_HEIGHT * signal.width / signal.height }]}>
                    <Image source={signal.image} accessible accessibilityLabel={`FIBA 官方手势 #${signal.figure} ${signal.english}：${signal.alt}`}
                      resizeMode="contain" style={[styles.figureImage, { aspectRatio: signal.width / signal.height }]} />
                    <Text style={styles.figureCaption}>#{signal.figure} · {signal.chinese}</Text>
                  </View>;
                })}
              </View>}
            </View>)}
          </View>
          {!hasSignals && <View style={styles.noSignal}>
            <Text style={styles.noSignalTitle}>无官方手势 · NO SIGNAL</Text>
            <Text style={styles.noSignalText}>FIBA 附录 A 没有“Play on”手势：不吹哨、不做任何手势，保持观察即可。</Text>
          </View>}
          {question.signalNote && <Text style={styles.signalNote}>{question.signalNote}</Text>}
          {hasSignals && <Text style={styles.signalSource}>手势图：FIBA Official Basketball Rules 2026 · Appendix A Referees’ Signals（PlayPic®）</Text>}
        </View>
        <View style={styles.ruleTrace}>
          <Text style={styles.ruleTraceLabel}>判罚依据 · OFFICIAL SOURCE</Text>
          <Text style={styles.ruleTraceTitle}>FIBA 2026 官方解释 {question.reference}</Text>
          <Text style={styles.ruleTraceText}>PDF 第 {referencePage(question.reference)} 页。以下链接直接回到本题对应的官方英文原文；中文解释为本应用学习整理。</Text>
          <Pressable accessibilityRole="link" accessibilityLabel={`查看条款 ${question.reference} 原文`} onPress={() => onOpenReference(question.reference)} style={styles.linkButton}>
            <Text style={styles.linkText}>打开官方英文原文 · {question.reference} ↗</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="回看对应课程讲解" onPress={() => onStudy(question.lessonId, question.studySectionId, question.reference)} style={styles.studyButton}>
            <Text style={styles.studyText}>回看对应课程讲解 →</Text>
          </Pressable>
        </View>
      </View>}
    </View>}
  </View>;
}

const styles = StyleSheet.create({
  shell: { borderRadius: 24, backgroundColor: '#182019', padding: 20, gap: 15, overflow: 'hidden' },
  headingRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  headingCopy: { flex: 1, gap: 6 },
  eyebrow: { color: '#A8C9AC', fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  title: { color: colors.surface, fontSize: 22, fontWeight: '800', lineHeight: 31 },
  countBadge: { borderRadius: 14, backgroundColor: '#314A37', paddingHorizontal: 10, paddingVertical: 8 },
  countText: { color: '#F3BD5B', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  body: { color: '#F2F5F0', fontSize: 14, lineHeight: 24 },
  note: { color: '#AFB9B1', fontSize: 12, lineHeight: 20 },
  generateButton: { minHeight: 52, borderRadius: 16, paddingHorizontal: 17, backgroundColor: '#F3BD5B', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  generateButtonText: { color: '#182019', flex: 1, fontSize: 14, fontWeight: '800', lineHeight: 22 },
  generateArrow: { color: '#182019', fontSize: 23, fontWeight: '800' },
  quizCard: { borderRadius: 19, backgroundColor: colors.surface, padding: 14, gap: 14 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  meta: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  replayFrame: { position: 'relative', borderRadius: 15, overflow: 'hidden', backgroundColor: colors.primaryPale, borderWidth: 1, borderColor: colors.primarySoft },
  // 'auto' height stops react-native-web from applying the bundled image's pixel height before aspectRatio.
  replay: { width: '100%', height: 'auto', aspectRatio: 16 / 9 },
  replayBadge: { position: 'absolute', left: 10, bottom: 10, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: 'rgba(24,32,25,0.82)' },
  replayBadgeText: { color: colors.surface, fontSize: 9, fontWeight: '700' },
  prompt: { color: colors.ink, fontSize: 17, fontWeight: '800', lineHeight: 28 },
  courtCue: { borderRadius: 14, backgroundColor: colors.primaryPale, padding: 14, gap: 5, borderLeftWidth: 4, borderLeftColor: '#F3BD5B' },
  courtCueTitle: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  courtCueText: { color: colors.muted, fontSize: 12, lineHeight: 20 },
  revealButton: { minHeight: 48, borderRadius: 14, paddingHorizontal: 15, backgroundColor: colors.surfaceMuted, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  revealText: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  revealIcon: { color: colors.primary, fontSize: 22, fontWeight: '600' },
  answer: { gap: 13, paddingTop: 2 },
  decision: { alignSelf: 'flex-start', borderRadius: 20, overflow: 'hidden', backgroundColor: colors.dangerSoft, color: colors.danger, paddingHorizontal: 12, paddingVertical: 8, fontSize: 11, fontWeight: '800', letterSpacing: 0.7 },
  decisionPlayOn: { backgroundColor: colors.primarySoft, color: colors.primary },
  ruling: { color: colors.ink, fontSize: 15, fontWeight: '800', lineHeight: 25 },
  explanation: { color: colors.ink, fontSize: 14, lineHeight: 25 },
  learningBlock: { borderRadius: 15, backgroundColor: '#F7F3E8', padding: 15, gap: 11, borderWidth: 1, borderColor: '#E8D7A8' },
  learningLabel: { color: '#6D5426', fontSize: 9, fontWeight: '800', letterSpacing: 0.9 },
  termList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  termChip: { borderRadius: 11, backgroundColor: colors.surface, paddingHorizontal: 10, paddingVertical: 8, gap: 2, borderWidth: 1, borderColor: '#E8D7A8' },
  termChinese: { color: colors.ink, fontSize: 11, fontWeight: '800' },
  termEnglish: { color: '#806124', fontSize: 10, fontWeight: '700' },
  signalList: { gap: 14 },
  signalStep: { gap: 9 },
  signalRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  signalNumber: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#F3BD5B', alignItems: 'center', justifyContent: 'center' },
  signalNumberText: { color: '#182019', fontSize: 10, fontWeight: '800' },
  signalText: { flex: 1, color: colors.ink, fontSize: 12, lineHeight: 21 },
  figureRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  figure: { maxWidth: '100%', borderRadius: 10, overflow: 'hidden', backgroundColor: colors.surface, borderWidth: 1, borderColor: '#E8D7A8' },
  figureImage: { width: '100%', height: 'auto' },
  figureCaption: { color: '#6D5426', fontSize: 10, fontWeight: '800', lineHeight: 15, paddingHorizontal: 7, paddingVertical: 5, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E8D7A8' },
  noSignal: { borderRadius: 11, backgroundColor: colors.surface, padding: 12, gap: 4, borderWidth: 1, borderColor: '#E8D7A8', borderStyle: 'dashed' },
  noSignalTitle: { color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  noSignalText: { color: colors.ink, fontSize: 12, lineHeight: 20 },
  signalNote: { color: '#6D5426', fontSize: 11, lineHeight: 19, fontWeight: '700', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#D9C38B', paddingTop: 10 },
  signalSource: { color: '#8A7444', fontSize: 9, lineHeight: 15 },
  ruleTrace: { borderRadius: 15, backgroundColor: colors.primaryPale, padding: 15, gap: 9, borderWidth: 1, borderColor: colors.primarySoft },
  ruleTraceLabel: { color: colors.primary, fontSize: 9, fontWeight: '800', letterSpacing: 0.9 },
  ruleTraceTitle: { color: colors.ink, fontSize: 14, fontWeight: '800', lineHeight: 22 },
  ruleTraceText: { color: colors.muted, fontSize: 12, lineHeight: 20 },
  linkButton: { minHeight: 44, justifyContent: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.primarySoft },
  linkText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  studyButton: { minHeight: 44, justifyContent: 'center' },
  studyText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
});
