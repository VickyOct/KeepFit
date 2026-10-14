import { Alert } from '../alert';
import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EXERCISES, MUSCLE_GROUPS } from '../data/exercises';
import { colors } from '../theme';
import { createId, formatHistoryDate, formatTime, getLocalDateKey } from '../utils';
import type {
  Exercise,
  MuscleGroup,
  WorkoutDraft,
  WorkoutDraftExercise,
  WorkoutDraftSet,
  WorkoutRecord,
} from '../workoutTypes';
import { buildWorkoutRecord } from '../workoutUtils';
import { DiagramReview } from './DiagramReview';
import { TechniqueReferences } from './TechniqueReferences';
import { FemaleFriendlyBadge, FemaleFriendlyFitCard } from './FemaleFriendlyFit';
import { FEMALE_FRIENDLY_EXPLANATION, FEMALE_FRIENDLY_LABEL } from '../data/femaleFriendlyFit';

type Props = {
  workouts: WorkoutRecord[];
  draft: WorkoutDraft | null;
  busy?: boolean;
  onDraftChange: (draft: WorkoutDraft | null) => void;
  onSave: (record: WorkoutRecord) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

type Route = 'session' | 'library' | 'guide' | 'detail' | 'custom' | 'diagram-review';
type CustomForm = {
  nameZh: string;
  nameEn: string;
  equipmentZh: string;
  equipmentEn: string;
  tracking: 'reps' | 'duration';
};

const emptyCustom: CustomForm = {
  nameZh: '', nameEn: '', equipmentZh: '', equipmentEn: '', tracking: 'reps',
};

function newSet(): WorkoutDraftSet {
  return { id: createId('set'), weight: '0', reps: '', seconds: '', completed: false };
}

function newDraft(): WorkoutDraft {
  return {
    id: createId('workout'),
    startedAt: new Date().toISOString(),
    title: '',
    notes: '',
    exercises: [],
  };
}

function countSets(record: WorkoutRecord | WorkoutDraft) {
  return record.exercises.reduce((total, exercise) => total + exercise.sets.filter((set) => set.completed).length, 0);
}

function recordDate(record: WorkoutRecord) {
  return `${formatHistoryDate(new Date(record.startedAt))} · ${formatTime(new Date(record.startedAt))}`;
}

function lengthLabel(record: WorkoutRecord) {
  const minutes = Math.max(0, Math.round((new Date(record.finishedAt).getTime() - new Date(record.startedAt).getTime()) / 60000));
  if (minutes < 1) return '不足 1 分钟';
  if (minutes < 60) return `${minutes} 分钟`;
  return `${Math.floor(minutes / 60)} 小时 ${minutes % 60} 分钟`;
}

function weightNote(exercise: Pick<Exercise, 'equipmentZh' | 'equipmentEn' | 'tracking'>) {
  if (exercise.tracking === 'duration') return '记录实际完成的秒数，如 1 分钟填 60。';
  if (/dumbbell|哑铃/i.test(`${exercise.equipmentZh} ${exercise.equipmentEn}`)) {
    return '重量记单只哑铃的 kg；单侧动作次数记每侧。';
  }
  if (/barbell|杠铃/i.test(`${exercise.equipmentZh} ${exercise.equipmentEn}`)) {
    return '重量记杠铃杆与两侧杠铃片的总 kg。';
  }
  return '重量单位 kg；自重填 0，器械按显示重量记，单侧次数记每侧。';
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function WorkoutScreen({ workouts, draft, busy = false, onDraftChange, onSave, onDelete }: Props) {
  const [route, setRoute] = useState<Route | null>(null);
  const [libraryReturn, setLibraryReturn] = useState<'session' | null>(null);
  const [guideReturn, setGuideReturn] = useState<Route>('library');
  const [guideExercise, setGuideExercise] = useState<Exercise | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup | '全部'>('全部');
  const [femaleFriendlyOnly, setFemaleFriendlyOnly] = useState(false);
  const [custom, setCustom] = useState<CustomForm>(emptyCustom);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const saveLock = useRef(false);

  const records = useMemo(
    () => [...workouts].sort((first, second) => second.startedAt.localeCompare(first.startedAt)),
    [workouts],
  );
  const selectedRecord = records.find((record) => record.id === selectedRecordId);
  const completedSets = draft ? countSets(draft) : 0;
  const filteredExercises = useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return EXERCISES.filter((exercise) => {
      const searchable = `${exercise.nameZh} ${exercise.nameEn} ${exercise.equipmentZh} ${exercise.equipmentEn} ${exercise.muscles} ${(exercise.aliases ?? []).join(' ')}`.toLowerCase();
      return (muscle === '全部' || exercise.muscleGroup === muscle)
        && (!femaleFriendlyOnly || Boolean(exercise.femaleFriendlyFit))
        && terms.every((term) => searchable.includes(term));
    });
  }, [query, muscle, femaleFriendlyOnly]);
  const thisWeekCount = useMemo(() => {
    const monday = new Date();
    monday.setHours(0, 0, 0, 0);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    return workouts.filter((record) => new Date(record.startedAt) >= monday).length;
  }, [workouts]);

  function go(next: Route | null) {
    Keyboard.dismiss();
    setRoute(next);
  }

  function closeModal() {
    if (busy || saveLock.current || deleting) return;
    if (route === 'guide') go(guideReturn);
    else if (route === 'diagram-review') go('library');
    else if (route === 'custom') go('library');
    else if (route === 'library') go(libraryReturn);
    else go(null);
  }

  function startWorkout() {
    if (busy) return;
    if (!draft) onDraftChange(newDraft());
    go('session');
  }

  function openLibrary(from: 'session' | null) {
    setLibraryReturn(from);
    go('library');
  }

  function openGuide(exercise: Exercise, from: Route) {
    setGuideExercise(exercise);
    setGuideReturn(from);
    go('guide');
  }

  function updateDraft(patch: Partial<WorkoutDraft>) {
    if (!draft || busy || saveLock.current) return;
    onDraftChange({ ...draft, ...patch });
  }

  function updateExercise(id: string, patch: Partial<WorkoutDraftExercise>) {
    if (!draft || saveLock.current) return;
    updateDraft({ exercises: draft.exercises.map((exercise) => exercise.id === id ? { ...exercise, ...patch } : exercise) });
  }

  function updateSet(exercise: WorkoutDraftExercise, id: string, patch: Partial<WorkoutDraftSet>) {
    updateExercise(exercise.id, {
      sets: exercise.sets.map((set) => set.id === id ? { ...set, ...patch } : set),
    });
  }

  function toggleSet(exercise: WorkoutDraftExercise, set: WorkoutDraftSet) {
    if (!draft || saveLock.current) return;
    if (!set.completed) {
      try {
        buildWorkoutRecord({ ...draft, exercises: [{ ...exercise, sets: [{ ...set, completed: true }] }] });
      } catch (error) {
        Alert.alert('先填好这一组', errorMessage(error, '请输入有效的重量和次数。'));
        return;
      }
    }
    Keyboard.dismiss();
    updateSet(exercise, set.id, { completed: !set.completed });
  }

  function addExercise(exercise: Pick<Exercise, 'id' | 'nameZh' | 'nameEn' | 'equipmentZh' | 'equipmentEn' | 'tracking'>) {
    if (busy || saveLock.current) return;
    const current = draft ?? newDraft();
    const existing = current.exercises.find((entry) => entry.exerciseId === exercise.id);
    if (existing) {
      onDraftChange({
        ...current,
        exercises: current.exercises.map((entry) => entry.id === existing.id ? { ...entry, sets: [...entry.sets, newSet()] } : entry),
      });
    } else {
      onDraftChange({
        ...current,
        exercises: [...current.exercises, {
          id: createId('workout-exercise'),
          exerciseId: exercise.id,
          nameZh: exercise.nameZh,
          nameEn: exercise.nameEn,
          equipmentZh: exercise.equipmentZh,
          equipmentEn: exercise.equipmentEn,
          tracking: exercise.tracking,
          sets: [newSet()],
        }],
      });
    }
    go('session');
  }

  function removeExercise(exercise: WorkoutDraftExercise) {
    if (saveLock.current) return;
    Alert.alert('移除这个动作？', `${exercise.nameZh}及其组数会从本次训练中移除。`, [
      { text: '取消', style: 'cancel' },
      { text: '移除', style: 'destructive', onPress: () => {
        if (draft && !saveLock.current) updateDraft({ exercises: draft.exercises.filter((entry) => entry.id !== exercise.id) });
      } },
    ]);
  }

  function removeSet(exercise: WorkoutDraftExercise, set: WorkoutDraftSet) {
    const remove = () => updateExercise(exercise.id, { sets: exercise.sets.filter((entry) => entry.id !== set.id) });
    if (set.completed) {
      Alert.alert('删除已完成的这一组？', '这一组的重量和次数会被移除。', [
        { text: '取消', style: 'cancel' },
        { text: '删除', style: 'destructive', onPress: remove },
      ]);
    } else remove();
  }

  function discardDraft() {
    if (saveLock.current) return;
    Alert.alert('放弃本次训练？', '未保存的动作和组数将被删除。已保存的历史记录不受影响。', [
      { text: '继续记录', style: 'cancel' },
      { text: '放弃训练', style: 'destructive', onPress: () => {
        if (saveLock.current) return;
        onDraftChange(null);
        go(null);
      } },
    ]);
  }

  async function saveWorkout() {
    if (!draft || saveLock.current) return;
    let record: WorkoutRecord;
    try {
      record = buildWorkoutRecord(draft);
    } catch (error) {
      Alert.alert('还不能保存', errorMessage(error, '请至少完成一组，并检查输入的数值。'));
      return;
    }
    saveLock.current = true;
    setSaving(true);
    Keyboard.dismiss();
    try {
      await onSave(record);
      go(null);
    } catch (error) {
      Alert.alert('保存失败', errorMessage(error, '本次训练仍保留在草稿中，请稍后重试。'));
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
  }

  function deleteRecord(record: WorkoutRecord) {
    Alert.alert('删除这次训练？', `${record.title}将从当前设备中移除，删除后无法恢复。`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: async () => {
        setDeleting(true);
        try {
          await onDelete(record.id);
          setSelectedRecordId(null);
          go(null);
        } catch (error) {
          Alert.alert('删除失败', errorMessage(error, '记录尚未删除，请稍后重试。'));
        } finally {
          setDeleting(false);
        }
      } },
    ]);
  }

  function saveCustomExercise() {
    if (!custom.nameZh.trim()) {
      Alert.alert('填写动作名称', '输入一个你能认出的动作名称，例如：坐姿推胸。');
      return;
    }
    addExercise({
      id: createId('custom'),
      nameZh: custom.nameZh.trim(),
      nameEn: custom.nameEn.trim(),
      equipmentZh: custom.equipmentZh.trim(),
      equipmentEn: custom.equipmentEn.trim(),
      tracking: custom.tracking,
    });
  }

  const modalTitle = route === 'session' ? '本次训练'
    : route === 'library' ? '动作与器材'
      : route === 'diagram-review' ? '三张图核对'
      : route === 'guide' ? '动作指导'
        : route === 'custom' ? '自定义动作' : '训练详情';
  const backLabel = route === 'session' ? '收起' : route === 'detail' ? '关闭' : '返回';

  return (
    <>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.page}>
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.eyebrow}>MOVE WITH PURPOSE</Text>
            <Text style={styles.pageTitle}>我的训练</Text>
          </View>
          <View style={styles.weekBadge}>
            <Text style={styles.weekNumber}>{thisWeekCount}</Text>
            <Text style={styles.weekText}>本周训练</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroEyebrow}>{draft ? 'WORKOUT IN PROGRESS' : 'A LITTLE STRONGER, EVERY TIME'}</Text>
              <Text style={styles.heroTitle}>{draft ? '接着练，接着记录' : '每一组，都算数'}</Text>
              <Text style={styles.heroText}>{draft ? `已添加 ${draft.exercises.length} 个动作 · 完成 ${completedSets} 组` : '选好动作，记下重量与次数。\n把今天的努力留在这里。'}</Text>
            </View>
            <Text style={styles.heroEmoji} accessibilityElementsHidden>🏋️</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={startWorkout} style={({ pressed }) => [styles.heroButton, pressed && styles.pressed]}>
            <Text style={styles.heroButtonText}>{draft ? '继续本次训练' : '＋ 开始训练'}</Text>
            <Text style={styles.heroButtonArrow}>↗</Text>
          </Pressable>
        </View>

        <Pressable accessibilityRole="button" accessibilityLabel="打开动作与器材库，中英文搜索及动作指导" onPress={() => openLibrary(null)} style={({ pressed }) => [styles.libraryCard, pressed && styles.pressed]}>
          <View style={styles.libraryIcon}><Text style={styles.libraryEmoji}>📖</Text></View>
          <View style={styles.flex}>
            <Text style={styles.cardTitle}>动作与器材库</Text>
            <Text style={styles.smallCopy}>中英对照 · 动作指导 · 技术参考</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>训练足迹</Text>
          <Text style={styles.sectionMeta}>{workouts.length} 次训练</Text>
        </View>
        {records.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🌱</Text>
            <Text style={styles.emptyTitle}>从第一组开始</Text>
            <Text style={styles.emptyCopy}>完成并保存训练后，动作、组数和重量都会出现在这里。</Text>
          </View>
        ) : (
          <View style={styles.stack}>
            {records.map((record) => (
              <Pressable key={record.id} accessibilityRole="button" accessibilityLabel={`查看${record.title}，${recordDate(record)}`} onPress={() => { setSelectedRecordId(record.id); go('detail'); }} style={({ pressed }) => [styles.historyCard, pressed && styles.pressed]}>
                <View style={styles.historyDate}>
                  <Text style={styles.historyDay}>{new Date(record.startedAt).getDate()}</Text>
                  <Text style={styles.historyMonth}>{new Date(record.startedAt).getMonth() + 1} 月</Text>
                </View>
                <View style={styles.flex}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{record.title}</Text>
                  <Text style={styles.historyExercises} numberOfLines={1}>{record.exercises.map((exercise) => exercise.nameZh).join(' · ')}</Text>
                  <Text style={styles.historyMeta}>{record.exercises.length} 个动作 · {countSets(record)} 组 · {lengthLabel(record)}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))}
          </View>
        )}
        <Text style={styles.pageFooter}>训练与草稿保存在当前设备。</Text>
      </ScrollView>

      <Modal visible={route !== null} animationType="slide" presentationStyle="fullScreen" onRequestClose={closeModal}>
        <SafeAreaView style={styles.modalSafe} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <Pressable accessibilityRole="button" accessibilityLabel={route === 'session' ? '收起训练，保留草稿' : backLabel} disabled={saving || deleting} onPress={closeModal} style={styles.headerButton}>
              <Text style={[styles.headerButtonText, (saving || deleting) && styles.disabledText]}>{route === 'session' || route === 'detail' ? backLabel : '‹ 返回'}</Text>
            </Pressable>
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="收起键盘" onPress={Keyboard.dismiss} style={styles.headerButton}>
              <Text style={styles.keyboardButton}>收键盘</Text>
            </Pressable>
          </View>

          <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            {route === 'session' && draft ? (
              <>
                <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalBody}>
                  <View style={styles.sessionIntro}>
                    <View style={styles.liveDot} />
                    <Text style={styles.sessionStatus}>{formatHistoryDate(new Date(draft.startedAt))} {formatTime(new Date(draft.startedAt))} 开始 · 草稿自动保留</Text>
                  </View>
                  <TextInput accessibilityLabel="训练名称" editable={!saving} value={draft.title} onChangeText={(title) => updateDraft({ title })} placeholder="给这次训练起个名字" placeholderTextColor={colors.subtle} maxLength={60} style={styles.titleInput} returnKeyType="done" onSubmitEditing={Keyboard.dismiss} />
                  <Text style={styles.sessionHint}>填入实际完成的数据，再点击右侧 ✓ 完成这一组。</Text>

                  {draft.exercises.length === 0 ? (
                    <View style={styles.sessionEmpty}>
                      <Text style={styles.emptyEmoji}>💪</Text>
                      <Text style={styles.emptyTitle}>今天准备练什么？</Text>
                      <Text style={styles.emptyCopy}>从动作库添加，也可以自己填写动作。</Text>
                    </View>
                  ) : (
                    <View style={styles.exerciseStack}>
                      {draft.exercises.map((exercise, index) => {
                        const catalog = EXERCISES.find((entry) => entry.id === exercise.exerciseId);
                        return (
                          <View key={exercise.id} style={styles.exerciseCard}>
                            <View style={styles.exerciseCardHeading}>
                              <View style={styles.exerciseNumber}><Text style={styles.exerciseNumberText}>{String(index + 1).padStart(2, '0')}</Text></View>
                              <View style={styles.flex}>
                                <Text style={styles.cardTitle}>{exercise.nameZh}</Text>
                                {exercise.nameEn ? <Text style={styles.englishName}>{exercise.nameEn}</Text> : null}
                              </View>
                              <Pressable disabled={saving} accessibilityRole="button" accessibilityLabel={`移除${exercise.nameZh}`} onPress={() => removeExercise(exercise)} style={styles.removeExerciseButton}><Text style={styles.removeText}>×</Text></Pressable>
                            </View>
                            {(exercise.equipmentZh || exercise.equipmentEn) ? <Text style={styles.equipmentLine}>{[exercise.equipmentZh, exercise.equipmentEn].filter(Boolean).join(' · ')}</Text> : null}
                            {catalog ? (
                              <Pressable disabled={saving} accessibilityRole="button" accessibilityLabel={`查看${exercise.nameZh}动作指导`} onPress={() => openGuide(catalog, 'session')} style={styles.guideLink}><Text style={styles.guideLinkText}>查看姿势与发力指导 ↗</Text></Pressable>
                            ) : <Text style={styles.customGuideNote}>自定义动作 · 暂无动作指导</Text>}
                            <Text style={styles.unitNote}>{weightNote(exercise)}</Text>
                            <View style={styles.setHeader}>
                              <Text style={[styles.setHeading, styles.setIndex]}>组</Text>
                              {exercise.tracking === 'reps' ? <Text style={[styles.setHeading, styles.setValue]}>重量 kg</Text> : null}
                              <Text style={[styles.setHeading, styles.setValue]}>{exercise.tracking === 'reps' ? '次数' : '时长 · 秒'}</Text>
                              <Text style={[styles.setHeading, styles.completeColumn]}>完成</Text>
                              <View style={styles.removeColumn} />
                            </View>
                            {exercise.sets.map((set, setIndex) => (
                              <View key={set.id} style={[styles.setRow, set.completed && styles.setRowComplete]}>
                                <Text style={[styles.setNumber, styles.setIndex]}>{setIndex + 1}</Text>
                                {exercise.tracking === 'reps' ? (
                                  <TextInput
                                    accessibilityLabel={`${exercise.nameZh}第${setIndex + 1}组重量，公斤`}
                                    editable={!saving}
                                    value={set.weight}
                                    onChangeText={(weight) => updateSet(exercise, set.id, { weight, completed: false })}
                                    keyboardType="decimal-pad"
                                    selectTextOnFocus
                                    placeholder="0"
                                    placeholderTextColor={colors.subtle}
                                    maxLength={8}
                                    style={[styles.setInput, styles.setValue, set.completed && styles.setInputComplete]}
                                  />
                                ) : null}
                                <TextInput
                                  accessibilityLabel={`${exercise.nameZh}第${setIndex + 1}组${exercise.tracking === 'reps' ? '次数' : '秒数'}`}
                                  editable={!saving}
                                  value={exercise.tracking === 'reps' ? set.reps : set.seconds}
                                  onChangeText={(value) => updateSet(exercise, set.id, { [exercise.tracking === 'reps' ? 'reps' : 'seconds']: value, completed: false })}
                                  keyboardType="number-pad"
                                  selectTextOnFocus
                                  placeholder="—"
                                  placeholderTextColor={colors.subtle}
                                  maxLength={6}
                                  style={[styles.setInput, styles.setValue, set.completed && styles.setInputComplete]}
                                />
                                <Pressable
                                  accessibilityRole="checkbox"
                                  accessibilityState={{ checked: set.completed, disabled: saving }}
                                  accessibilityLabel={`${exercise.nameZh}第${setIndex + 1}组${set.completed ? '取消完成' : '标记完成'}`}
                                  disabled={saving}
                                  onPress={() => toggleSet(exercise, set)}
                                  style={[styles.completeButton, set.completed && styles.completeButtonSelected]}
                                ><Text style={[styles.completeGlyph, set.completed && styles.completeGlyphSelected]}>✓</Text></Pressable>
                                <Pressable disabled={saving} accessibilityRole="button" accessibilityLabel={`删除${exercise.nameZh}第${setIndex + 1}组`} onPress={() => removeSet(exercise, set)} style={styles.removeSetButton}><Text style={styles.removeSetText}>−</Text></Pressable>
                              </View>
                            ))}
                            <Pressable disabled={saving} accessibilityRole="button" accessibilityLabel={`为${exercise.nameZh}增加一组`} onPress={() => updateExercise(exercise.id, { sets: [...exercise.sets, newSet()] })} style={styles.addSetButton}><Text style={styles.addSetText}>＋ 增加一组</Text></Pressable>
                          </View>
                        );
                      })}
                    </View>
                  )}

                  <Pressable disabled={saving} accessibilityRole="button" onPress={() => openLibrary('session')} style={({ pressed }) => [styles.addExerciseButton, pressed && styles.pressed]}><Text style={styles.addExerciseText}>＋ 添加动作</Text></Pressable>
                  <Text style={styles.fieldLabel}>训练笔记 <Text style={styles.optionalLabel}>选填</Text></Text>
                  <TextInput accessibilityLabel="训练笔记" editable={!saving} value={draft.notes} onChangeText={(notes) => updateDraft({ notes })} placeholder="今天的状态、器械档位、下次想调整什么…" placeholderTextColor={colors.subtle} multiline maxLength={1500} textAlignVertical="top" style={styles.notesInput} />
                  <Pressable disabled={saving} accessibilityRole="button" onPress={discardDraft} style={styles.discardButton}><Text style={styles.discardText}>放弃本次训练</Text></Pressable>
                </ScrollView>
                <View style={styles.actionFooter}>
                  <View style={styles.flex}>
                    <Text style={styles.footerCount}>{completedSets} <Text style={styles.footerUnit}>组已完成</Text></Text>
                    <Text style={styles.footerHint}>只保存已勾选的组</Text>
                  </View>
                  <Pressable disabled={saving} accessibilityRole="button" onPress={saveWorkout} style={({ pressed }) => [styles.saveButton, (saving || pressed) && styles.pressed]}>
                    {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveButtonText}>完成并保存</Text>}
                  </Pressable>
                </View>
              </>
            ) : null}

            {route === 'library' ? (
              <>
                <View style={styles.libraryToolbar}>
                  <Text style={styles.librarySubtitle}>找到动作，认识器材，练得更明白。</Text>
                  <View style={styles.searchBox}>
                    <Text style={styles.searchGlyph}>⌕</Text>
                    <TextInput accessibilityLabel="搜索动作或器材，支持中文和英文" value={query} onChangeText={setQuery} placeholder="搜索：胸推 / dumbbell / 龙门架" placeholderTextColor={colors.subtle} autoCorrect={false} autoCapitalize="none" returnKeyType="search" onSubmitEditing={Keyboard.dismiss} style={styles.searchInput} />
                    {query ? <Pressable accessibilityRole="button" accessibilityLabel="清空搜索" onPress={() => setQuery('')} style={styles.clearSearch}><Text style={styles.clearSearchText}>×</Text></Pressable> : null}
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                    {MUSCLE_GROUPS.map((group) => (
                      <Pressable key={group} accessibilityRole="button" accessibilityState={{ selected: group === muscle }} onPress={() => setMuscle(group)} style={[styles.filter, group === muscle && styles.filterSelected]}><Text style={[styles.filterText, group === muscle && styles.filterTextSelected]}>{group}</Text></Pressable>
                    ))}
                  </ScrollView>
                  <View style={styles.libraryResultsHeader}>
                    <Text style={styles.sectionMeta}>{filteredExercises.length} 个动作 · 点击查看指导</Text>
                    <Pressable accessibilityRole="button" onPress={() => { setCustom(emptyCustom); go('custom'); }} style={styles.customButton}><Text style={styles.customButtonText}>＋ 自定义</Text></Pressable>
                  </View>
                </View>
                <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} contentContainerStyle={styles.libraryList}>
                  <View style={styles.fitIntro}>
                    <Pressable accessibilityRole="checkbox" accessibilityLabel="只看女性友好候选，按身体适配条件筛选" accessibilityState={{ checked: femaleFriendlyOnly }} onPress={() => setFemaleFriendlyOnly((current) => !current)} style={styles.fitToggle}>
                      <Text style={styles.fitToggleText}>{femaleFriendlyOnly ? '☑' : '☐'} 只看{FEMALE_FRIENDLY_LABEL}</Text>
                    </Pressable>
                    <Text style={styles.fitExplanation}>{FEMALE_FRIENDLY_EXPLANATION}</Text>
                  </View>
                  <Pressable accessibilityRole="button" accessibilityLabel="查看三张健身图的核对说明" onPress={() => go('diagram-review')} style={styles.diagramCard}>
                    <Text style={styles.cardTitle}>三张健身图，哪些说对了？ ›</Text>
                    <Text style={styles.smallCopy}>逐图核对肌群对应，点击动作查看技术参考。</Text>
                  </Pressable>
                  {filteredExercises.length === 0 ? (
                    <View style={styles.emptyCard}>
                      <Text style={styles.emptyTitle}>没有找到这个动作</Text>
                      <Text style={styles.emptyCopy}>试试其他名称或训练部位，也可以清除筛选后重试。</Text>
                      <Pressable accessibilityRole="button" accessibilityLabel="清除动作库搜索和筛选" onPress={() => { setQuery(''); setMuscle('全部'); setFemaleFriendlyOnly(false); }} style={styles.emptyCustomButton}><Text style={styles.addSetText}>清除搜索和筛选</Text></Pressable>
                      <Pressable accessibilityRole="button" onPress={() => { setCustom(emptyCustom); go('custom'); }} style={styles.emptyCustomButton}><Text style={styles.addSetText}>自己填写动作</Text></Pressable>
                    </View>
                  ) : filteredExercises.map((exercise) => {
                    const added = draft?.exercises.some((entry) => entry.exerciseId === exercise.id);
                    return (
                      <View key={exercise.id} style={styles.libraryRow}>
                        <Pressable accessibilityRole="button" accessibilityLabel={`${exercise.nameZh}，${exercise.nameEn}，查看动作指导`} onPress={() => openGuide(exercise, 'library')} style={styles.libraryRowGuide}>
                          {exercise.images[0] ? <Image source={exercise.images[0]} style={styles.exerciseThumbnail} resizeMode="contain" accessibilityIgnoresInvertColors /> : <View style={styles.thumbnailFallback}><Text style={styles.thumbnailFallbackText}>🏋️</Text></View>}
                          <View style={styles.flex}>
                            <Text style={styles.libraryExerciseName}>{exercise.nameZh}</Text>
                            <Text style={styles.libraryExerciseEnglish}>{exercise.nameEn}</Text>
                            <Text style={styles.libraryEquipment}>{exercise.equipmentZh} · {exercise.equipmentEn}</Text>
                            <View style={styles.muscleTag}><Text style={styles.muscleTagText}>{exercise.muscleGroup}</Text></View>
                            {exercise.femaleFriendlyFit ? <FemaleFriendlyBadge fit={exercise.femaleFriendlyFit} /> : null}
                          </View>
                        </Pressable>
                        <Pressable accessibilityRole="button" accessibilityLabel={added ? `为${exercise.nameZh}再加一组` : `添加${exercise.nameZh}到训练`} onPress={() => addExercise(exercise)} style={[styles.libraryAdd, added && styles.libraryAddSelected]}><Text style={[styles.libraryAddGlyph, added && styles.libraryAddGlyphSelected]}>{added ? '✓+' : '+'}</Text></Pressable>
                      </View>
                    );
                  })}
                  <Text style={styles.libraryFootnote}>“＋” 添加到本次训练；已添加的动作会再增加一组。</Text>
                </ScrollView>
              </>
            ) : null}

            {route === 'guide' && guideExercise ? (
              <>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalBody}>
                  <View style={styles.guideTitleRow}><View style={styles.muscleTag}><Text style={styles.muscleTagText}>{guideExercise.muscleGroup}</Text></View><Text style={styles.guideTracking}>{guideExercise.tracking === 'reps' ? '按次数记录' : '按时长记录'}</Text></View>
                  <Text style={styles.guideTitle}>{guideExercise.nameZh}</Text>
                  <Text style={styles.guideEnglish}>{guideExercise.nameEn}</Text>
                  {guideExercise.femaleFriendlyFit ? <FemaleFriendlyFitCard fit={guideExercise.femaleFriendlyFit} exerciseId={guideExercise.id} /> : null}
                  <View style={styles.guideEquipmentCard}>
                    <Text style={styles.guideLabel}>使用器材 EQUIPMENT</Text>
                    <Text style={styles.guideEquipment}>{guideExercise.equipmentZh}</Text>
                    <Text style={styles.guideEquipmentEnglish}>{guideExercise.equipmentEn}</Text>
                    <View style={styles.guideDivider} />
                    <Text style={styles.guideMuscles}>训练与参与肌群：{guideExercise.muscles}</Text>
                  </View>
                  {guideExercise.muscleNote ? <View style={styles.cueCard}><Text style={styles.cueTitle}>肌群关系，别只看图的位置</Text><Text style={styles.cueText}>{guideExercise.muscleNote}</Text></View> : null}
                  {guideExercise.images.length > 0 ? (
                    <View style={styles.guideImages}>
                      {guideExercise.images.map((source, index) => (
                        <View key={index} style={styles.guideImageFrame}>
                          <Text style={styles.guideImageLabel}>{String(index + 1).padStart(2, '0')} · {guideExercise.imageLabels[index] || `动作示范 ${index + 1}`}</Text>
                          <Image source={source} accessibilityLabel={`${guideExercise.nameZh}：${guideExercise.imageLabels[index] || `动作示范 ${index + 1}`}`} style={styles.guideImage} resizeMode="contain" accessibilityIgnoresInvertColors />
                        </View>
                      ))}
                    </View>
                  ) : <Text style={styles.guideSafety}>本动作提供文字技术参考，暂无配图。</Text>}
                  <View style={styles.guideSection}>
                    <Text style={styles.sectionTitle}>动作怎么做</Text>
                    {guideExercise.instructions.map((instruction, index) => <View key={index} style={styles.instructionRow}><View style={styles.instructionNumber}><Text style={styles.instructionNumberText}>{index + 1}</Text></View><Text style={styles.instructionText}>{instruction}</Text></View>)}
                  </View>
                  <View style={styles.cueCard}>
                    <Text style={styles.cueTitle}>发力与姿势</Text>
                    {guideExercise.cues.map((cue, index) => <Text key={index} style={styles.cueText}>• {cue}</Text>)}
                  </View>
                  <View style={styles.mistakeCard}>
                    <Text style={styles.mistakeTitle}>留意这些错误</Text>
                    {guideExercise.mistakes.map((mistake, index) => <Text key={index} style={styles.mistakeText}>• {mistake}</Text>)}
                  </View>
                  <Text style={styles.guideSafety}>从能稳定控制的重量开始。出现疼痛、眩晕或异常不适时停止；不确定动作时请教现场教练。</Text>
                  <TechniqueReferences references={guideExercise.techniqueReferences ?? []} />
                  {guideExercise.images.length > 0 && guideExercise.sourceUrl ? <Pressable accessibilityRole="link" onPress={() => { void Linking.openURL(guideExercise.sourceUrl).catch(() => Alert.alert('无法打开来源', '请检查网络连接后重试。')); }} style={styles.sourceButton}><Text style={styles.sourceText}>查看示范图片来源 ↗</Text></Pressable> : null}
                </ScrollView>
                <View style={styles.actionFooter}>
                  <Pressable accessibilityRole="button" onPress={() => addExercise(guideExercise)} style={[styles.saveButton, styles.flex]}><Text style={styles.saveButtonText}>{draft?.exercises.some((entry) => entry.exerciseId === guideExercise.id) ? '为这个动作再加一组' : '＋ 加入本次训练'}</Text></Pressable>
                </View>
              </>
            ) : null}

            {route === 'diagram-review' ? <DiagramReview onOpenExercise={(exercise) => openGuide(exercise, 'diagram-review')} /> : null}

            {route === 'custom' ? (
              <>
                <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={styles.modalBody}>
                  <Text style={styles.customIntro}>器材库里没有？把你今天练的动作记下来。</Text>
                  <Text style={styles.fieldLabel}>动作名称 <Text style={styles.requiredLabel}>必填</Text></Text>
                  <TextInput accessibilityLabel="动作名称，必填" value={custom.nameZh} onChangeText={(nameZh) => setCustom({ ...custom, nameZh })} placeholder="例如：坐姿推胸" placeholderTextColor={colors.subtle} maxLength={60} style={styles.formInput} />
                  <Text style={styles.fieldLabel}>英文动作名 <Text style={styles.optionalLabel}>选填</Text></Text>
                  <TextInput accessibilityLabel="英文动作名，选填" value={custom.nameEn} onChangeText={(nameEn) => setCustom({ ...custom, nameEn })} placeholder="例如：Seated Chest Press" placeholderTextColor={colors.subtle} maxLength={100} style={styles.formInput} />
                  <Text style={styles.fieldLabel}>中文器材名 <Text style={styles.optionalLabel}>选填</Text></Text>
                  <TextInput accessibilityLabel="中文器材名，选填" value={custom.equipmentZh} onChangeText={(equipmentZh) => setCustom({ ...custom, equipmentZh })} placeholder="例如：推胸机" placeholderTextColor={colors.subtle} maxLength={60} style={styles.formInput} />
                  <Text style={styles.fieldLabel}>英文器材名 <Text style={styles.optionalLabel}>选填</Text></Text>
                  <TextInput accessibilityLabel="英文器材名，选填" value={custom.equipmentEn} onChangeText={(equipmentEn) => setCustom({ ...custom, equipmentEn })} placeholder="例如：Chest Press Machine" placeholderTextColor={colors.subtle} maxLength={100} style={styles.formInput} />
                  <Text style={styles.fieldLabel}>记录方式</Text>
                  <View style={styles.trackingOptions}>
                    {(['reps', 'duration'] as const).map((tracking) => <Pressable key={tracking} accessibilityRole="radio" accessibilityState={{ selected: custom.tracking === tracking }} onPress={() => setCustom({ ...custom, tracking })} style={[styles.trackingOption, custom.tracking === tracking && styles.trackingOptionSelected]}><Text style={[styles.trackingOptionText, custom.tracking === tracking && styles.filterTextSelected]}>{tracking === 'reps' ? '重量 + 次数' : '时长（秒）'}</Text></Pressable>)}
                  </View>
                  <Text style={styles.customDisclaimer}>自定义动作会随本次训练保存，暂无配图或动作指导。</Text>
                </ScrollView>
                <View style={styles.actionFooter}><Pressable accessibilityRole="button" onPress={saveCustomExercise} style={[styles.saveButton, styles.flex]}><Text style={styles.saveButtonText}>加入本次训练</Text></Pressable></View>
              </>
            ) : null}

            {route === 'detail' && selectedRecord ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalBody}>
                <Text style={styles.guideTitle}>{selectedRecord.title}</Text>
                <Text style={styles.detailDate}>{recordDate(selectedRecord)} — {getLocalDateKey(new Date(selectedRecord.startedAt)) !== getLocalDateKey(new Date(selectedRecord.finishedAt)) ? `${formatHistoryDate(new Date(selectedRecord.finishedAt))} ` : ''}{formatTime(new Date(selectedRecord.finishedAt))}</Text>
                <View style={styles.detailSummary}>
                  <View style={styles.detailStat}><Text style={styles.detailStatValue}>{selectedRecord.exercises.length}</Text><Text style={styles.detailStatLabel}>个动作</Text></View>
                  <View style={styles.statDivider} />
                  <View style={styles.detailStat}><Text style={styles.detailStatValue}>{countSets(selectedRecord)}</Text><Text style={styles.detailStatLabel}>组完成</Text></View>
                  <View style={styles.statDivider} />
                  <View style={[styles.detailStat, styles.flex]}><Text style={styles.detailDuration}>{lengthLabel(selectedRecord)}</Text><Text style={styles.detailStatLabel}>训练历时</Text></View>
                </View>
                <View style={styles.exerciseStack}>
                  {selectedRecord.exercises.map((exercise) => {
                    const catalog = EXERCISES.find((entry) => entry.id === exercise.exerciseId);
                    return (
                      <View key={exercise.id} style={styles.exerciseCard}>
                        <Text style={styles.cardTitle}>{exercise.nameZh}</Text>
                        {exercise.nameEn ? <Text style={styles.englishName}>{exercise.nameEn}</Text> : null}
                        {(exercise.equipmentZh || exercise.equipmentEn) ? <Text style={styles.equipmentLine}>{[exercise.equipmentZh, exercise.equipmentEn].filter(Boolean).join(' · ')}</Text> : null}
                        <Text style={styles.unitNote}>{weightNote(exercise)}</Text>
                        {exercise.sets.map((set, index) => <View key={set.id} style={styles.savedSetRow}><Text style={styles.savedSetLabel}>第 {index + 1} 组</Text><Text style={styles.savedSetValue}>{exercise.tracking === 'duration' ? `${set.seconds} 秒` : `${set.weightKg} kg × ${set.reps} 次`}</Text><Text style={styles.savedSetCheck}>✓</Text></View>)}
                        {catalog ? <Pressable disabled={deleting} accessibilityRole="button" accessibilityLabel={`查看${exercise.nameZh}动作指导`} onPress={() => openGuide(catalog, 'detail')} style={styles.guideLink}><Text style={styles.guideLinkText}>查看动作指导 ↗</Text></Pressable> : <Text style={styles.customGuideNote}>自定义动作 · 暂无动作指导</Text>}
                      </View>
                    );
                  })}
                </View>
                {selectedRecord.notes ? <View style={styles.notesCard}><Text style={styles.cardTitle}>训练笔记</Text><Text style={styles.savedNotes}>{selectedRecord.notes}</Text></View> : null}
                <Pressable accessibilityRole="button" disabled={deleting} onPress={() => deleteRecord(selectedRecord)} style={styles.discardButton}>{deleting ? <ActivityIndicator color={colors.danger} /> : <Text style={styles.discardText}>删除这次训练</Text>}</Pressable>
              </ScrollView>
            ) : null}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.72 },
  page: { paddingHorizontal: 20, paddingTop: 17, paddingBottom: 30 },
  pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 23 },
  eyebrow: { color: colors.primary, fontSize: 9, fontWeight: '900', letterSpacing: 1.7 },
  pageTitle: { marginTop: 8, color: colors.ink, fontSize: 31, fontWeight: '800', letterSpacing: -1 },
  weekBadge: { minWidth: 64, alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 19, paddingHorizontal: 13, paddingVertical: 9 },
  weekNumber: { color: colors.primary, fontSize: 23, fontWeight: '800' },
  weekText: { color: colors.primary, marginTop: 2, fontSize: 10, fontWeight: '600' },
  hero: { padding: 20, borderRadius: 25, backgroundColor: colors.primary },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroCopy: { flex: 1, minWidth: 0 },
  heroEyebrow: { color: '#BDCFB9', fontSize: 8, fontWeight: '700', letterSpacing: 1 },
  heroTitle: { marginTop: 11, color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  heroText: { marginTop: 10, color: '#D5E3D3', fontSize: 12, lineHeight: 20 },
  heroEmoji: { fontSize: 46 },
  heroButton: { marginTop: 22, minHeight: 49, paddingHorizontal: 17, borderRadius: 16, backgroundColor: '#EBF3DC', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroButtonText: { color: colors.primary, fontSize: 15, fontWeight: '800' },
  heroButtonArrow: { color: colors.primary, fontSize: 23 },
  libraryCard: { marginTop: 14, padding: 15, minHeight: 83, borderRadius: 21, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 13 },
  libraryIcon: { width: 47, height: 47, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: colors.primaryPale },
  libraryEmoji: { fontSize: 25 },
  cardTitle: { color: colors.ink, fontSize: 15, fontWeight: '800', lineHeight: 22 },
  smallCopy: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 4 },
  chevron: { color: colors.subtle, fontSize: 26, marginLeft: 3 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 29, marginBottom: 13 },
  sectionTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  sectionMeta: { color: colors.muted, fontSize: 11 },
  emptyCard: { paddingVertical: 33, paddingHorizontal: 25, borderRadius: 23, backgroundColor: colors.surface, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  emptyEmoji: { fontSize: 31 },
  emptyTitle: { marginTop: 13, color: colors.ink, fontSize: 16, fontWeight: '800' },
  emptyCopy: { marginTop: 8, color: colors.muted, maxWidth: 245, fontSize: 12, lineHeight: 20, textAlign: 'center' },
  stack: { gap: 10 },
  historyCard: { minHeight: 98, padding: 13, borderWidth: 1, borderColor: colors.border, borderRadius: 21, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 12 },
  historyDate: { width: 49, minHeight: 60, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: colors.primaryPale },
  historyDay: { color: colors.primary, fontSize: 23, fontWeight: '800' },
  historyMonth: { color: colors.primary, fontSize: 10, marginTop: 2 },
  historyExercises: { color: colors.muted, fontSize: 11, marginTop: 4 },
  historyMeta: { color: colors.primary, fontSize: 10, fontWeight: '600', marginTop: 8 },
  pageFooter: { color: colors.subtle, fontSize: 10, textAlign: 'center', marginTop: 26 },
  modalSafe: { flex: 1, backgroundColor: colors.background },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, minHeight: 56, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerButton: { minWidth: 66, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  headerButtonText: { fontSize: 14, color: colors.primary, fontWeight: '700' },
  disabledText: { color: colors.subtle },
  keyboardButton: { color: colors.muted, fontSize: 11 },
  modalTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  modalBody: { padding: 20, paddingBottom: 28 },
  sessionIntro: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
  sessionStatus: { color: colors.muted, fontSize: 10, flex: 1 },
  titleInput: { fontSize: 23, color: colors.ink, fontWeight: '800', paddingVertical: 14, paddingHorizontal: 0, minHeight: 58 },
  sessionHint: { fontSize: 11, lineHeight: 18, color: colors.muted, marginBottom: 18 },
  sessionEmpty: { paddingVertical: 28, paddingHorizontal: 18, alignItems: 'center' },
  exerciseStack: { gap: 16 },
  exerciseCard: { backgroundColor: colors.surface, borderRadius: 22, padding: 14, borderWidth: 1, borderColor: colors.border },
  exerciseCardHeading: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  exerciseNumber: { width: 31, height: 35, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: colors.primaryPale },
  exerciseNumberText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  englishName: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 1 },
  removeExerciseButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -7 },
  removeText: { color: colors.subtle, fontSize: 25 },
  equipmentLine: { color: colors.muted, fontSize: 10, lineHeight: 16, marginTop: 9 },
  guideLink: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  guideLinkText: { color: colors.primary, fontSize: 11, fontWeight: '700' },
  customGuideNote: { color: colors.subtle, fontSize: 10, marginTop: 12, marginBottom: 8 },
  unitNote: { color: colors.muted, fontSize: 10, lineHeight: 16, marginBottom: 10 },
  setHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingBottom: 7 },
  setHeading: { color: colors.muted, fontSize: 10, textAlign: 'center' },
  setIndex: { width: 22, textAlign: 'center' },
  setValue: { flex: 1, minWidth: 0 },
  completeColumn: { width: 44 },
  removeColumn: { width: 36 },
  setRow: { flexDirection: 'row', gap: 5, alignItems: 'center', paddingVertical: 4, borderRadius: 11, marginBottom: 3 },
  setRowComplete: { backgroundColor: colors.primaryPale },
  setNumber: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  setInput: { height: 44, borderRadius: 10, backgroundColor: colors.surfaceMuted, color: colors.ink, textAlign: 'center', fontSize: 15, fontWeight: '700', paddingHorizontal: 3, paddingVertical: 0, borderWidth: 1, borderColor: 'transparent' },
  setInputComplete: { backgroundColor: '#E4EEE1', borderColor: '#D7E5D3', color: colors.primary },
  completeButton: { width: 44, height: 44, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted },
  completeButtonSelected: { backgroundColor: colors.primary },
  completeGlyph: { color: colors.subtle, fontSize: 21, fontWeight: '600' },
  completeGlyphSelected: { color: '#FFFFFF' },
  removeSetButton: { width: 36, height: 44, alignItems: 'center', justifyContent: 'center' },
  removeSetText: { color: colors.subtle, fontSize: 22 },
  addSetButton: { marginTop: 6, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.primaryPale },
  addSetText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  addExerciseButton: { marginTop: 17, minHeight: 52, borderWidth: 1, borderStyle: 'dashed', borderColor: '#9AAF9A', borderRadius: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primaryPale },
  addExerciseText: { color: colors.primary, fontSize: 14, fontWeight: '800' },
  fieldLabel: { color: colors.ink, fontSize: 13, fontWeight: '700', marginTop: 23, marginBottom: 10 },
  optionalLabel: { color: colors.subtle, fontSize: 10, fontWeight: '400' },
  requiredLabel: { color: colors.primary, fontSize: 10 },
  notesInput: { minHeight: 97, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 13, color: colors.ink, fontSize: 13, lineHeight: 21 },
  discardButton: { minHeight: 48, marginTop: 14, justifyContent: 'center', alignItems: 'center' },
  discardText: { color: colors.danger, fontSize: 12 },
  actionFooter: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10, borderTopWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 12 },
  footerCount: { color: colors.primary, fontSize: 23, fontWeight: '800' },
  footerUnit: { color: colors.ink, fontSize: 12, fontWeight: '600' },
  footerHint: { color: colors.muted, fontSize: 10, marginTop: 3 },
  saveButton: { minHeight: 51, minWidth: 135, paddingHorizontal: 20, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  libraryToolbar: { paddingHorizontal: 20, paddingTop: 13 },
  librarySubtitle: { color: colors.muted, fontSize: 12, marginBottom: 15 },
  searchBox: { minHeight: 49, borderRadius: 15, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', paddingLeft: 13 },
  searchGlyph: { color: colors.muted, fontSize: 24, marginRight: 7 },
  searchInput: { flex: 1, minWidth: 0, color: colors.ink, fontSize: 12, paddingVertical: 13 },
  clearSearch: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  clearSearchText: { color: colors.subtle, fontSize: 23 },
  filterRow: { gap: 7, paddingVertical: 13 },
  filter: { minHeight: 44, minWidth: 55, paddingHorizontal: 13, borderRadius: 14, backgroundColor: colors.surfaceMuted, justifyContent: 'center', alignItems: 'center' },
  filterSelected: { backgroundColor: colors.primary },
  filterText: { fontSize: 12, fontWeight: '600', color: colors.muted },
  filterTextSelected: { color: '#FFFFFF' },
  libraryResultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 3 },
  customButton: { minHeight: 44, justifyContent: 'center', paddingLeft: 8 },
  customButtonText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  libraryList: { paddingHorizontal: 20, paddingBottom: 25, gap: 10 },
  fitIntro: { padding: 14, borderRadius: 18, backgroundColor: '#F1F4FA', borderWidth: 1, borderColor: '#D7DFEF' },
  fitToggle: { minHeight: 44, justifyContent: 'center' },
  fitToggleText: { color: '#354C7A', fontSize: 13, fontWeight: '700', lineHeight: 21 },
  fitExplanation: { color: colors.muted, fontSize: 11, lineHeight: 19 },
  diagramCard: { padding: 16, borderRadius: 18, backgroundColor: colors.primaryPale, marginBottom: 4 },
  libraryRow: { padding: 11, borderRadius: 19, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 7 },
  libraryRowGuide: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 11 },
  exerciseThumbnail: { width: 61, height: 73, borderRadius: 11, backgroundColor: '#FFFFFF' },
  thumbnailFallback: { width: 61, height: 73, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: colors.primaryPale },
  thumbnailFallbackText: { fontSize: 24 },
  libraryExerciseName: { color: colors.ink, fontSize: 13, fontWeight: '800', lineHeight: 19 },
  libraryExerciseEnglish: { color: colors.muted, fontSize: 10, lineHeight: 14, marginTop: 2 },
  libraryEquipment: { color: colors.muted, fontSize: 9, lineHeight: 14, marginTop: 5 },
  muscleTag: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, backgroundColor: colors.primaryPale, borderRadius: 7, marginTop: 6 },
  muscleTagText: { color: colors.primary, fontSize: 9, fontWeight: '700' },
  libraryAdd: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primaryPale, justifyContent: 'center', alignItems: 'center' },
  libraryAddSelected: { backgroundColor: colors.primary },
  libraryAddGlyph: { color: colors.primary, fontSize: 24 },
  libraryAddGlyphSelected: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  libraryFootnote: { color: colors.subtle, fontSize: 10, lineHeight: 17, marginTop: 10, textAlign: 'center' },
  emptyCustomButton: { marginTop: 15, minHeight: 44, paddingHorizontal: 18, borderRadius: 13, backgroundColor: colors.primaryPale, alignItems: 'center', justifyContent: 'center' },
  guideTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 13 },
  guideTracking: { color: colors.muted, fontSize: 10, marginTop: 6 },
  guideTitle: { color: colors.ink, fontSize: 27, lineHeight: 35, fontWeight: '800' },
  guideEnglish: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 5 },
  guideEquipmentCard: { padding: 17, backgroundColor: colors.surface, borderRadius: 19, borderWidth: 1, borderColor: colors.border, marginTop: 21 },
  guideLabel: { color: colors.subtle, fontSize: 9, fontWeight: '700', letterSpacing: 0.6 },
  guideEquipment: { color: colors.ink, fontSize: 15, fontWeight: '800', marginTop: 10 },
  guideEquipmentEnglish: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 4 },
  guideDivider: { height: 1, backgroundColor: colors.border, marginVertical: 13 },
  guideMuscles: { color: colors.primary, fontSize: 12, lineHeight: 19 },
  guideImages: { gap: 12, marginTop: 17 },
  guideImageFrame: { backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, padding: 12 },
  guideImageLabel: { color: colors.primary, fontSize: 11, fontWeight: '800', marginBottom: 7 },
  guideImage: { width: '100%', aspectRatio: 1.25, backgroundColor: '#FFFFFF' },
  guideSection: { marginTop: 26 },
  instructionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 16 },
  instructionNumber: { width: 23, height: 23, borderRadius: 8, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  instructionNumberText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  instructionText: { flex: 1, color: colors.ink, fontSize: 13, lineHeight: 23 },
  cueCard: { marginTop: 22, padding: 17, backgroundColor: colors.primaryPale, borderRadius: 20 },
  cueTitle: { color: colors.primary, fontSize: 15, fontWeight: '800', marginBottom: 7 },
  cueText: { color: colors.primary, fontSize: 12, lineHeight: 22, marginTop: 4 },
  mistakeCard: { marginTop: 13, padding: 17, backgroundColor: '#F8F0E2', borderRadius: 20 },
  mistakeTitle: { color: '#876028', fontSize: 15, fontWeight: '800', marginBottom: 7 },
  mistakeText: { color: '#806B4D', fontSize: 12, lineHeight: 22, marginTop: 4 },
  guideSafety: { color: colors.muted, fontSize: 11, lineHeight: 19, marginTop: 20 },
  sourceButton: { minHeight: 48, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  sourceText: { color: colors.primary, fontSize: 11, fontWeight: '600' },
  customIntro: { color: colors.muted, fontSize: 13, lineHeight: 22 },
  formInput: { minHeight: 49, borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.surface, paddingHorizontal: 13, paddingVertical: 12, color: colors.ink, fontSize: 13 },
  trackingOptions: { flexDirection: 'row', gap: 10 },
  trackingOption: { flex: 1, minHeight: 49, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  trackingOptionSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  trackingOptionText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  customDisclaimer: { color: colors.muted, fontSize: 11, lineHeight: 19, marginTop: 21 },
  detailDate: { color: colors.muted, fontSize: 12, lineHeight: 20, marginTop: 8 },
  detailSummary: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryPale, borderRadius: 20, paddingVertical: 20, paddingHorizontal: 14, marginTop: 21, marginBottom: 21 },
  detailStat: { minWidth: 57, alignItems: 'center', justifyContent: 'center' },
  detailStatValue: { color: colors.primary, fontSize: 26, fontWeight: '800' },
  detailStatLabel: { color: colors.muted, fontSize: 10, marginTop: 6 },
  detailDuration: { color: colors.primary, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  statDivider: { width: 1, height: 31, backgroundColor: '#D8E4D4', marginHorizontal: 10 },
  savedSetRow: { flexDirection: 'row', alignItems: 'center', minHeight: 39, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 9 },
  savedSetLabel: { color: colors.muted, fontSize: 12 },
  savedSetValue: { color: colors.ink, fontSize: 14, fontWeight: '700', flex: 1, textAlign: 'right' },
  savedSetCheck: { color: colors.primary, fontSize: 15, marginLeft: 4 },
  notesCard: { marginTop: 18, padding: 17, borderRadius: 19, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  savedNotes: { color: colors.muted, fontSize: 13, lineHeight: 22, marginTop: 9 },
});
