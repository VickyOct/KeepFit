const assert = require('node:assert/strict');
const test = require('node:test');
const { createLoader } = require('./load-workout-ui.cjs');

function fixture(storage = {}) {
  let json = null;
  const memory = {
    async getItem(key) { assert.equal(key, 'keepfit.referee-learning.v1'); return json; },
    async setItem(key, value) { assert.equal(key, 'keepfit.referee-learning.v1'); json = value; },
    ...storage,
  };
  const { load } = createLoader({ 'expo-sqlite/kv-store': memory });
  return {
    ...load('src/data/refereeLessons.ts'), ...load('src/refereeUtils.ts'),
    ...load('src/refereeStorage.ts'), pages: load('src/data/refereeReferences.ts').refereeReferencePages,
    stored: () => json,
  };
}

test('16 complete lessons contain 160 distinct questions and real source locators', () => {
  const f = fixture();
  assert.equal(f.refereeLessons.length, 16);
  const ids = new Set();
  const positions = [0, 0, 0, 0];
  for (const [index, lesson] of f.refereeLessons.entries()) {
    assert.equal(lesson.order, index + 1);
    assert.equal(lesson.questions.length, 10);
    assert.ok(lesson.sections.length >= 4);
    assert.ok(lesson.objectives.length >= 3);
    for (const item of [...lesson.sections, ...lesson.questions]) {
      assert.ok(Number.isInteger(f.pages[item.reference]) && f.pages[item.reference] >= 7 && f.pages[item.reference] <= 161, item.reference);
    }
    for (const q of lesson.questions) {
      assert.ok(!ids.has(q.id)); ids.add(q.id);
      assert.equal(q.options.length, 4);
      assert.equal(new Set(q.options).size, 4);
      assert.ok(q.correctIndex >= 0 && q.correctIndex < 4);
      assert.ok(q.prompt && q.explanation);
      positions[q.correctIndex]++;
    }
  }
  assert.equal(ids.size, 160);
  assert.deepEqual(positions, [40, 40, 40, 40]);
});

test('2026-specific classifications, correction numbers and one HCC remain explicit', () => {
  const f = fixture();
  const answer = (lessonId, reference) => {
    const q = f.refereeLessons.find((l) => l.id === lessonId).questions.find((q) => q.reference === reference);
    return q.options[q.correctIndex];
  };
  assert.equal(answer('technical', '36-2'), '第 2 类');
  assert.equal(answer('serious-fouls', '37-2'), '破坏性犯规（disruptive foul）');
  assert.equal(answer('serious-fouls', '38-3'), '严重犯规（flagrant foul）');
  assert.equal(answer('serious-fouls', '37-1'), '不计入');
  assert.match(answer('serious-fouls', '37-8'), /末段止表/);
  assert.match(answer('replay', 'F-4.15'), /全场一次/);
  assert.match(f.refereeLessons.find((l) => l.id === 'corrections').articles, /45/);
  assert.equal(f.pages['37-1'], 101);
  assert.equal(f.pages['38-1'], 104);
});

test('every quiz has substantive in-lesson teaching, a worked case and matching source references', () => {
  const f = fixture();
  for (const lesson of f.refereeLessons) {
    const sectionIds = new Set(lesson.sections.map((section) => section.id));
    assert.equal(sectionIds.size, lesson.sections.length, lesson.id);
    assert.ok(lesson.sections.length >= 6, lesson.id);
    for (const section of lesson.sections) {
      assert.ok(section.body.length >= 130, `${lesson.id}/${section.id}: insufficient explanation`);
      assert.ok(section.example.scenario.length >= 20, `${lesson.id}/${section.id}: missing case`);
      assert.ok(section.example.ruling.length >= 25, `${lesson.id}/${section.id}: missing reasoning`);
      assert.ok(section.pitfall.length >= 15, `${lesson.id}/${section.id}: missing misconception`);
      for (const reference of [section.reference, ...section.additionalReferences]) assert.ok(f.pages[reference], reference);
    }
    for (const q of lesson.questions) {
      const section = lesson.sections.find((item) => item.id === q.studySectionId);
      assert.ok(section, `${q.id}: no teaching destination`);
      assert.ok([section.reference, ...section.additionalReferences].includes(q.reference), q.id);
      assert.notEqual(section.body, q.explanation, `${q.id}: answer feedback is not a lesson`);
    }
  }
});

test('previously missing timing, exception and classification concepts are taught before the quiz', () => {
  const f = fixture();
  const teaching = (lessonId, questionNumber) => {
    const lesson = f.refereeLessons.find((item) => item.id === lessonId);
    const section = lesson.sections.find((item) => item.id === lesson.questions[questionNumber - 1].studySectionId);
    return `${section.body} ${section.example.ruling}`;
  };
  assert.match(teaching('pregame', 8), /计时运行/);
  assert.match(teaching('timeout', 6), /第一罚.*交.*之后|第一罚已交/);
  assert.match(teaching('time-violations', 5), /漏球.*五秒/);
  assert.match(teaching('shot-clock', 3), /立即.*清楚/);
  assert.match(teaching('shot-clock', 4), /八秒.*八秒/);
  assert.match(teaching('shot-clock', 10), /18 秒.*14/);
  assert.match(teaching('backcourt-basket', 4), /尚未落地.*传给后场/);
  assert.match(teaching('technical', 3), /两个第 2 类不能/);
  assert.match(teaching('serious-fouls', 4), /独立标准/);
  assert.match(teaching('corrections', 5), /2:13.*1:49/);
  assert.match(teaching('corrections', 8), /正确球员.*替代罚球/);
  assert.match(teaching('replay', 9), /成功.*不会返还/);
});

test('grading distinguishes unanswered, invalid, passing and failing answers', () => {
  const f = fixture(); const lesson = f.refereeLessons[0];
  const answers = Object.fromEntries(lesson.questions.map((q) => [q.id, q.correctIndex]));
  assert.equal(f.gradeQuiz(lesson, answers).score, 10);
  assert.throws(() => f.gradeQuiz(lesson, {}), /全部题目/);
  assert.throws(() => f.gradeQuiz(lesson, { ...answers, [lesson.questions[0].id]: NaN }));
  assert.throws(() => f.gradeQuiz(lesson, { ...answers, unrelated: 0 }));
  for (const q of lesson.questions.slice(0, 2)) answers[q.id] = (q.correctIndex + 1) % 4;
  assert.equal(f.passedQuiz(f.gradeQuiz(lesson, answers)), true);
  answers[lesson.questions[2].id] = (lesson.questions[2].correctIndex + 1) % 4;
  assert.equal(f.passedQuiz(f.gradeQuiz(lesson, answers)), false);
  assert.equal(f.passedQuiz(null), false);
});

test('complete first; answer drafts survive reload and submission preserves the best attempt', async () => {
  const f = fixture(); const lesson = f.refereeLessons[0];
  const q = lesson.questions[0];
  await assert.rejects(f.saveRefereeAnswer(lesson.id, q.id, q.correctIndex), /先完成/);
  await assert.rejects(f.submitRefereeQuiz(lesson.id), /先完成/);
  let state = await f.completeRefereeLesson(lesson.id);
  const completedAt = state.lessons[lesson.id].completedAt;
  state = await f.completeRefereeLesson(lesson.id);
  assert.equal(state.lessons[lesson.id].completedAt, completedAt);
  await f.saveRefereeAnswer(lesson.id, q.id, q.correctIndex);
  assert.equal((await f.loadRefereeState()).lessons[lesson.id].draftAnswers[q.id], q.correctIndex);
  await assert.rejects(f.submitRefereeQuiz(lesson.id), /全部题目/);
  for (const question of lesson.questions.slice(1)) await f.saveRefereeAnswer(lesson.id, question.id, question.correctIndex);
  state = await f.submitRefereeQuiz(lesson.id);
  assert.equal(state.lessons[lesson.id].latestAttempt.score, 10);
  assert.deepEqual(state.lessons[lesson.id].draftAnswers, {});
  for (const question of lesson.questions) await f.saveRefereeAnswer(lesson.id, question.id, (question.correctIndex + 1) % 4);
  state = await f.submitRefereeQuiz(lesson.id);
  assert.equal(state.lessons[lesson.id].latestAttempt.score, 0);
  assert.equal(state.lessons[lesson.id].bestAttempt.score, 10);
  assert.equal(state.lessons[lesson.id].attemptCount, 2);
  assert.deepEqual(f.parseRefereeState(f.stored()), state);
  assert.equal(state.lessons[lesson.id].completedAt, completedAt);
});

test('queued completion and answers cannot overwrite one another; failure permits retry', async () => {
  let stored = null; let release; let calls = 0;
  const f = fixture({
    async getItem() { return stored; },
    async setItem(key, json) {
      calls++;
      if (calls === 1) await new Promise((resolve) => { release = resolve; });
      if (calls === 3) throw new Error('disk full');
      stored = json;
    },
  });
  const lesson = f.refereeLessons[0], q = lesson.questions[0];
  const completion = f.completeRefereeLesson(lesson.id);
  const answer = f.saveRefereeAnswer(lesson.id, q.id, q.correctIndex);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls, 1);
  release(); await completion; await answer;
  const before = await f.loadRefereeState();
  assert.ok(before.lessons[lesson.id].completedAt);
  assert.equal(before.lessons[lesson.id].draftAnswers[q.id], q.correctIndex);
  await assert.rejects(f.saveRefereeAnswer(lesson.id, q.id, (q.correctIndex + 1) % 4), /disk full/);
  assert.deepEqual(await f.loadRefereeState(), before);
  await f.saveRefereeAnswer(lesson.id, q.id, (q.correctIndex + 1) % 4);
  assert.equal((await f.loadRefereeState()).lessons[lesson.id].draftAnswers[q.id], (q.correctIndex + 1) % 4);
});

test('unreadable state is never overwritten; corrupt scores and course versions are rejected', async () => {
  let writes = 0;
  const broken = fixture({ async getItem() { return '{'; }, async setItem() { writes++; } });
  await assert.rejects(broken.loadRefereeState());
  await assert.rejects(broken.completeRefereeLesson('pregame'));
  assert.equal(writes, 0);
  const f = fixture(); const lesson = f.refereeLessons[0];
  await f.completeRefereeLesson(lesson.id);
  for (const q of lesson.questions) await f.saveRefereeAnswer(lesson.id, q.id, q.correctIndex);
  const state = await f.submitRefereeQuiz(lesson.id);
  const corrupted = JSON.parse(JSON.stringify(state));
  corrupted.lessons[lesson.id].latestAttempt.score = 100;
  assert.throws(() => f.parseRefereeState(JSON.stringify(corrupted)));
  state.courseVersion = 'older-course';
  assert.throws(() => f.parseRefereeState(JSON.stringify(state)));
  await assert.rejects(f.completeRefereeLesson('missing'), /不存在/);
});

test('search and progress filters separate reading completion from passing a quiz', async () => {
  const f = fixture();
  let state = await f.completeRefereeLesson('technical');
  assert.equal(f.filterRefereeLessons(state, '第 36', '全部').length, 1);
  assert.equal(f.filterRefereeLessons(state, '第36', '全部').length, 1);
  assert.equal(f.filterRefereeLessons(state, '8 秒', '全部')[0].id, 'time-violations');
  assert.equal(f.filterRefereeLessons(state, '37-8', '全部')[0].id, 'serious-fouls');
  assert.ok(f.filterRefereeLessons(state, 'SHOT CLOCK', '全部').some((l) => l.id === 'shot-clock'));
  assert.ok(f.filterRefereeLessons(state, 'travelling', '全部').some((l) => l.id === 'movement'));
  assert.ok(f.filterRefereeLessons(state, '前场掷球', '全部').some((l) => l.id === 'shot-clock'));
  assert.equal(f.filterRefereeLessons(state, '', '已完成').length, 1);
  assert.equal(f.filterRefereeLessons(state, '', '未完成').length, 15);
  assert.equal(f.filterRefereeLessons(state, '', '待巩固').length, 1);
  const lesson = f.refereeLessons.find((l) => l.id === 'technical');
  for (const q of lesson.questions) await f.saveRefereeAnswer(lesson.id, q.id, q.correctIndex);
  state = await f.submitRefereeQuiz(lesson.id);
  assert.equal(f.filterRefereeLessons(state, '', '待巩固').length, 0);
  assert.equal(f.filterRefereeLessons(state, '不可能关键词', '全部').length, 0);
});
