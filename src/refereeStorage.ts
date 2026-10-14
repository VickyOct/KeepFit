import Storage from './kvStore';

import { REFEREE_COURSE_VERSION, refereeLessons } from './data/refereeLessons';
import { refereeScenarioExams } from './data/refereeScenarioExams';
import { emptyRefereeState, examProgress, gradeQuiz, lessonProgress } from './refereeUtils';
import type { ExamProgress, LessonProgress, QuizAttempt, RefereeLesson, RefereeState, ScenarioExam } from './refereeTypes';

const KEY = 'keepfit.referee-learning.v1';
let pending: Promise<unknown> = Promise.resolve();
const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const validDate = (value: unknown): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value));

function validAnswers(value: unknown, lesson: Pick<RefereeLesson, 'questions'>): value is Record<string, number> {
  return object(value) && Object.entries(value).every(([id, answer]) => {
    const q = lesson.questions.find((item) => item.id === id);
    return q !== undefined && typeof answer === 'number' && Number.isInteger(answer) && answer >= 0 && answer < q.options.length;
  });
}

function validAttempt(value: unknown, lesson: Pick<RefereeLesson, 'questions'>): value is QuizAttempt {
  if (!object(value) || !validDate(value.finishedAt) || !validAnswers(value.answers, lesson)) return false;
  try {
    const grade = gradeQuiz(lesson, value.answers);
    return value.score === grade.score && value.total === grade.total;
  } catch { return false; }
}

export function parseRefereeState(json: string | null): RefereeState {
  if (json === null) return emptyRefereeState();
  const value: unknown = JSON.parse(json);
  if (!object(value) || value.schemaVersion !== 1 || value.courseVersion !== REFEREE_COURSE_VERSION || !object(value.lessons)) {
    throw new Error('学习进度格式无法读取。');
  }
  for (const [id, progress] of Object.entries(value.lessons)) {
    const lesson = refereeLessons.find((item) => item.id === id);
    if (!lesson || !object(progress) || !(progress.completedAt === null || validDate(progress.completedAt)) ||
      !validAnswers(progress.draftAnswers, lesson) || typeof progress.attemptCount !== 'number' ||
      !Number.isInteger(progress.attemptCount) || progress.attemptCount < 0 ||
      !(progress.latestAttempt === null || validAttempt(progress.latestAttempt, lesson)) ||
      !(progress.bestAttempt === null || validAttempt(progress.bestAttempt, lesson))) throw new Error('学习进度格式无法读取。');
    const latest = progress.latestAttempt as QuizAttempt | null;
    const best = progress.bestAttempt as QuizAttempt | null;
    if ((progress.attemptCount === 0) !== (latest === null && best === null) || (latest === null) !== (best === null) ||
      (latest !== null && (!progress.completedAt || best!.score < latest.score)) ||
      (!progress.completedAt && Object.keys(progress.draftAnswers).length > 0)) throw new Error('学习进度不一致。');
  }
  if (value.exams !== undefined) {
    if (!object(value.exams)) throw new Error('综合测验进度格式无法读取。');
    for (const [id, progress] of Object.entries(value.exams)) {
      const exam = refereeScenarioExams.find((item) => item.id === id);
      if (!exam || !object(progress) || !validAnswers(progress.draftAnswers, exam) ||
        typeof progress.attemptCount !== 'number' || !Number.isInteger(progress.attemptCount) || progress.attemptCount < 0 ||
        !(progress.latestAttempt === null || validAttempt(progress.latestAttempt, exam)) ||
        !(progress.bestAttempt === null || validAttempt(progress.bestAttempt, exam))) throw new Error('综合测验进度格式无法读取。');
      const latest = progress.latestAttempt as QuizAttempt | null;
      const best = progress.bestAttempt as QuizAttempt | null;
      if ((progress.attemptCount === 0) !== (latest === null && best === null) || (latest === null) !== (best === null) ||
        (latest !== null && best!.score < latest.score)) throw new Error('综合测验进度不一致。');
    }
  }
  return value as RefereeState;
}

async function read(): Promise<RefereeState> {
  return parseRefereeState(await Storage.getItem(KEY));
}

export async function loadRefereeState(): Promise<RefereeState> {
  await pending.catch(() => undefined);
  return read();
}

// Every mutation reads the latest durable snapshot inside the same queue. This
// prevents a slow answer save or a remounted screen from replacing a completion.
function updateState(change: (state: RefereeState) => RefereeState): Promise<RefereeState> {
  const operation = pending.catch(() => undefined).then(async () => {
    const state = await read();
    const next = change(state);
    await Storage.setItem(KEY, JSON.stringify(next));
    return next;
  });
  pending = operation;
  return operation;
}

function update(id: string, change: (progress: LessonProgress, lesson: RefereeLesson) => LessonProgress): Promise<RefereeState> {
  return updateState((state) => {
    const lesson = refereeLessons.find((item) => item.id === id);
    if (!lesson) throw new Error('课程不存在。');
    return { ...state, lessons: { ...state.lessons, [id]: change(lessonProgress(state, id), lesson) } };
  });
}

function updateExam(id: string, change: (progress: ExamProgress, exam: ScenarioExam) => ExamProgress): Promise<RefereeState> {
  return updateState((state) => {
    const exam = refereeScenarioExams.find((item) => item.id === id);
    if (!exam) throw new Error('综合测验不存在。');
    return { ...state, exams: { ...state.exams, [id]: change(examProgress(state, id), exam) } };
  });
}

export function completeRefereeLesson(id: string): Promise<RefereeState> {
  return update(id, (progress) => ({ ...progress, completedAt: progress.completedAt ?? new Date().toISOString() }));
}

export function saveRefereeAnswer(id: string, questionId: string, answer: number): Promise<RefereeState> {
  return update(id, (progress, lesson) => {
    if (!progress.completedAt) throw new Error('请先完成课程阅读，再开始测验。');
    if (!validAnswers({ [questionId]: answer }, lesson)) throw new Error('答案格式无效。');
    return { ...progress, draftAnswers: { ...progress.draftAnswers, [questionId]: answer } };
  });
}

export function submitRefereeQuiz(id: string): Promise<RefereeState> {
  return update(id, (progress, lesson) => {
    if (!progress.completedAt) throw new Error('请先完成课程阅读，再开始测验。');
    const attempt = gradeQuiz(lesson, progress.draftAnswers);
    return {
      ...progress, draftAnswers: {}, attemptCount: progress.attemptCount + 1, latestAttempt: attempt,
      bestAttempt: !progress.bestAttempt || attempt.score >= progress.bestAttempt.score ? attempt : progress.bestAttempt,
    };
  });
}

export function saveScenarioAnswer(id: string, questionId: string, answer: number): Promise<RefereeState> {
  return updateExam(id, (progress, exam) => {
    if (!validAnswers({ [questionId]: answer }, exam)) throw new Error('答案格式无效。');
    return { ...progress, draftAnswers: { ...progress.draftAnswers, [questionId]: answer } };
  });
}

export function submitScenarioExam(id: string): Promise<RefereeState> {
  return updateExam(id, (progress, exam) => {
    const attempt = gradeQuiz(exam, progress.draftAnswers);
    return {
      ...progress, draftAnswers: {}, attemptCount: progress.attemptCount + 1, latestAttempt: attempt,
      bestAttempt: !progress.bestAttempt || attempt.score >= progress.bestAttempt.score ? attempt : progress.bestAttempt,
    };
  });
}
