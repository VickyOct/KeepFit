const assert = require('node:assert/strict');
const test = require('node:test');
const React = require('react');
const { create, act } = require('react-test-renderer');
const { createLoader } = require('./load-workout-ui.cjs');

global.IS_REACT_ACT_ENVIRONMENT = true;

const textOf = (node) => typeof node === 'string' ? node : (node.children ?? []).map(textOf).join('');
const button = (tree, label) => tree.root.findAllByType('Pressable').find((node) => node.props.accessibilityLabel === label || textOf(node) === label);
const press = async (tree, label) => {
  const node = button(tree, label);
  assert.ok(node, `Missing button: ${label}`);
  await act(async () => { node.props.onPress(); });
};

async function renderScreen(loader) {
  const { WorkoutScreen } = loader.load('src/components/WorkoutScreen.tsx');
  let saved;
  function Harness() {
    const [draft, setDraft] = React.useState(null);
    const [records, setRecords] = React.useState([]);
    return React.createElement(WorkoutScreen, {
      workouts: records, draft, onDraftChange: setDraft,
      onSave: async (record) => { saved = record; setRecords([record]); setDraft(null); },
      onDelete: async () => {},
    });
  }
  let tree;
  await act(async () => { tree = create(React.createElement(Harness)); });
  return { tree, getSaved: () => saved };
}

test('all catalog and diagram references resolve, with honest image availability', () => {
  const { load } = createLoader();
  const { EXERCISES, MUSCLE_GROUPS } = load('src/data/exercises.ts');
  const { DIAGRAM_REVIEWS } = load('src/data/diagramReview.ts');
  const { FEMALE_FRIENDLY_FITS } = load('src/data/femaleFriendlyFit.ts');
  assert.equal(EXERCISES.length, 50);
  for (const [id, fit] of Object.entries(FEMALE_FRIENDLY_FITS)) {
    assert.ok(EXERCISES.some((entry) => entry.id === id), `Orphan fit annotation: ${id}`);
    assert.ok(fit.reason && fit.check && fit.basis, `Incomplete fit conditions: ${id}`);
  }
  assert.equal(new Set(EXERCISES.map((entry) => entry.id)).size, EXERCISES.length);
  assert.equal(new Set(MUSCLE_GROUPS).size, MUSCLE_GROUPS.length);
  assert.equal(EXERCISES.reduce((sum, entry) => sum + entry.images.length, 0), 59);
  for (const entry of EXERCISES) {
    assert.ok(entry.instructions.length >= 3, entry.id);
    assert.equal(entry.images.length, entry.imageLabels.length, entry.id);
    assert.ok(entry.techniqueReferences.length, entry.id);
    assert.equal(entry.techniqueReferences[0].url, entry.sourceUrl, entry.id);
    for (const reference of entry.techniqueReferences) {
      assert.equal(new URL(reference.url).protocol, 'https:');
      assert.ok(reference.title && reference.publisher && reference.kind, entry.id);
    }
  }
  for (const diagram of DIAGRAM_REVIEWS) {
    for (const finding of diagram.findings) {
      for (const id of finding.exerciseIds) assert.ok(EXERCISES.some((entry) => entry.id === id), id);
    }
  }
});

test('body-fit filter combines with muscle and query, survives guide return, and clears empty results', async () => {
  const loader = createLoader();
  const { tree } = await renderScreen(loader);
  const toggle = '只看女性友好候选，按身体适配条件筛选';
  try {
    await press(tree, '打开动作与器材库，中英文搜索及动作指导');
    assert.equal(button(tree, toggle).props.accessibilityState.checked, false);
    assert.ok(textOf(tree.root).includes('不是已证实更适合女性骨骼的排名'));
    await press(tree, toggle);
    assert.equal(button(tree, toggle).props.accessibilityState.checked, true);
    assert.equal(button(tree, '宽握高位下拉，Wide-grip Lat Pulldown，查看动作指导'), undefined);
    await press(tree, '胸部');
    assert.equal(button(tree, '徒手深蹲，Bodyweight Squat，查看动作指导'), undefined);
    await act(async () => { tree.root.findByType('TextInput').props.onChangeText('dumbbell'); });
    await press(tree, '哑铃平板卧推，Dumbbell Bench Press，查看动作指导');
    assert.ok(textOf(tree.root).includes('适用条件'));
    assert.ok(textOf(tree.root).includes('便于按肩宽、臂长调整'));
    assert.ok(textOf(tree.root).includes('2026-09-27'));
    assert.ok(button(tree, '打开技术参考：器械选择与身体尺寸'));
    await press(tree, '返回');
    assert.equal(button(tree, toggle).props.accessibilityState.checked, true);
    assert.equal(tree.root.findByType('TextInput').props.value, 'dumbbell');
    await act(async () => { tree.root.findByType('TextInput').props.onChangeText('不存在的动作'); });
    assert.ok(textOf(tree.root).includes('没有找到这个动作'));
    await press(tree, '清除动作库搜索和筛选');
    assert.equal(button(tree, toggle).props.accessibilityState.checked, false);
    assert.equal(tree.root.findByType('TextInput').props.value, '');
    assert.ok(button(tree, '宽握高位下拉，Wide-grip Lat Pulldown，查看动作指导'));
  } finally { await act(async () => { tree.unmount(); }); }
});

test('machine annotations expose fit conditions and reference links without implying all women fit', async () => {
  const loader = createLoader();
  const opened = [];
  loader.native.Linking.openURL = async (url) => { opened.push(url); };
  const { tree } = await renderScreen(loader);
  try {
    await press(tree, '打开动作与器材库，中英文搜索及动作指导');
    await press(tree, '坐姿腿屈伸，Leg Extension，查看动作指导');
    assert.ok(textOf(tree.root).includes('需匹配器械'));
    assert.ok(textOf(tree.root).includes('调不到位则不属于适配选择'));
    await press(tree, '打开技术参考：器械选择与身体尺寸');
    assert.match(opened[0], /^https:\/\/www\.nsca\.com\//);
    await press(tree, '返回');
    await press(tree, '宽握高位下拉，Wide-grip Lat Pulldown，查看动作指导');
    assert.equal(textOf(tree.root).includes('女性友好候选'), false);
    assert.ok(textOf(tree.root).includes('动作怎么做'));
  } finally { await act(async () => { tree.unmount(); }); }
});

test('diagram → guide → back preserves navigation and library filters', async () => {
  const loader = createLoader();
  const { tree } = await renderScreen(loader);
  try {
    await press(tree, '打开动作与器材库，中英文搜索及动作指导');
    await press(tree, '腿臀');
    await act(async () => { tree.root.findByType('TextInput').props.onChangeText('夹腿'); });
    assert.ok(button(tree, '坐姿髋内收，Seated Hip Adduction，查看动作指导'));
    assert.equal(button(tree, '宽握高位下拉，Wide-grip Lat Pulldown，查看动作指导'), undefined);
    await press(tree, '查看三张健身图的核对说明');
    await press(tree, '从图解查看宽握高位下拉技术参考');
    assert.ok(textOf(tree.root).includes('不能把高位下拉当作这两块肌肉的专项练习'));
    assert.ok(button(tree, '打开技术参考：Seated Lat Pulldown'));
    await press(tree, '返回');
    assert.ok(textOf(tree.root).includes('照片 2 · 背部'));
    await press(tree, '返回');
    assert.equal(tree.root.findByType('TextInput').props.value, '夹腿');
    assert.ok(button(tree, '坐姿髋内收，Seated Hip Adduction，查看动作指导'));
  } finally { await act(async () => { tree.unmount(); }); }
});

test('new text guide opens its exact reference, reports failures and saves completed sets', async () => {
  const loader = createLoader();
  const opened = [];
  loader.native.Linking.openURL = async (url) => { opened.push(url); };
  const { tree, getSaved } = await renderScreen(loader);
  try {
    await press(tree, '打开动作与器材库，中英文搜索及动作指导');
    await act(async () => { tree.root.findByType('TextInput').props.onChangeText('臀推'); });
    await press(tree, '杠铃臀推，Barbell Hip Thrust，查看动作指导');
    assert.ok(textOf(tree.root).includes('本动作提供文字技术参考，暂无配图'));
    assert.equal(tree.root.findAllByType('Image').length, 0);
    await press(tree, '打开技术参考：Barbell Hip Thrust');
    assert.equal(opened.length, 1);
    assert.match(opened[0], /\/Barbell_Hip_Thrust\.json$/);
    loader.native.Linking.openURL = async () => { throw new Error('offline'); };
    await press(tree, '打开技术参考：Barbell Hip Thrust');
    assert.equal(loader.alerts.at(-1)[0], '无法打开技术参考');
    await press(tree, '＋ 加入本次训练');
    const fill = async (label, value) => {
      await act(async () => { tree.root.findAllByType('TextInput').find((node) => node.props.accessibilityLabel === label).props.onChangeText(value); });
    };
    await fill('杠铃臀推第1组重量，公斤', '20');
    await fill('杠铃臀推第1组次数', '10');
    await press(tree, '杠铃臀推第1组标记完成');
    await press(tree, '完成并保存');
    assert.equal(getSaved().exercises[0].exerciseId, 'barbell-hip-thrust');
    assert.equal(getSaved().exercises[0].sets[0].weightKg, 20);
    assert.equal(getSaved().exercises[0].sets[0].reps, 10);
    await press(tree, tree.root.findAllByType('Pressable').find((node) => node.props.accessibilityLabel?.startsWith('查看') && node.props.accessibilityLabel.includes('，')).props.accessibilityLabel);
    await press(tree, '查看杠铃臀推动作指导');
    assert.ok(button(tree, '打开技术参考：Barbell Hip Thrust'));
    await press(tree, '返回');
    assert.ok(textOf(tree.root).includes('20 kg × 10 次'));
  } finally { await act(async () => { tree.unmount(); }); }
});
