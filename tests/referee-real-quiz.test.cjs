const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const React = require('react');
const { act, create } = require('react-test-renderer');
const { createLoader } = require('./load-workout-ui.cjs');

global.IS_REACT_ACT_ENVIRONMENT = true;

const text = (tree) => tree.root.findAllByType('Text')
  .map((node) => node.children.filter((child) => typeof child === 'string' || typeof child === 'number').join(''))
  .join('\n');

const button = (tree, label) => tree.root.findAllByType('Pressable')
  .find((node) => node.props.accessibilityLabel === label);

async function click(tree, label) {
  const node = button(tree, label);
  assert.ok(node, `Missing: ${label}`);
  await act(async () => { node.props.onPress(); });
}

test('real quiz bank is balanced, mixed and traceable to the matching official reference', () => {
  const loader = createLoader();
  const { refereeRealQuizQuestions, createRealQuizQueue } = loader.load('src/data/refereeRealQuiz.ts');
  const { refereeLessons } = loader.load('src/data/refereeLessons.ts');
  const { referencePage } = loader.load('src/refereeUtils.ts');

  const total = refereeRealQuizQuestions.length;
  assert.equal(total, 32);
  assert.equal(new Set(refereeRealQuizQuestions.map((question) => question.id)).size, total);
  assert.ok(refereeRealQuizQuestions.filter((question) => question.whistle).length >= 10);
  assert.ok(refereeRealQuizQuestions.filter((question) => !question.whistle).length >= 10);
  assert.ok(refereeRealQuizQuestions.every((question) => question.animation.uri.endsWith('.gif')));
  assert.equal(new Set(refereeRealQuizQuestions.map((question) => question.animation.uri)).size, total, 'each question has its own GIF');
  assert.equal(new Set(refereeRealQuizQuestions.map((question) => question.animationLabel)).size, total);
  assert.ok(refereeRealQuizQuestions.every((question) => question.englishTerms.length >= 4));
  assert.ok(refereeRealQuizQuestions.every((question) => question.signalSequence.length >= 1));

  const clearPath = refereeRealQuizQuestions.find((question) => question.id === 'scenario-3-q3');
  assert.ok(clearPath.englishTerms.some((term) => term.english === 'Disruptive foul'));
  assert.ok(clearPath.englishTerms.some((term) => term.english === 'Illegal use of hands'));
  assert.match(clearPath.signalSequence.map((step) => step.text).join(' '), /B11.*Disruptive foul.*2 free throws/);
  assert.match(clearPath.signalNote, /最终分类.*disruptive foul/);
  assert.deepEqual(clearPath.signalSequence.map((step) => step.signals ?? []),
    [['stop-clock-foul'], ['disruptive-foul'], ['number-11-15', 'disruptive-foul', 'two-free-throws'], []]);

  for (const question of refereeRealQuizQuestions) {
    const lesson = refereeLessons.find((item) => item.id === question.lessonId);
    const section = lesson.sections.find((item) => item.id === question.studySectionId);
    assert.ok([section.reference, ...section.additionalReferences].includes(question.reference), question.id);
    assert.ok(referencePage(question.reference) > 0);
  }

  const queue = createRealQuizQueue(null, () => 0);
  assert.deepEqual(new Set(queue), new Set(refereeRealQuizQuestions.map((question) => question.id)));
  const nextCycle = createRealQuizQueue(queue[0], () => 0);
  assert.notEqual(nextCycle[0], queue[0]);
});

test('whistle answers map each step to cropped FIBA Appendix A signals; play-on answers only show counting or scoring signals', () => {
  const loader = createLoader();
  const { refereeRealQuizQuestions, refereeSignals } = loader.load('src/data/refereeRealQuiz.ts');

  for (const [id, signal] of Object.entries(refereeSignals)) {
    const file = path.join(__dirname, '../assets/referee/signals', `${id}.png`);
    assert.equal(path.basename(path.dirname(signal.image.uri)), 'signals', id);
    assert.equal(path.basename(signal.image.uri), `${id}.png`, id);
    const png = fs.readFileSync(file);
    assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [signal.width, signal.height], `${id} dimensions`);
    assert.match(signal.figure, /^\d+$/);
    assert.ok(signal.english && signal.chinese && signal.alt, id);
  }

  const used = refereeRealQuizQuestions.flatMap((question) => question.signalSequence.flatMap((step) => step.signals ?? []));
  assert.ok(used.every((id) => refereeSignals[id]), 'unknown signal id');
  assert.deepEqual(new Set(used), new Set(Object.keys(refereeSignals)));

  for (const question of refereeRealQuizQuestions.filter((item) => item.whistle)) {
    const signals = question.signalSequence.flatMap((step) => step.signals ?? []);
    assert.match(signals[0], /^stop-clock/, question.id);
    assert.ok(signals.length >= 2, question.id);
  }
  const byId = (id) => refereeRealQuizQuestions.find((question) => question.id === id).signalSequence.flatMap((step) => step.signals ?? []);
  assert.deepEqual(byId('scenario-1-q2'), ['stop-clock', 'travelling', 'direction-of-play']);
  assert.deepEqual(byId('scenario-1-q5'), ['stop-clock', 'five-seconds', 'direction-of-play']);
  assert.deepEqual(byId('scenario-2-q10'), ['stop-clock', 'backcourt', 'direction-of-play']);
  assert.deepEqual(byId('scenario-4-q4'), ['stop-clock', 'shot-clock', 'cancel-score', 'direction-of-play']);
  assert.deepEqual(byId('scenario-2-q3'), ['stop-clock', 'eight-seconds', 'direction-of-play']);
  assert.deepEqual(byId('scenario-4-q2'), ['stop-clock', 'deliberate-kick', 'direction-of-play']);
  assert.deepEqual(byId('scenario-5-q3'), ['stop-clock', 'basket-interference', 'three-points']);
  assert.deepEqual(byId('scenario-3-q5'), ['stop-clock-foul', 'flagrant-foul', 'number-6-10', 'flagrant-foul', 'three-free-throws']);
  assert.deepEqual(byId('scenario-2-q8'), ['stop-clock', 'jump-ball']);
  assert.deepEqual(byId('scenario-4-q6'), ['visible-count']);
  assert.deepEqual(byId('scenario-2-q5'), ['three-points']);
  assert.deepEqual(byId('scenario-5-q5'), ['two-points']);
  assert.deepEqual(byId('scenario-1-q4'), ['stop-clock', 'double-dribble', 'direction-of-play']);
  assert.deepEqual(byId('scenario-1-q10'), ['stop-clock-foul', 'double-foul', 'number-1-5', 'direction-of-play']);
  assert.deepEqual(byId('scenario-2-q1'), ['stop-clock', 'five-seconds', 'direction-of-play']);
  assert.deepEqual(byId('scenario-2-q9'), ['stop-clock', 'direction-of-play']);
  assert.deepEqual(byId('scenario-3-q2'), ['stop-clock-foul', 'number-1-5', 'illegal-use-of-hands', 'foul-no-free-throws']);
  assert.deepEqual(byId('scenario-3-q4'), ['stop-clock-foul', 'disruptive-foul', 'disruptive-foul', 'two-free-throws']);
  assert.deepEqual(byId('scenario-5-q4'), ['stop-clock', 'basket-interference', 'cancel-score', 'direction-of-play']);
  assert.deepEqual(byId('scenario-5-q6'), ['stop-clock', 'shot-clock', 'direction-of-play']);
  assert.deepEqual(byId('scenario-4-q3'), ['two-points']);
  for (const question of refereeRealQuizQuestions.filter((item) => !item.whistle)) {
    assert.ok(byId(question.id).every((id) => ['visible-count', 'two-points', 'three-points'].includes(id)), question.id);
  }
  for (const id of ['scenario-2-q4', 'scenario-4-q1', 'scenario-1-q9', 'scenario-1-q3', 'scenario-1-q6', 'scenario-2-q2', 'scenario-3-q10',
    'scenario-1-q1', 'scenario-2-q7', 'scenario-3-q6']) {
    assert.deepEqual(byId(id), [], id);
  }
});

test('real quiz requires no answer input, hides the ruling, resets it for the next GIF and opens its source', async () => {
  const loader = createLoader();
  const Component = loader.load('src/components/RefereeRealQuiz.tsx').RefereeRealQuiz;
  const questions = loader.load('src/data/refereeRealQuiz.ts').refereeRealQuizQuestions;
  const opened = [];
  const studied = [];
  let tree;
  await act(async () => {
    tree = create(React.createElement(Component, {
      onOpenReference: (reference) => opened.push(reference),
      onStudy: (...args) => studied.push(args),
    }));
  });

  assert.equal(tree.root.findAllByType('Image').length, 0);
  await click(tree, '生成真实判例 · Generate Real Quiz');
  const firstSource = tree.root.findByType('Image').props.source.uri;
  const first = questions.find((question) => question.animation.uri === firstSource);
  assert.ok(first);
  assert.ok(text(tree).includes(first.prompt));
  assert.ok(!text(tree).includes(first.explanation));
  assert.equal(button(tree, '展开答案 · Reveal ruling').props.accessibilityState.expanded, false);

  await click(tree, '展开答案 · Reveal ruling');
  assert.ok(text(tree).includes(first.explanation));
  assert.ok(text(tree).includes('英文术语 · ENGLISH TERMS'));
  assert.ok(text(tree).includes('裁判手势顺序 · SIGNAL SEQUENCE'));
  assert.ok(text(tree).includes(first.englishTerms[0].english));
  assert.ok(text(tree).includes(`FIBA 2026 官方解释 ${first.reference}`));
  await click(tree, `查看条款 ${first.reference} 原文`);
  assert.deepEqual(opened, [first.reference]);
  await click(tree, '回看对应课程讲解');
  assert.deepEqual(studied, [[first.lessonId, first.studySectionId, first.reference]]);

  await click(tree, '再来一题 · Generate Next Quiz');
  const secondSource = tree.root.findByType('Image').props.source.uri;
  const second = questions.find((question) => question.animation.uri === secondSource);
  assert.ok(second);
  assert.notEqual(second.id, first.id);
  assert.ok(!text(tree).includes(second.explanation));
  assert.ok(button(tree, '展开答案 · Reveal ruling'));
  await act(async () => tree.unmount());
});

test('revealed answers show the gesture figures for each step, or say there is no official signal', async () => {
  const loader = createLoader();
  const Component = loader.load('src/components/RefereeRealQuiz.tsx').RefereeRealQuiz;
  const { refereeRealQuizQuestions: questions, refereeSignals } = loader.load('src/data/refereeRealQuiz.ts');
  const signalImages = (tree) => tree.root.findAllByType('Image').filter((node) => path.basename(path.dirname(node.props.source.uri)) === 'signals');
  let tree;
  await act(async () => {
    tree = create(React.createElement(Component, { onOpenReference: () => {}, onStudy: () => {} }));
  });

  await click(tree, '生成真实判例 · Generate Real Quiz');
  const seen = new Set();
  for (let round = 0; round < questions.length; round++) {
    const source = tree.root.findByType('Image').props.source.uri;
    const question = questions.find((item) => item.animation.uri === source);
    seen.add(question.id);
    assert.equal(signalImages(tree).length, 0, `${question.id} figures stay hidden before reveal`);

    await click(tree, '展开答案 · Reveal ruling');
    const expected = question.signalSequence.flatMap((step) => step.signals ?? []);
    assert.deepEqual(signalImages(tree).map((node) => node.props.source.uri), expected.map((id) => refereeSignals[id].image.uri), question.id);
    for (const id of expected) {
      assert.ok(signalImages(tree).some((node) => node.props.accessibilityLabel.includes(`#${refereeSignals[id].figure} ${refereeSignals[id].english}`)), id);
      assert.ok(text(tree).includes(`#${refereeSignals[id].figure} · ${refereeSignals[id].chinese}`), id);
    }
    assert.equal(text(tree).includes('无官方手势 · NO SIGNAL'), expected.length === 0, question.id);
    assert.equal(text(tree).includes('Appendix A Referees’ Signals'), expected.length > 0, question.id);

    await click(tree, '再来一题 · Generate Next Quiz');
  }
  assert.equal(seen.size, questions.length);
  await act(async () => tree.unmount());
});
