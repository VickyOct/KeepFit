const assert = require('node:assert/strict');
const test = require('node:test');
const React = require('react');
const { create, act } = require('react-test-renderer');
const { createLoader } = require('./load-workout-ui.cjs');

global.IS_REACT_ACT_ENVIRONMENT = true;
const text = (tree) => tree.root.findAllByType('Text').map((item) => item.children.filter((c) => typeof c === 'string' || typeof c === 'number').join('')).join('\n');
const button = (tree, label) => tree.root.findAllByType('Pressable').find((node) => node.props.accessibilityLabel === label);
async function click(tree, label) {
  const node = button(tree, label);
  assert.ok(node, `Missing button: ${label}`);
  assert.ok(!node.props.disabled, `Disabled button: ${label}`);
  await act(async () => { node.props.onPress(); });
}

function setup() {
  let json = null; let failWrite = false; let failRead = false;
  const scrollCalls = [];
  const loader = createLoader({ 'expo-sqlite/kv-store': {
    async getItem() { if (failRead) throw new Error('read error'); return json; },
    async setItem(key, value) { if (failWrite) throw new Error('write error'); json = value; },
  } });
  const Screen = loader.load('src/components/RefereeScreen.tsx').RefereeScreen;
  const lessons = loader.load('src/data/refereeLessons.ts').refereeLessons;
  return { ...loader, lessons, scrollCalls, stored: () => JSON.parse(json), failWrite: (value) => { failWrite = value; }, failRead: (value) => { failRead = value; },
    async render() { let rendered; await act(async () => { rendered = create(React.createElement(Screen), {
      createNodeMock: (element) => element.type === 'ScrollView' ? { scrollTo: (options) => scrollCalls.push(options) } : null,
    }); }); return rendered; },
  };
}

test('screen unlocks after completion, restores a partial quiz, grades and reviews wrong answers', async () => {
  const f = setup(); const lesson = f.lessons[0];
  let tree = await f.render();
  await click(tree, '第 1 课 赛前检查与人员管理，待学习');
  for (const section of lesson.sections) {
    assert.ok(text(tree).includes(section.body));
    assert.ok(text(tree).includes(section.example.scenario));
    assert.ok(text(tree).includes(section.example.ruling));
    assert.ok(text(tree).includes(section.pitfall));
  }
  assert.equal(button(tree, '测验尚未解锁 · 请先完成阅读').props.disabled, true);
  await click(tree, '标记为已完成 · Mark as completed');
  await click(tree, '开始本课测验 · 10 题');
  const first = lesson.questions[0];
  await click(tree, `${String.fromCharCode(65 + first.correctIndex)} ${first.options[first.correctIndex]}`);
  assert.equal(f.stored().lessons.pregame.draftAnswers[first.id], first.correctIndex);
  assert.equal(button(tree, '还剩 9 题未答').props.disabled, true);
  await act(async () => { tree.unmount(); });
  tree = await f.render();
  await click(tree, '第 1 课 赛前检查与人员管理，✓ 阅读完成');
  await click(tree, '继续测验 · 已答 1/10');
  assert.match(text(tree), /第 2 \/ 10 题/);
  for (let i = 1; i < 10; i++) {
    if (i !== 1) await click(tree, `跳到第 ${i + 1} 题`);
    const q = lesson.questions[i]; const choice = i < 8 ? q.correctIndex : (q.correctIndex + 1) % 4;
    await click(tree, `${String.fromCharCode(65 + choice)} ${q.options[choice]}`);
  }
  await click(tree, '提交测验 · 查看成绩');
  assert.equal(f.stored().lessons.pregame.latestAttempt.score, 8);
  assert.match(text(tree), /本课测验通过/);
  assert.match(text(tree), /2 道错题/);
  assert.match(text(tree), /正确答案/);
  assert.match(text(tree), /7-2/);
  await click(tree, '阅读对应英文原文 · 7-2');
  assert.match(text(tree), /FIBA 官方英文原文 · 7-2/);
  assert.equal(f.stored().lessons.pregame.latestAttempt.score, 8);
  await click(tree, '查看上次成绩与解析');
  const reading = lesson.sections.find((section) => section.id === lesson.questions[8].studySectionId);
  await click(tree, `回看本课讲解 · ${reading.title}`);
  assert.match(text(tree), /当前复习/);
  assert.ok(text(tree).includes(reading.body));
  const target = tree.root.findByProps({ testID: `reading-section-${reading.id}` });
  f.scrollCalls.length = 0;
  // The section is measured before the full reading page is ready. Do not jump
  // using a short result page's size; jump once the new content is measured.
  await act(async () => target.props.onLayout({ nativeEvent: { layout: { y: 2400 } } }));
  assert.equal(f.scrollCalls.length, 0);
  await act(async () => tree.root.findByType('ScrollView').props.onContentSizeChange(390, 7000));
  assert.deepEqual(f.scrollCalls.at(-1), { y: 2388, animated: true });
  assert.equal(f.stored().lessons.pregame.latestAttempt.score, 8);
  await click(tree, '查看上次成绩与解析');
  await click(tree, '重做本课 10 题');
  assert.match(text(tree), /已答 0 \/ 10/);
  for (let i = 0; i < 10; i++) {
    await click(tree, `跳到第 ${i + 1} 题`);
    const q = lesson.questions[i];
    await click(tree, `${String.fromCharCode(65 + q.correctIndex)} ${q.options[q.correctIndex]}`);
  }
  await click(tree, '提交测验 · 查看成绩');
  assert.match(text(tree), /这一轮没有错题/);
  await act(async () => { tree.root.findAllByType('Pressable').find((node) => node.children.some((child) => typeof child !== 'string' && child.type === 'Text' && child.children.includes('全部解析'))).props.onPress(); });
  assert.match(text(tree), /原文 2-5/);
  await act(async () => { tree.unmount(); });
});

test('English originals expand the chosen reference only and leave saved learning progress untouched', async () => {
  const f = setup(); const tree = await f.render();
  await click(tree, '第 1 课 赛前检查与人员管理，待学习');
  assert.doesNotMatch(text(tree), /FIBA 官方英文原文 ·/);
  for (const section of f.lessons[0].sections) {
    for (const reference of [section.reference, ...section.additionalReferences]) assert.ok(button(tree, `阅读英文原文 ${reference}`));
  }
  await click(tree, '标记为已完成 · Mark as completed');
  const saved = f.stored();
  await click(tree, '阅读英文原文 2-5');
  assert.match(text(tree), /FIBA 官方英文原文 · 2-5/);
  assert.equal(button(tree, '阅读英文原文 2-5').props.accessibilityState.selected, true);
  await click(tree, '阅读英文原文 4-4');
  assert.match(text(tree), /FIBA 官方英文原文 · 4-4/);
  assert.doesNotMatch(text(tree), /FIBA 官方英文原文 · 2-5/);
  assert.ok(button(tree, '查看条款 4-4 原文'));
  assert.deepEqual(f.stored(), saved);
  await click(tree, '收起英文原文');
  assert.doesNotMatch(text(tree), /FIBA 官方英文原文 ·/);
  await click(tree, '阅读英文原文 5-15');
  await click(tree, '开始本课测验 · 10 题');
  assert.doesNotMatch(text(tree), /FIBA 官方英文原文 ·/);
  assert.deepEqual(f.stored(), saved);
  await act(async () => tree.unmount());
});

test('lesson contents jump to detailed teaching after either layout order', async () => {
  const f = setup(); const tree = await f.render();
  await click(tree, '第 1 课 赛前检查与人员管理，待学习');
  const section = f.lessons[0].sections[3];
  await click(tree, `阅读讲解 4 ${section.title}`);
  f.scrollCalls.length = 0;
  await act(async () => tree.root.findByType('ScrollView').props.onContentSizeChange(390, 7000));
  assert.equal(f.scrollCalls.length, 0);
  await act(async () => tree.root.findByProps({ testID: `reading-section-${section.id}` }).props.onLayout({ nativeEvent: { layout: { y: 1500 } } }));
  assert.deepEqual(f.scrollCalls.at(-1), { y: 1488, animated: true });
  assert.match(text(tree), /场上案例/);
  assert.match(text(tree), /易错点/);
  assert.equal(button(tree, '测验尚未解锁 · 请先完成阅读').props.disabled, true);
  await act(async () => tree.unmount());
});

test('failed completion is not displayed as saved and retry preserves the flow', async () => {
  const f = setup(); const tree = await f.render();
  await click(tree, '第 1 课 赛前检查与人员管理，待学习');
  f.failWrite(true);
  await click(tree, '标记为已完成 · Mark as completed');
  assert.equal(button(tree, '测验尚未解锁 · 请先完成阅读').props.disabled, true);
  assert.match(text(tree), /未保存/);
  assert.equal(f.alerts.at(-1)[0], '学习进度未保存');
  f.failWrite(false);
  await click(tree, '标记为已完成 · Mark as completed');
  assert.ok(button(tree, '开始本课测验 · 10 题'));
  assert.ok(f.stored().lessons.pregame.completedAt);
  await act(async () => { tree.unmount(); });
});

test('load failures permit reading but lock writes until a successful reload', async () => {
  const f = setup(); f.failRead(true);
  const tree = await f.render();
  assert.match(text(tree), /暂时无法读取原有进度/);
  await click(tree, '第 1 课 赛前检查与人员管理，进度待读取');
  assert.match(text(tree), /场地与装备检查/);
  assert.equal(button(tree, '标记为已完成 · Mark as completed').props.disabled, true);
  f.failRead(false);
  await click(tree, '重新读取学习进度');
  assert.equal(button(tree, '标记为已完成 · Mark as completed').props.disabled, false);
  await act(async () => { tree.unmount(); });
});

test('bottom navigation exposes the referee module and selected state', async () => {
  const { load } = createLoader(); const Nav = load('src/components/BottomNav.tsx').BottomNav;
  let selected = 0; let tree;
  await act(async () => { tree = create(React.createElement(Nav, { active: 'referee', onReferee: () => selected++, onHome() {}, onWorkout() {}, onCapture() {}, onRecipes() {}, onHistory() {} })); });
  assert.equal(button(tree, '篮球裁判学习').props.accessibilityState.selected, true);
  await click(tree, '篮球裁判学习');
  assert.equal(selected, 1);
  await act(async () => { tree.unmount(); });
});
