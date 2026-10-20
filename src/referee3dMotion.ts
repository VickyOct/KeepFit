// A deterministic teaching timeline: camera changes and seeking never alter the play.
export const VERTICAL_DURATION = 8;
export const VERTICAL_BEATS = [
  { time: 1.2, label: '站定' },
  { time: 3.25, label: '起跳' },
  { time: 4.1, label: '接触观察' },
  { time: 5.8, label: '落地' },
] as const;

export type Point3 = [number, number, number];
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t); };
const blend = (a: number, b: number, t: number) => a + (b - a) * ease(t);
const jump = (time: number, start: number, end: number, height: number) =>
  time <= start || time >= end ? 0 : height * Math.sin(Math.PI * (time - start) / (end - start));

export function verticalSceneAt(value: number) {
  const time = Number.isFinite(value) ? Math.max(0, Math.min(VERTICAL_DURATION, value)) : 0;
  const reset = ease((time - 6.6) / 1.4);
  const approach = blend(1.65, 3.22, (time - 0.8) / 3.1);
  const attacker: Point3 = [0.05, jump(time, 2.8, 5.4, 0.6), blend(approach, 1.65, reset)];
  // The defender's footprint stays fixed throughout the jump, including landing.
  const defender: Point3 = [0.15, jump(time, 3, 5.2, 0.48), 3.72];
  const arms = ease((time - 1.9) / 0.9) * (1 - reset);
  const shooting = ease((time - 2.6) / 1) * (1 - reset);
  const release = 4.1;
  let ball: Point3 = [attacker[0], attacker[1] + blend(1.45, 2.25, shooting), attacker[2] + 0.42];
  if (time >= release && time < 6.6) {
    const flight = clamp((time - release) / 1.3);
    ball = [blend(0.05, 0, flight), blend(2.85, 3.05, flight) + Math.sin(Math.PI * flight) * 1.05, blend(3.64, 5.425, flight)];
    if (time > 5.4) ball[1] = Math.max(0.14, 3.05 - 4.9 * (time - 5.4) ** 2);
  }
  const phase = time < 2.8 ? '站定与靠近' : time < 3.7 ? '起跳' : time < 4.6 ? '接触观察' : time < 6.6 ? '落地' : '回位';
  return { time, attacker, defender, arms, shooting, ball, phase, lean: Math.sin(Math.PI * clamp((time - 2.8) / 2.6)) * 0.04 };
}

export function advanceVerticalTime(time: number, deltaSeconds: number, speed: number) {
  const delta = Number.isFinite(deltaSeconds) ? Math.max(0, Math.min(deltaSeconds, 0.1)) : 0;
  return (verticalSceneAt(time).time + delta * speed) % VERTICAL_DURATION;
}
