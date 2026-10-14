import type { WorkoutDraft, WorkoutRecord, WorkoutSet } from './workoutTypes';

function readNumber(value: string, label: string, max: number, integer = false) {
  const normalized = value.trim().replace(',', '.');
  const result = Number(normalized);
  if (!/^\d+(?:\.\d+)?$/.test(normalized) || !Number.isFinite(result) || result > max || (integer && (!Number.isInteger(result) || result < 1))) {
    throw new Error(`${label}请填写${integer ? `1–${max} 的整数` : `0–${max} 的数字（自重填 0）`}。`);
  }
  return result;
}

/** Only explicitly completed sets belong to a saved workout. */
export function buildWorkoutRecord(draft: WorkoutDraft, now = new Date()): WorkoutRecord {
  const exercises = draft.exercises.flatMap((exercise) => {
    const completed = exercise.sets.filter((set) => set.completed);
    if (!completed.length) return [];
    const sets: WorkoutSet[] = completed.map((set, index) => {
      const label = `${exercise.nameZh}第 ${index + 1} 个完成组`;
      return {
        id: set.id,
        completed: true,
        weightKg: exercise.tracking === 'reps' ? readNumber(set.weight, `${label}重量`, 1500) : 0,
        reps: exercise.tracking === 'reps' ? readNumber(set.reps, `${label}次数`, 1000, true) : 0,
        seconds: exercise.tracking === 'duration' ? readNumber(set.seconds, `${label}时长（秒）`, 86400, true) : 0,
      };
    });
    return [{ ...exercise, sets }];
  });
  if (!exercises.length) throw new Error('请填写至少一组训练数据，并勾选为完成。');
  return {
    id: draft.id,
    startedAt: draft.startedAt,
    finishedAt: now.toISOString(),
    title: draft.title.trim() || '我的训练',
    notes: draft.notes.trim(),
    exercises,
  };
}
