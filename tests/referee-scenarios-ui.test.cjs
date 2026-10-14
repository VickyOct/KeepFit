const assert = require('node:assert/strict');
const test = require('node:test');
const React = require('react');
const { create, act } = require('react-test-renderer');
const { createLoader } = require('./load-workout-ui.cjs');

global.IS_REACT_ACT_ENVIRONMENT = true;
const text = (tree) => tree.root.findAllByType('Text').map((node) => node.children.filter((c) => typeof c === 'string' || typeof c === 'number').join('')).join('\n');
const button = (tree, label) => tree.root.findAllByType('Pressable').find((node) => node.props.accessibilityLabel === label);
async function click(tree, label) {
  const node = button(tree, label); assert.ok(node, `Missing: ${label}`); assert.ok(!node.props.disabled, `Disabled: ${label}`);
  await act(async () => { node.props.onPress(); });
}
function setup() {
  let json = null, failRead = false, failWrite = false;
  const f = createLoader({ 'expo-sqlite/kv-store': {
    async getItem() { if (failRead) throw new Error('read'); return json; },
    async setItem(key, value) { if (failWrite) throw new Error('write'); json = value; },
  } });
  const Screen = f.load('src/components/RefereeScreen.tsx').RefereeScreen;
  const exams = f.load('src/data/refereeScenarioExams.ts').refereeScenarioExams;
  return { ...f, exams, stored: () => json === null ? null : JSON.parse(json), failRead: (value) => { failRead = value; }, failWrite: (value) => { failWrite = value; },
    async render() { let tree; await act(async () => { tree = create(React.createElement(Screen)); }); return tree; } };
}

test('final exams resume drafts, grade complete decisions, link to study and return to the same result', async () => {
  const f = setup(); const exam = f.exams[0]; let tree = await f.render();
  assert.ok(button(tree, '前往综合情景测试 · 5 套 50 题'));
  for (const item of f.exams) assert.ok(button(tree, `${item.title}，未开始`));
  await click(tree, '综合模拟 1，未开始');
  await click(tree, '开始综合模拟 1 · 10 题');
  assert.ok(text(tree).includes(exam.questions[0].prompt));
  assert.ok(!text(tree).includes(exam.questions[0].explanation));
  const first = exam.questions[0];
  await click(tree, `${String.fromCharCode(65 + first.correctIndex)} ${first.options[first.correctIndex]}`);
  assert.equal(button(tree, '还剩 9 道情景未答').props.disabled, true);
  await act(async () => tree.unmount()); tree = await f.render();
  await click(tree, '综合模拟 1，答题中'); await click(tree, '继续综合模拟 1 · 已答 1/10');
  assert.match(text(tree), /情景 2 \/ 10/);
  for (let i = 1; i < 10; i++) {
    await click(tree, `跳到情景 ${i + 1}`);
    const q = exam.questions[i], answer = i < 8 ? q.correctIndex : (q.correctIndex + 1) % 4;
    await click(tree, `${String.fromCharCode(65 + answer)} ${q.options[answer]}`);
  }
  await click(tree, '提交综合测验 · 查看成绩');
  assert.match(text(tree), /本套综合测试通过/); assert.match(text(tree), /2 道错题/);
  assert.equal(f.stored().exams[exam.id].latestAttempt.score, 8);
  const wrong = exam.questions[9];
  await click(tree, `查看情景英文原文 · ${wrong.reference}`);
  assert.match(text(tree), new RegExp(`FIBA 官方英文原文 · ${wrong.reference}`));
  await click(tree, '返回综合测验复盘');
  assert.match(text(tree), /本套综合测试通过/);
  await click(tree, '重做综合模拟 1 · 10 题'); assert.match(text(tree), /已答 0 \/ 10/);
  for (let i = 0; i < 10; i++) {
    await click(tree, `跳到情景 ${i + 1}`); const q = exam.questions[i];
    await click(tree, `${String.fromCharCode(65 + q.correctIndex)} ${q.options[q.correctIndex]}`);
  }
  await click(tree, '提交综合测验 · 查看成绩');
  assert.match(text(tree), /这一套没有错题/);
  assert.equal(f.stored().exams[exam.id].bestAttempt.score, 10);
  await click(tree, '综合测验全部解析'); assert.ok(text(tree).includes(first.explanation));
  await click(tree, '继续综合模拟 2'); assert.match(text(tree), /综合模拟 2/);
  assert.ok(button(tree, '开始综合模拟 2 · 10 题'));
  assert.deepEqual(f.stored().lessons, {});
  await act(async () => tree.unmount());
});

test('exam save failure never checks an unsaved answer; read failures disable attempts until retry', async () => {
  const f = setup(); f.failRead(true); const tree = await f.render();
  await click(tree, '综合模拟 1，进度待读取');
  assert.equal(button(tree, '开始综合模拟 1 · 10 题').props.disabled, true);
  f.failRead(false); await click(tree, '重新读取学习进度'); await click(tree, '开始综合模拟 1 · 10 题');
  const q = f.exams[0].questions[0], label = `${String.fromCharCode(65 + q.correctIndex)} ${q.options[q.correctIndex]}`;
  f.failWrite(true); await click(tree, label);
  assert.equal(button(tree, label).props.accessibilityState.checked, false);
  assert.equal(f.stored(), null); assert.match(text(tree), /未保存/);
  assert.equal(f.alerts.at(-1)[0], '综合测验未保存');
  f.failWrite(false); await click(tree, label);
  assert.equal(button(tree, label).props.accessibilityState.checked, true);
  assert.equal(f.stored().exams['scenario-1'].draftAnswers[q.id], q.correctIndex);
  await act(async () => tree.unmount());
});

test('the last course leads into the five final sets without marking lessons completed', async () => {
  const f = setup(); const tree = await f.render();
  const last = f.load('src/data/refereeLessons.ts').refereeLessons.at(-1);
  await click(tree, `第 16 课 ${last.title}，待学习`);
  await click(tree, '进入综合情景测试 · 5 套 50 题');
  assert.ok(button(tree, '综合模拟 5，未开始')); assert.equal(f.stored(), null);
  await act(async () => tree.unmount());
});
