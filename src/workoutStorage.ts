import Storage from './kvStore';

import type { WorkoutState } from './workoutTypes';

const WORKOUTS_KEY = 'keepfit.workouts.v1';
let pendingWrite: Promise<void> = Promise.resolve();

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function hasStrings(value: Record<string, unknown>, keys: string[]) {
  return keys.every((key) => typeof value[key] === 'string');
}

function validDate(value: unknown) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

function validExercises(value: unknown, draft: boolean) {
  return Array.isArray(value) && value.every((exercise: unknown) => {
    if (!isObject(exercise) || !hasStrings(exercise, ['id', 'exerciseId', 'nameZh', 'nameEn', 'equipmentZh', 'equipmentEn']) ||
        (exercise.tracking !== 'reps' && exercise.tracking !== 'duration') || !Array.isArray(exercise.sets)) return false;
    return exercise.sets.every((set: unknown) => {
      if (!isObject(set) || typeof set.id !== 'string' || typeof set.completed !== 'boolean') return false;
      if (draft) return hasStrings(set, ['weight', 'reps', 'seconds']);
      if (!['weightKg', 'reps', 'seconds'].every((key) => typeof set[key] === 'number' && Number.isFinite(set[key]) && (set[key] as number) >= 0)) return false;
      return exercise.tracking === 'reps'
        ? Number.isInteger(set.reps) && (set.reps as number) > 0 && (set.reps as number) <= 1000 && (set.weightKg as number) <= 1500
        : Number.isInteger(set.seconds) && (set.seconds as number) > 0 && (set.seconds as number) <= 86400;
    });
  });
}

export function parseWorkoutState(json: string | null): WorkoutState {
  if (json === null) return { records: [], draft: null };
  const value: unknown = JSON.parse(json);
  if (!isObject(value) || !Array.isArray(value.records)) throw new Error('训练记录格式无法读取');
  const validRecords = value.records.every((record: unknown) => isObject(record) &&
    hasStrings(record, ['id', 'title', 'notes']) && validDate(record.startedAt) && validDate(record.finishedAt) &&
    validExercises(record.exercises, false));
  const draft = value.draft;
  const validDraft = draft === null || (isObject(draft) && hasStrings(draft, ['id', 'title', 'notes']) &&
    validDate(draft.startedAt) && validExercises(draft.exercises, true));
  if (!validRecords || !validDraft) throw new Error('训练记录格式无法读取');
  return value as WorkoutState;
}

export async function loadWorkoutState(): Promise<WorkoutState> {
  await pendingWrite.catch(() => undefined);
  return parseWorkoutState(await Storage.getItem(WORKOUTS_KEY));
}

export function saveWorkoutState(state: WorkoutState): Promise<void> {
  // Snapshot now; serialize writes so a slower draft cannot replace a finished session.
  const json = JSON.stringify(state);
  const write = pendingWrite.catch(() => undefined).then(() => Storage.setItem(WORKOUTS_KEY, json));
  pendingWrite = write;
  return write;
}
