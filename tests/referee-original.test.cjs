const assert = require('node:assert/strict');
const test = require('node:test');
const React = require('react');
const { create, act } = require('react-test-renderer');
const { createLoader } = require('./load-workout-ui.cjs');

global.IS_REACT_ACT_ENVIRONMENT = true;

test('web reader embeds the official document at the checked page and provides a failure fallback', async () => {
  const loader = createLoader();
  const Reader = loader.load('src/components/RefereeOriginalReader.web.tsx').RefereeOriginalReader;
  const { REFEREE_SOURCE_URL } = loader.load('src/data/refereeLessons.ts');
  const { referencePage } = loader.load('src/refereeUtils.ts');
  let tree;
  await act(async () => { tree = create(React.createElement(Reader, { reference: '2-5', key: '2-5' })); });
  let frame = tree.root.findByType('iframe');
  assert.equal(frame.props.src, `${REFEREE_SOURCE_URL}#page=${referencePage('2-5')}&view=FitH`);
  assert.match(frame.props.title, /条款 2-5/);
  assert.equal(frame.props.referrerPolicy, 'no-referrer');
  assert.equal(frame.props.loading, 'lazy');
  await act(async () => { frame.props.onError(); });
  assert.equal(tree.root.findAllByType('iframe').length, 0);
  assert.match(tree.root.findByProps({ accessibilityRole: 'alert' }).children.join(''), /下方链接/);
  // Switching clauses remounts the reader and must not keep the last failure.
  await act(async () => { tree.update(React.createElement(Reader, { reference: '45-30', key: '45-30' })); });
  frame = tree.root.findByType('iframe');
  assert.equal(frame.props.src, `${REFEREE_SOURCE_URL}#page=${referencePage('45-30')}&view=FitH`);
  assert.match(frame.props.title, /条款 45-30/);
  await act(async () => tree.unmount());
});
