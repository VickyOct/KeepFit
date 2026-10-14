import { Alert } from './src/alert';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { BottomNav } from './src/components/BottomNav';
import { CaptureModal } from './src/components/CaptureModal';
import { HistoryScreen } from './src/components/HistoryScreen';
import { HomeScreen } from './src/components/HomeScreen';
import { ReviewScreen } from './src/components/ReviewScreen';
import { RecipeScreen } from './src/components/RecipeScreen';
import { RefereeScreen } from './src/components/RefereeScreen';
import { TargetModal } from './src/components/TargetModal';
import { WorkoutScreen } from './src/components/WorkoutScreen';
import { setupDailyMealReminders } from './src/services/notifications';
import { preparePhoto } from './src/services/preparePhoto';
import { loadAppState, saveMeals, saveProteinTarget } from './src/storage';
import { colors } from './src/theme';
import type { MealRecord, ReminderStatus, ScreenName } from './src/types';
import { getLocalDateKey } from './src/utils';
import { loadWorkoutState, saveWorkoutState } from './src/workoutStorage';
import type { WorkoutDraft, WorkoutRecord, WorkoutState } from './src/workoutTypes';

function KeepFitApp() {
  const [screen, setScreen] = useState<ScreenName>('home');
  const [meals, setMeals] = useState<MealRecord[]>([]);
  const [proteinTarget, setProteinTarget] = useState(120);
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [targetOpen, setTargetOpen] = useState(false);
  const [reminderStatus, setReminderStatus] = useState<ReminderStatus>('checking');
  const [ready, setReady] = useState(false);
  const [appLoadError, setAppLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const mealWriteInProgress = useRef(false);
  const [workoutState, setWorkoutState] = useState<WorkoutState>({ records: [], draft: null });
  const workoutStateRef = useRef(workoutState);
  const workoutWriteWarningShown = useRef(false);
  const workoutMutationInProgress = useRef(false);
  const [workoutBusy, setWorkoutBusy] = useState(false);
  const [workoutsReady, setWorkoutsReady] = useState(false);
  const [workoutLoadError, setWorkoutLoadError] = useState(false);

  async function initializeWorkouts() {
    setWorkoutLoadError(false);
    try {
      const stored = await loadWorkoutState();
      workoutStateRef.current = stored;
      setWorkoutState(stored);
      setWorkoutsReady(true);
    } catch {
      setWorkoutLoadError(true);
    }
  }

  useEffect(() => {
    void initializeWorkouts();
  }, []);

  function handleWorkoutDraftChange(draft: WorkoutDraft | null) {
    if (!workoutsReady || workoutMutationInProgress.current) return;
    const next = { ...workoutStateRef.current, draft };
    workoutStateRef.current = next;
    setWorkoutState(next);
    void saveWorkoutState(next).then(() => {
      workoutWriteWarningShown.current = false;
    }).catch(() => {
      if (workoutWriteWarningShown.current) return;
      workoutWriteWarningShown.current = true;
      Alert.alert('训练草稿暂未保存', '本次输入仍保留在屏幕中。请先不要关闭 App，完成训练时可再次尝试保存。');
    });
  }

  async function handleSaveWorkout(record: WorkoutRecord) {
    if (workoutMutationInProgress.current) throw new Error('请等待当前训练记录保存完成。');
    workoutMutationInProgress.current = true;
    setWorkoutBusy(true);
    const next: WorkoutState = {
      records: [record, ...workoutStateRef.current.records.filter((item) => item.id !== record.id)],
      draft: null,
    };
    try {
      await saveWorkoutState(next);
      workoutStateRef.current = next;
      setWorkoutState(next);
    } finally {
      workoutMutationInProgress.current = false;
      setWorkoutBusy(false);
    }
  }

  async function handleDeleteWorkout(id: string) {
    if (workoutMutationInProgress.current) throw new Error('请等待当前训练记录保存完成。');
    workoutMutationInProgress.current = true;
    setWorkoutBusy(true);
    const next = { ...workoutStateRef.current, records: workoutStateRef.current.records.filter((item) => item.id !== id) };
    try {
      await saveWorkoutState(next);
      workoutStateRef.current = next;
      setWorkoutState(next);
    } finally {
      workoutMutationInProgress.current = false;
      setWorkoutBusy(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    setReady(false);
    setAppLoadError(false);
    loadAppState()
      .then((state) => {
        if (!mounted) return;
        setMeals(state.meals);
        setProteinTarget(state.proteinTarget);
      })
      .catch(() => {
        if (mounted) setAppLoadError(true);
      })
      .finally(() => {
        if (mounted) setReady(true);
      });

    return () => {
      mounted = false;
    };
  }, [loadAttempt]);

  useEffect(() => {
    let mounted = true;

    setupDailyMealReminders().then((status) => {
      if (mounted) setReminderStatus(status);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const todayMeals = useMemo(() => {
    const today = getLocalDateKey(new Date());
    return meals.filter((meal) => getLocalDateKey(new Date(meal.createdAt)) === today);
  }, [meals]);

  const todayProtein = useMemo(
    () => todayMeals.reduce((sum, meal) => sum + meal.totalProtein, 0),
    [todayMeals],
  );

  async function openImagePicker(source: 'camera' | 'library') {
    setCaptureOpen(false);

    try {
      // Let the action sheet finish closing before iOS presents its native picker.
      if (Platform.OS !== 'web') await new Promise((resolve) => setTimeout(resolve, 350));

      if (Platform.OS !== 'web' && source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('需要相机权限', '请在手机设置中允许 KeepFit 使用相机。');
          return;
        }
      } else if (Platform.OS !== 'web') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('需要照片权限', '请在手机设置中允许 Expo Go 或 KeepFit 读取照片。');
          return;
        }
      }

      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              allowsEditing: false,
              quality: 0.75,
              cameraType: ImagePicker.CameraType.back,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: false,
              quality: 0.75,
            });

      if (!result.canceled && result.assets[0]) {
        setPendingImageUri(await preparePhoto(result.assets[0].uri));
        setScreen('review');
      }
    } catch {
      Alert.alert('无法打开照片', '请稍后再试，或改用另一种添加方式。');
    }
  }

  function openManualMeal() {
    setCaptureOpen(false);
    setPendingImageUri(null);
    setScreen('review');
  }

  async function handleSaveMeal(meal: MealRecord) {
    if (mealWriteInProgress.current) return;
    mealWriteInProgress.current = true;
    const nextMeals = [meal, ...meals];

    try {
      await saveMeals(nextMeals);
      setMeals(nextMeals);
      setPendingImageUri(null);
      setScreen('home');
    } catch {
      Alert.alert('保存失败', '本次输入仍保留在屏幕中，请不要关闭页面。可释放设备存储空间后重试。');
    } finally { mealWriteInProgress.current = false; }
  }

  async function handleDeleteMeal(id: string) {
    if (mealWriteInProgress.current) return;
    mealWriteInProgress.current = true;
    const nextMeals = meals.filter((meal) => meal.id !== id);

    try {
      await saveMeals(nextMeals);
      setMeals(nextMeals);
    } catch {
      Alert.alert('删除失败', '记录尚未删除，请稍后重试。');
    } finally { mealWriteInProgress.current = false; }
  }

  async function handleSaveTarget(value: number) {
    try {
      await saveProteinTarget(value);
      setProteinTarget(value);
      setTargetOpen(false);
    } catch {
      Alert.alert('目标未保存', '重新打开应用后，目标可能恢复为之前的数值。');
    }
  }

  async function handleSetupReminders() {
    setReminderStatus('checking');
    const status = await setupDailyMealReminders();
    setReminderStatus(status);

    if (status === 'scheduled') {
      Alert.alert('提醒已开启', '每天 09:00、12:00 和 18:00 会提醒你记录饮食。');
    } else if (status === 'denied') {
      Alert.alert('需要通知权限', '请在手机的系统设置中允许 Expo Go 或 KeepFit 发送通知。');
    } else {
      Alert.alert('暂时无法设置', '请稍后重试；这不会影响饮食记录功能。');
    }
  }

  if (!ready) {
    return (
      <SafeAreaView style={styles.loading}>
        <View style={styles.loadingMark} />
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (appLoadError) return (
    <SafeAreaView style={styles.loading}>
      <Text style={styles.workoutLoadText}>无法读取本地记录，请检查浏览器是否允许存储数据。</Text>
      <Pressable style={styles.workoutRetry} onPress={() => setLoadAttempt((value) => value + 1)}>
        <Text style={styles.workoutRetryText}>重试读取</Text>
      </Pressable>
    </SafeAreaView>
  );

  const showBottomNav = screen !== 'review';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      <View style={styles.content}>
        {screen === 'home' && (
          <HomeScreen
            meals={todayMeals}
            proteinTarget={proteinTarget}
            todayProtein={todayProtein}
            onCapture={() => setCaptureOpen(true)}
            onEditTarget={() => setTargetOpen(true)}
            reminderStatus={reminderStatus}
            onSetupReminders={handleSetupReminders}
            onSeeHistory={() => setScreen('history')}
          />
        )}

        {screen === 'history' && (
          <HistoryScreen meals={meals} onDeleteMeal={handleDeleteMeal} />
        )}

        {screen === 'workout' && (workoutsReady ? (
          <WorkoutScreen
            workouts={workoutState.records}
            draft={workoutState.draft}
            busy={workoutBusy}
            onDraftChange={handleWorkoutDraftChange}
            onSave={handleSaveWorkout}
            onDelete={handleDeleteWorkout}
          />
        ) : (
          <View style={styles.workoutLoading}>
            {workoutLoadError ? (
              <>
                <Text style={styles.workoutLoadText}>暂时无法读取训练记录，请重试。</Text>
                <Pressable accessibilityRole="button" onPress={() => void initializeWorkouts()} style={styles.workoutRetry}>
                  <Text style={styles.workoutRetryText}>重新读取</Text>
                </Pressable>
              </>
            ) : <ActivityIndicator color={colors.primary} />}
          </View>
        ))}

        {screen === 'recipes' && <RecipeScreen />}

        {screen === 'referee' && <RefereeScreen />}

        {screen === 'review' && (
          <ReviewScreen
            imageUri={pendingImageUri}
            onBack={() => {
              setPendingImageUri(null);
              setScreen('home');
            }}
            onSave={handleSaveMeal}
          />
        )}
      </View>

      {showBottomNav && (
        <View pointerEvents={workoutBusy ? 'none' : 'auto'}>
        <BottomNav
          active={screen === 'referee' ? 'referee' : screen === 'recipes' ? 'recipes' : screen === 'workout' ? 'workout' : screen === 'history' ? 'history' : 'home'}
          onHome={() => setScreen('home')}
          onCapture={() => setCaptureOpen(true)}
          onHistory={() => setScreen('history')}
          onWorkout={() => setScreen('workout')}
          onRecipes={() => setScreen('recipes')}
          onReferee={() => setScreen('referee')}
        />
        </View>
      )}

      <CaptureModal
        visible={captureOpen}
        onClose={() => setCaptureOpen(false)}
        onCamera={() => openImagePicker('camera')}
        onLibrary={() => openImagePicker('library')}
        onManual={openManualMeal}
      />

      <TargetModal
        initialValue={proteinTarget}
        visible={targetOpen}
        onClose={() => setTargetOpen(false)}
        onSave={handleSaveTarget}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <KeepFitApp />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  workoutLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  workoutLoadText: { color: colors.muted, fontSize: 14 },
  workoutRetry: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, backgroundColor: colors.primary },
  workoutRetryText: { color: colors.surface, fontWeight: '700' },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    backgroundColor: colors.background,
  },
  loadingMark: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: colors.primary,
    transform: [{ rotate: '12deg' }],
  },
});
