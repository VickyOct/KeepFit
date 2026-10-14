const assert = require('node:assert/strict');
const test = require('node:test');
const React = require('react');
const { create, act } = require('react-test-renderer');
const { createLoader } = require('./load-workout-ui.cjs');
global.IS_REACT_ACT_ENVIRONMENT = true;

const draft = { id: 'draft-1', title: '训练', notes: '', startedAt: '2026-09-12T12:00:00.000Z', exercises: [] };
const record = { ...draft, finishedAt: '2026-09-12T13:00:00.000Z' };

async function renderApp(saveWorkoutState) {
  const overrides = {
    'expo-image-picker': {},
    'expo-status-bar': { StatusBar: 'StatusBar' },
    './src/services/notifications': { setupDailyMealReminders: async () => 'scheduled' },
    './src/storage': { loadAppState: async () => ({ meals: [], proteinTarget: 120 }) },
    './src/workoutStorage': { loadWorkoutState: async () => ({ records: [], draft }), saveWorkoutState },
  };
  for (const name of ['BottomNav', 'CaptureModal', 'HistoryScreen', 'HomeScreen', 'ReviewScreen', 'RecipeScreen', 'RefereeScreen', 'TargetModal', 'WorkoutScreen']) {
    overrides[`./src/components/${name}`] = { [name]: name };
  }
  const { load } = createLoader(overrides);
  const App = load('App.tsx').default;
  let rendered;
  await act(async () => { rendered = create(React.createElement(App)); });
  await act(async () => { rendered.root.findByType('BottomNav').props.onWorkout(); });
  return rendered;
}

test('app blocks stale draft mutations during an in-flight final save', async () => {
  const writes = [];
  let release;
  const rendered = await renderApp((state) => {
    writes.push(state);
    return new Promise((resolve) => { release = resolve; });
  });
  let saving;
  await act(async () => { saving = rendered.root.findByType('WorkoutScreen').props.onSave(record); });
  assert.equal(rendered.root.findByType('WorkoutScreen').props.busy, true);
  assert.equal(rendered.root.findByType('BottomNav').parent.props.pointerEvents, 'none');
  await act(async () => {
    rendered.root.findByType('WorkoutScreen').props.onDraftChange({ ...draft, title: 'stale edit' });
  });
  assert.equal(writes.length, 1);
  await assert.rejects(rendered.root.findByType('WorkoutScreen').props.onDelete(record.id), /请等待/);
  await act(async () => { release(); await saving; });
  const props = rendered.root.findByType('WorkoutScreen').props;
  assert.equal(props.busy, false);
  assert.equal(props.draft, null);
  assert.deepEqual(props.workouts, [record]);
  await act(async () => { rendered.unmount(); });
});

test('failed final save retains draft and releases the application lock for retry', async () => {
  let reject;
  const rendered = await renderApp(() => new Promise((_, fail) => { reject = fail; }));
  let saving;
  await act(async () => { saving = rendered.root.findByType('WorkoutScreen').props.onSave(record); });
  await act(async () => { reject(new Error('disk error')); await assert.rejects(saving, /disk error/); });
  const props = rendered.root.findByType('WorkoutScreen').props;
  assert.equal(props.busy, false);
  assert.deepEqual(props.draft, draft);
  assert.deepEqual(props.workouts, []);
  assert.equal(rendered.root.findByType('BottomNav').parent.props.pointerEvents, 'auto');
  await act(async () => { rendered.unmount(); });
});
