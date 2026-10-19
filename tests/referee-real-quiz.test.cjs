const assert = require('node:assert/strict');
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

  assert.equal(refereeRealQuizQuestions.length, 10);
  assert.equal(new Set(refereeRealQuizQuestions.map((question) => question.id)).size, 10);
  assert.equal(refereeRealQuizQuestions.filter((question) => question.whistle).length, 5);
  assert.equal(refereeRealQuizQuestions.filter((question) => !question.whistle).length, 5);
  assert.ok(refereeRealQuizQuestions.every((question) => question.animation.uri.endsWith('.gif')));
  assert.ok(refereeRealQuizQuestions.every((question) => question.englishTerms.length >= 4));
  assert.ok(refereeRealQuizQuestions.every((question) => question.signalSequence.length >= 1));

  const clearPath = refereeRealQuizQuestions.find((question) => question.id === 'scenario-3-q3');
  assert.ok(clearPath.englishTerms.some((term) => term.english === 'Disruptive foul'));
  assert.ok(clearPath.englishTerms.some((term) => term.english === 'Illegal use of hands'));
  assert.match(clearPath.signalSequence.join(' '), /B11.*Disruptive foul.*2 free throws/);
  assert.match(clearPath.signalNote, /最终分类.*disruptive foul/);

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
