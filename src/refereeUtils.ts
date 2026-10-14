import { REFEREE_COURSE_VERSION, REFEREE_PASS_PERCENT, refereeLessons } from './data/refereeLessons';
import { refereeReferencePages } from './data/refereeReferences';
import type { ExamProgress, LessonProgress, QuizAttempt, RefereeLesson, RefereeState } from './refereeTypes';

export function emptyRefereeState(): RefereeState {
  return { schemaVersion: 1, courseVersion: REFEREE_COURSE_VERSION, lessons: {} };
}

export function lessonProgress(state: RefereeState, id: string): LessonProgress {
  return state.lessons[id] ?? { completedAt: null, draftAnswers: {}, attemptCount: 0, latestAttempt: null, bestAttempt: null };
}

export function examProgress(state: RefereeState, id: string): ExamProgress {
  return state.exams?.[id] ?? { draftAnswers: {}, attemptCount: 0, latestAttempt: null, bestAttempt: null };
}

export function passedQuiz(attempt: QuizAttempt | null): boolean {
  return attempt !== null && attempt.score / attempt.total * 100 >= REFEREE_PASS_PERCENT;
}

export function gradeQuiz(lesson: Pick<RefereeLesson, 'questions'>, answers: Record<string, number>, now = new Date()): QuizAttempt {
  if (Object.keys(answers).length !== lesson.questions.length || !lesson.questions.every((q) =>
    Object.hasOwn(answers, q.id) && Number.isInteger(answers[q.id]) && answers[q.id] >= 0 && answers[q.id] < q.options.length)) {
    throw new Error('请完成全部题目后再提交。');
  }
  return {
    finishedAt: now.toISOString(), answers: { ...answers }, total: lesson.questions.length,
    score: lesson.questions.filter((q) => answers[q.id] === q.correctIndex).length,
  };
}

export function filterRefereeLessons(state: RefereeState, query: string, filter: '全部' | '未完成' | '已完成' | '待巩固') {
  const normalize = (text: string) => text.toLowerCase().replace(/\s+/g, '').replace(/三秒/g, '3秒').replace(/五秒/g, '5秒').replace(/八秒/g, '8秒');
  const search = normalize(query);
  return refereeLessons.filter((lesson) => {
    const progress = lessonProgress(state, lesson.id);
    const content = [lesson.title, lesson.subtitle, lesson.articles, lesson.category, ...lesson.objectives,
      ...lesson.sections.flatMap((section) => [section.title, section.body, section.reference, ...section.additionalReferences,
        section.example.scenario, section.example.ruling, section.pitfall]),
      ...lesson.questions.flatMap((question) => [question.prompt, question.reference])].join(' ');
    // Search both the English annotations and uninterrupted Chinese phrases.
    const text = normalize(content + ' ' + content.replace(/（[^（）]*[A-Za-z][^（）]*）/g, ''));
    return (!search || text.includes(search)) && (filter === '全部' ||
      (filter === '未完成' && !progress.completedAt) ||
      (filter === '已完成' && !!progress.completedAt) ||
      (filter === '待巩固' && !!progress.completedAt && !passedQuiz(progress.bestAttempt)));
  });
}

export function referencePage(reference: string): number {
  const page = refereeReferencePages[reference];
  if (!page) throw new Error(`缺少原文页码：${reference}`);
  return page;
}
