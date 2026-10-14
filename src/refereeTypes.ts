export type RuleSection = {
  id: string;
  title: string;
  body: string;
  reference: string;
  additionalReferences: string[];
  example: { scenario: string; ruling: string };
  pitfall: string;
};

export type RuleQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  reference: string;
  studySectionId: string;
};

export type RefereeLesson = {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  category: '比赛管理' | '违例与计时' | '犯规与罚则' | '临场程序';
  minutes: number;
  articles: string;
  objectives: string[];
  sections: RuleSection[];
  checklist: string[];
  questions: RuleQuestion[];
};

export type QuizAttempt = {
  finishedAt: string;
  answers: Record<string, number>;
  score: number;
  total: number;
};

export type ScenarioQuestion = RuleQuestion & {
  lessonId: string;
  whistle: boolean;
};

export type ScenarioExam = {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  questions: ScenarioQuestion[];
};

export type ExamProgress = {
  draftAnswers: Record<string, number>;
  attemptCount: number;
  latestAttempt: QuizAttempt | null;
  bestAttempt: QuizAttempt | null;
};

export type LessonProgress = {
  completedAt: string | null;
  draftAnswers: Record<string, number>;
  attemptCount: number;
  latestAttempt: QuizAttempt | null;
  bestAttempt: QuizAttempt | null;
};

export type RefereeState = {
  schemaVersion: 1;
  courseVersion: string;
  lessons: Record<string, LessonProgress>;
  // Optional so saved progress from before the final exams stays readable.
  exams?: Record<string, ExamProgress>;
};
