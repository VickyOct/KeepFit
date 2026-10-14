const assert = require('node:assert/strict');
const test = require('node:test');
const { createLoader } = require('./load-workout-ui.cjs');

function fixture(storage = {}) {
  let json = null;
  const { load } = createLoader({ 'expo-sqlite/kv-store': {
    async getItem() { return json; }, async setItem(key, value) { assert.equal(key, 'keepfit.referee-learning.v1'); json = value; }, ...storage,
  } });
  return { load, ...load('src/refereeStorage.ts'), ...load('src/refereeUtils.ts'), ...load('src/data/refereeScenarioExams.ts'),
    ...load('src/data/refereeLessons.ts'), stored: () => json };
}

test('five exams contain fifty original integrated decisions with both call and no-call situations', () => {
  const f = fixture(); const ids = new Set(); const positions = [0, 0, 0, 0];
  const chapterPrompts = new Set(f.refereeLessons.flatMap((lesson) => lesson.questions.map((q) => q.prompt)));
  assert.equal(f.refereeScenarioExams.length, 5);
  for (const [index, exam] of f.refereeScenarioExams.entries()) {
    assert.equal(exam.order, index + 1);
    assert.equal(exam.questions.length, 10);
    assert.ok(exam.questions.filter((q) => !q.whistle).length >= 2);
    assert.ok(exam.questions.filter((q) => q.whistle).length >= 2);
    assert.ok(new Set(exam.questions.map((q) => q.lessonId)).size >= 5);
    for (const q of exam.questions) {
      assert.ok(!ids.has(q.id)); ids.add(q.id);
      assert.ok(!chapterPrompts.has(q.prompt));
      assert.equal(q.options.length, 4); assert.equal(new Set(q.options).size, 4);
      assert.match(q.options[q.correctIndex], q.whistle ? /^吹/ : /^不/);
      positions[q.correctIndex]++;
      const lesson = f.refereeLessons.find((item) => item.id === q.lessonId);
      const section = lesson.sections.find((item) => item.id === q.studySectionId);
      assert.ok([section.reference, ...section.additionalReferences].includes(q.reference), q.id);
      assert.ok(f.referencePage(q.reference));
    }
  }
  assert.equal(ids.size, 50);
  assert.ok(positions.every((count) => count >= 12 && count <= 13));
});

test('old lesson-only state stays readable; exams resume independently and preserve best results and courses', async () => {
  const f = fixture(); const [exam, other] = f.refereeScenarioExams;
  let state = await f.completeRefereeLesson('pregame');
  assert.equal(state.exams, undefined);
  assert.deepEqual(f.parseRefereeState(f.stored()), state);
  const originalLessons = JSON.parse(JSON.stringify(state.lessons));
  await f.saveScenarioAnswer(exam.id, exam.questions[0].id, exam.questions[0].correctIndex);
  await f.saveScenarioAnswer(other.id, other.questions[0].id, 0);
  state = await f.loadRefereeState();
  assert.equal(f.examProgress(state, exam.id).draftAnswers[exam.questions[0].id], exam.questions[0].correctIndex);
  assert.equal(f.examProgress(state, other.id).draftAnswers[other.questions[0].id], 0);
  await assert.rejects(f.submitScenarioExam(exam.id), /全部题目/);
  await assert.rejects(f.saveScenarioAnswer(exam.id, other.questions[0].id, 0), /答案格式/);
  await assert.rejects(f.saveScenarioAnswer(exam.id, exam.questions[0].id, 4), /答案格式/);
  for (const q of exam.questions.slice(1)) await f.saveScenarioAnswer(exam.id, q.id, q.correctIndex);
  state = await f.submitScenarioExam(exam.id);
  assert.equal(state.exams[exam.id].latestAttempt.score, 10);
  assert.deepEqual(state.exams[exam.id].draftAnswers, {});
  for (const q of exam.questions) await f.saveScenarioAnswer(exam.id, q.id, (q.correctIndex + 1) % 4);
  state = await f.submitScenarioExam(exam.id);
  assert.equal(state.exams[exam.id].latestAttempt.score, 0);
  assert.equal(state.exams[exam.id].bestAttempt.score, 10);
  assert.equal(state.exams[exam.id].attemptCount, 2);
  assert.deepEqual(state.lessons, originalLessons);
  assert.deepEqual(f.parseRefereeState(f.stored()), state);
  await assert.rejects(f.saveScenarioAnswer('missing', exam.questions[0].id, 0), /不存在/);
});

test('queued exam and course writes share a snapshot and retry after a failure', async () => {
  let stored = null; let release; let calls = 0;
  const f = fixture({ async getItem() { return stored; }, async setItem(key, value) {
    calls++;
    if (calls === 1) await new Promise((resolve) => { release = resolve; });
    if (calls === 3) throw new Error('disk full');
    stored = value;
  } });
  const exam = f.refereeScenarioExams[0], q = exam.questions[0];
  const answer = f.saveScenarioAnswer(exam.id, q.id, q.correctIndex);
  const completed = f.completeRefereeLesson('pregame');
  await new Promise((resolve) => setImmediate(resolve)); release(); await answer; await completed;
  const before = await f.loadRefereeState();
  assert.ok(before.lessons.pregame.completedAt);
  assert.equal(before.exams[exam.id].draftAnswers[q.id], q.correctIndex);
  await assert.rejects(f.saveScenarioAnswer(exam.id, q.id, 0), /disk full/);
  assert.deepEqual(await f.loadRefereeState(), before);
  await f.saveScenarioAnswer(exam.id, q.id, 0);
  assert.equal((await f.loadRefereeState()).exams[exam.id].draftAnswers[q.id], 0);
});

test('invalid exam scores, unknown questions and inconsistent history are rejected without overwriting data', async () => {
  const f = fixture(); const exam = f.refereeScenarioExams[0];
  for (const q of exam.questions) await f.saveScenarioAnswer(exam.id, q.id, q.correctIndex);
  const state = await f.submitScenarioExam(exam.id);
  const invalid = [
    (value) => { value.exams[exam.id].latestAttempt.score = 100; },
    (value) => { value.exams[exam.id].draftAnswers.unknown = 0; },
    (value) => { value.exams[exam.id].attemptCount = 0; },
    (value) => { value.exams[exam.id].bestAttempt = null; },
    (value) => { value.exams.missing = value.exams[exam.id]; },
    (value) => { value.exams = null; },
  ];
  for (const change of invalid) { const copy = JSON.parse(JSON.stringify(state)); change(copy); assert.throws(() => f.parseRefereeState(JSON.stringify(copy))); }
  let writes = 0;
  const broken = fixture({ async getItem() { return '{'; }, async setItem() { writes++; } });
  await assert.rejects(broken.saveScenarioAnswer(exam.id, exam.questions[0].id, 0));
  assert.equal(writes, 0);
});
