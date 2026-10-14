const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function loadSource(file, dependencies = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', file), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled)((id) => {
    if (id in dependencies) return dependencies[id];
    throw new Error(`Unexpected dependency: ${id}`);
  }, module, module.exports);
  return module.exports;
}

const { buildWorkoutRecord } = loadSource('workoutUtils.ts');
const { parseWorkoutState } = loadSource('workoutStorage.ts', { './kvStore': {} });
const makeSet = (overrides = {}) => ({ id: 's1', weight: '12,5', reps: '10', seconds: '', completed: true, ...overrides });
const makeExercise = (overrides = {}) => ({
  id: 'e1', exerciseId: 'dumbbell-bench-press', nameZh: '哑铃卧推', nameEn: 'Dumbbell Bench Press',
  equipmentZh: '哑铃', equipmentEn: 'Dumbbell', tracking: 'reps', sets: [makeSet()], ...overrides,
});
const makeDraft = (exercises = [makeExercise()]) => ({
  id: 'w1', startedAt: '2026-09-12T12:00:00.000Z', title: '  上肢训练  ', notes: '  感觉不错  ', exercises,
});
const finish = new Date('2026-09-12T13:00:00.000Z');

test('save completed sets only, preserve input, decimal weights and custom exercise snapshots', () => {
  const draft = makeDraft([
    makeExercise({ sets: [makeSet(), makeSet({ id: 's2', completed: false, reps: '' })] }),
    makeExercise({ id: 'e2', exerciseId: 'custom-1', nameZh: '我的动作', sets: [makeSet({ weight: '0' })] }),
    makeExercise({ id: 'e3', sets: [makeSet({ completed: false, reps: '' })] }),
  ]);
  const before = JSON.stringify(draft);
  const record = buildWorkoutRecord(draft, finish);
  assert.equal(record.exercises.length, 2);
  assert.equal(record.exercises[0].sets.length, 1);
  assert.equal(record.exercises[0].sets[0].weightKg, 12.5);
  assert.equal(record.exercises[1].sets[0].weightKg, 0);
  assert.equal(record.exercises[1].nameZh, '我的动作');
  assert.equal(record.title, '上肢训练');
  assert.equal(record.notes, '感觉不错');
  assert.equal(record.finishedAt, finish.toISOString());
  assert.equal(JSON.stringify(draft), before);
});

test('timed workouts save seconds without inventing repetitions or weights', () => {
  const record = buildWorkoutRecord(makeDraft([makeExercise({ tracking: 'duration', sets: [makeSet({ seconds: '90', weight: '', reps: '' })] })]), finish);
  assert.deepEqual(record.exercises[0].sets[0], { id: 's1', completed: true, weightKg: 0, reps: 0, seconds: 90 });
});

test('empty sessions and invalid completed input cannot become saved records', () => {
  assert.throws(() => buildWorkoutRecord(makeDraft([])), /至少一组/);
  assert.throws(() => buildWorkoutRecord(makeDraft([makeExercise({ sets: [makeSet({ completed: false })] })])), /至少一组/);
  for (const bad of ['', '0', '-1', '1.5', '1e2', '1001', 'Infinity', 'NaN']) {
    assert.throws(() => buildWorkoutRecord(makeDraft([makeExercise({ sets: [makeSet({ reps: bad })] })])), /次数/);
  }
  for (const bad of ['', '-1', '1501', 'NaN', 'Infinity']) {
    assert.throws(() => buildWorkoutRecord(makeDraft([makeExercise({ sets: [makeSet({ weight: bad })] })])), /重量/);
  }
  for (const bad of ['', '0', '-2', '1.5', '86401']) {
    assert.throws(() => buildWorkoutRecord(makeDraft([makeExercise({ tracking: 'duration', sets: [makeSet({ seconds: bad })] })])), /时长/);
  }
});

test('drafts (including unfinished fields) and records survive a JSON reload', () => {
  const state = { records: [buildWorkoutRecord(makeDraft(), finish)], draft: makeDraft([makeExercise({ sets: [makeSet({ reps: '', weight: '', completed: false })] })]) };
  assert.deepEqual(parseWorkoutState(JSON.stringify(state)), state);
  assert.deepEqual(parseWorkoutState(null), { records: [], draft: null });
  for (const bad of ['{', '{}', '{"records":[{}],"draft":null}', '{"records":[],"draft":{}}']) {
    assert.throws(() => parseWorkoutState(bad));
  }
});

test('slow draft writes cannot overwrite a finished workout; failed writes do not block retries', async () => {
  let stored = null;
  let releaseFirst;
  let calls = 0;
  const storage = {
    async getItem() { return stored; },
    async setItem(key, json) {
      assert.equal(key, 'keepfit.workouts.v1');
      calls += 1;
      if (calls === 1) await new Promise((resolve) => { releaseFirst = resolve; });
      if (calls === 3) throw new Error('disk error');
      stored = json;
    },
  };
  const { saveWorkoutState, loadWorkoutState } = loadSource('workoutStorage.ts', { './kvStore': storage });
  const draftState = { records: [], draft: makeDraft() };
  const finalState = { records: [buildWorkoutRecord(makeDraft(), finish)], draft: null };
  const first = saveWorkoutState(draftState);
  const second = saveWorkoutState(finalState);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls, 1);
  releaseFirst();
  await Promise.all([first, second]);
  assert.deepEqual(await loadWorkoutState(), finalState);
  await assert.rejects(saveWorkoutState(draftState), /disk error/);
  assert.deepEqual(await loadWorkoutState(), finalState);
  await saveWorkoutState(draftState);
  assert.deepEqual(await loadWorkoutState(), draftState);
});
