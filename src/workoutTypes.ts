import type { ImageSourcePropType } from 'react-native';

export type MuscleGroup = '胸部' | '背部' | '腿臀' | '肩部' | '手臂' | '核心' | '有氧';
export type TechniqueReference = {
  title: string;
  publisher: string;
  url: string;
  kind: '动作资料' | '技术教学' | '解剖说明' | '研究';
  note?: string;
};
export type Exercise = {
  id: string;
  nameZh: string;
  nameEn: string;
  equipmentZh: string;
  equipmentEn: string;
  muscleGroup: MuscleGroup;
  muscles: string;
  tracking: 'reps' | 'duration';
  instructions: string[];
  cues: string[];
  mistakes: string[];
  images: ImageSourcePropType[];
  imageLabels: string[];
  sourceUrl: string;
  aliases?: string[];
  muscleNote?: string;
  techniqueReferences?: TechniqueReference[];
  femaleFriendlyFit?: {
    basis: '可自选轨迹' | '可调站位' | '需匹配器械';
    reason: string;
    check: string;
  };
};

export type WorkoutSet = {
  id: string;
  weightKg: number;
  reps: number;
  seconds: number;
  completed: boolean;
};
export type WorkoutExercise = Pick<Exercise, 'nameZh' | 'nameEn' | 'equipmentZh' | 'equipmentEn' | 'tracking'> & {
  id: string;
  exerciseId: string;
  sets: WorkoutSet[];
};
export type WorkoutRecord = {
  id: string;
  startedAt: string;
  finishedAt: string;
  title: string;
  notes: string;
  exercises: WorkoutExercise[];
};

export type WorkoutDraftSet = {
  id: string;
  weight: string;
  reps: string;
  seconds: string;
  completed: boolean;
};
export type WorkoutDraftExercise = Omit<WorkoutExercise, 'sets'> & { sets: WorkoutDraftSet[] };
export type WorkoutDraft = {
  id: string;
  startedAt: string;
  title: string;
  notes: string;
  exercises: WorkoutDraftExercise[];
};
export type WorkoutState = { records: WorkoutRecord[]; draft: WorkoutDraft | null };
