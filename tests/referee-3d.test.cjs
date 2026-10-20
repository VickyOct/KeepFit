const assert = require('node:assert/strict');
const test = require('node:test');
const { createLoader } = require('./load-workout-ui.cjs');

test('verticality scene preserves the defending footprint through takeoff, flight and landing', () => {
  const { verticalSceneAt, VERTICAL_DURATION, VERTICAL_BEATS } = createLoader().load('src/referee3dMotion.ts');
  let jumped = false;
  for (let i = 0; i <= VERTICAL_DURATION * 60; i++) {
    const frame = verticalSceneAt(i / 60);
    assert.equal(frame.defender[0], 0.15);
    assert.equal(frame.defender[2], 3.72);
    assert.ok(frame.defender[1] >= 0 && frame.defender[1] <= 0.48);
    assert.ok([...frame.attacker, ...frame.defender, ...frame.ball].every(Number.isFinite));
    assert.ok(frame.arms >= 0 && frame.arms <= 1);
    jumped ||= frame.defender[1] > 0.4;
  }
  assert.ok(jumped);
  assert.equal(verticalSceneAt(0).defender[1], 0);
  assert.equal(verticalSceneAt(5.8).defender[1], 0);
  assert.deepEqual(verticalSceneAt(0).attacker, verticalSceneAt(VERTICAL_DURATION).attacker);
  assert.ok(VERTICAL_BEATS.every((beat) => beat.time >= 0 && beat.time <= VERTICAL_DURATION));
  assert.equal(verticalSceneAt(4.1).phase, '接触观察');
  assert.equal(verticalSceneAt(4.1).arms, 1);
});

test('seeking and slow playback use the same timeline and resume without a hidden-tab jump', () => {
  const { verticalSceneAt, advanceVerticalTime, VERTICAL_DURATION } = createLoader().load('src/referee3dMotion.ts');
  const contact = verticalSceneAt(4.1);
  verticalSceneAt(0); verticalSceneAt(7);
  assert.deepEqual(verticalSceneAt(4.1), contact);
  assert.equal(verticalSceneAt(NaN).time, 0);
  assert.equal(verticalSceneAt(-4).time, 0);
  assert.equal(verticalSceneAt(100).time, VERTICAL_DURATION);
  assert.equal(advanceVerticalTime(1, 0.1, 0.5), 1.05);
  assert.equal(advanceVerticalTime(1, 0, 1), 1);
  assert.equal(advanceVerticalTime(1, 120, 1), 1.1);
  assert.equal(advanceVerticalTime(1, -1, 1), 1);
  assert.ok(advanceVerticalTime(7.99, 0.1, 1) < 0.1);
});
