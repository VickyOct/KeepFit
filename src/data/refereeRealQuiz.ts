import type { ImageSourcePropType } from 'react-native';

import type { ScenarioQuestion } from '../refereeTypes';
import { refereeScenarioExams } from './refereeScenarioExams';

export type RefereeRealQuizQuestion = ScenarioQuestion & {
  animation: ImageSourcePropType;
  animationAlt: string;
  animationLabel: string;
  englishTerms: { chinese: string; english: string }[];
  signalSequence: string[];
  signalNote?: string;
};

type Visual = Pick<RefereeRealQuizQuestion, 'animation' | 'animationAlt' | 'animationLabel' | 'englishTerms' | 'signalSequence' | 'signalNote'> & {
  questionId: string;
};

// This list deliberately mixes topics instead of following lesson or article order.
// The rulings remain sourced from the validated integrated-scenario question bank.
const visuals: Visual[] = [
  {
    questionId: 'scenario-3-q3',
    animation: require('../../assets/referee/clear-path-contact.gif'),
    animationAlt: 'A11 向篮筐推进，B11 从后方追防并接触其手臂的循环示意动画',
    animationLabel: '转换进攻 · 后方追防接触',
    englishTerms: [
      { chinese: '破坏性犯规', english: 'Disruptive foul' },
      { chinese: '非法用手', english: 'Illegal use of hands' },
      { chinese: '投篮动作', english: 'Act of shooting' },
      { chinese: '前场掷球线', english: 'Frontcourt throw-in line' },
    ],
    signalSequence: [
      '吹哨，同时直臂举拳：Stop the clock for a foul。',
      '确认符合无人阻挡推进、从后或侧非法接触的标准后，做破坏性犯规手势：一臂举拳，再在面部高度示意数字 2。',
      '到记录台依次报告：B11 → Disruptive foul → 2 free throws。',
      '罚球后指示 A 在记录台对侧前场掷球线恢复，进攻钟 14 秒。',
    ],
    signalNote: '这里的打手属于 illegal use of hands，但最终分类和记录台报告是 disruptive foul。不要先把它报告成一次普通“非法用手”，再当成第二个犯规升级。',
  },
  {
    questionId: 'scenario-2-q4',
    animation: require('../../assets/referee/vertical-cylinder.gif'),
    animationAlt: '防守人保持垂直圆柱体起跳，进攻人进入其空间的循环示意动画',
    animationLabel: '投篮防守 · 垂直原则',
    englishTerms: [
      { chinese: '圆柱体原则', english: 'Cylinder principle' },
      { chinese: '垂直原则', english: 'Principle of verticality' },
      { chinese: '合法防守位置', english: 'Legal guarding position' },
      { chinese: '继续比赛', english: 'Play on' },
    ],
    signalSequence: ['不吹哨、不向记录台报告；保持观察并让比赛继续：Play on。'],
  },
  {
    questionId: 'scenario-1-q2',
    animation: require('../../assets/referee/ground-roll-travel.gif'),
    animationAlt: '持球队员倒地滑行后抱球主动翻滚的循环示意动画',
    animationLabel: '倒地持球 · 滑行与翻滚',
    englishTerms: [
      { chinese: '走步', english: 'Travelling' },
      { chinese: '惯性滑行', english: 'Sliding by momentum' },
      { chinese: '主动翻滚', english: 'Rolling' },
      { chinese: '最近地点掷球', english: 'Throw-in from the nearest place' },
    ],
    signalSequence: [
      '吹哨并直臂开掌停表：Stop the clock。',
      '做走步手势：Travelling（双拳旋转）。',
      '指向 B 的进攻方向，并在最近地点执行掷球。',
    ],
  },
  {
    questionId: 'scenario-4-q6',
    animation: require('../../assets/referee/endline-exchange.gif'),
    animationAlt: '进球后两名掷球队员在端线外移动并传递球的循环示意动画',
    animationLabel: '进球后 · 端线掷球配合',
    englishTerms: [
      { chinese: '端线掷球', english: 'Endline throw-in' },
      { chinese: '端线后传球', english: 'Pass behind the endline' },
      { chinese: '五秒限制', english: '5-second limit' },
      { chinese: '合法比赛', english: 'Legal play' },
    ],
    signalSequence: ['不吹哨；继续五秒计数，让合法的端线掷球继续：Play on。'],
  },
  {
    questionId: 'scenario-1-q5',
    animation: require('../../assets/referee/guarded-five-seconds.gif'),
    animationAlt: '持球队员被近距离合法防守，计数到五并短暂漏球的循环示意动画',
    animationLabel: '被严密防守 · 五秒计数',
    englishTerms: [
      { chinese: '严密防守', english: 'Closely guarded' },
      { chinese: '五秒违例', english: '5-second violation' },
      { chinese: '漏球', english: 'Fumble' },
      { chinese: '掷球', english: 'Throw-in' },
    ],
    signalSequence: [
      '吹哨并直臂开掌停表：Stop the clock。',
      '示意五秒违例：5-second violation。',
      '指向 B 的进攻方向，并执行掷球。',
    ],
  },
  {
    questionId: 'scenario-4-q1',
    animation: require('../../assets/referee/safe-rim-hang.gif'),
    animationAlt: '扣篮球员为避开篮下球员短暂抓圈后安全落地的循环示意动画',
    animationLabel: '篮下安全 · 短暂抓圈',
    englishTerms: [
      { chinese: '第 2 类技术犯规', english: 'Category 2 technical foul' },
      { chinese: '抓篮圈', english: 'Grasping the ring' },
      { chinese: '防止受伤', english: 'Prevent injury' },
      { chinese: '合法例外', english: 'Legal exception' },
    ],
    signalSequence: ['不吹技术犯规、不做 T 手势；确认球员安全落地后继续比赛：Play on。'],
  },
  {
    questionId: 'scenario-2-q10',
    animation: require('../../assets/referee/airborne-throw-in.gif'),
    animationAlt: '前场掷球时队员从前场起跳接球并持球落到后场的循环示意动画',
    animationLabel: '前场掷球 · 空中接球落后场',
    englishTerms: [
      { chinese: '回场违例', english: 'Ball returned to the backcourt' },
      { chinese: '球队控制', english: 'Team control' },
      { chinese: '掷球入界', english: 'Throw-in' },
      { chinese: '前场／后场', english: 'Frontcourt / backcourt' },
    ],
    signalSequence: [
      '吹哨并直臂开掌停表：Stop the clock。',
      '做回场违例手势：Ball returned to the backcourt。',
      '指向 B 的进攻方向，并执行相应掷球。',
    ],
  },
  {
    questionId: 'scenario-1-q9',
    animation: require('../../assets/referee/legal-slide-pass.gif'),
    animationAlt: '队员持球倒地因惯性滑行，停住后立即传球的循环示意动画',
    animationLabel: '倒地持球 · 惯性滑行后传球',
    englishTerms: [
      { chinese: '走步', english: 'Travelling' },
      { chinese: '惯性滑行', english: 'Sliding by momentum' },
      { chinese: '主动翻滚', english: 'Rolling' },
      { chinese: '继续比赛', english: 'Play on' },
    ],
    signalSequence: ['不吹哨、不做走步手势；确认没有主动翻滚或持球站起后继续比赛：Play on。'],
  },
  {
    questionId: 'scenario-4-q4',
    animation: require('../../assets/referee/shot-clock-release.gif'),
    animationAlt: '进攻钟剩零点二秒，接球队员在蜂鸣后才出手的循环示意动画',
    animationLabel: '掷球入界 · 进攻钟蜂鸣',
    englishTerms: [
      { chinese: '进攻计时违例', english: 'Shot-clock violation' },
      { chinese: '球离手', english: 'Ball released' },
      { chinese: '进攻钟信号', english: 'Shot-clock signal' },
      { chinese: '进球无效', english: 'No basket' },
    ],
    signalSequence: [
      '吹哨并直臂开掌停表：Stop the clock。',
      '示意进攻计时违例：Shot-clock violation，并明确进球无效：No basket。',
      '指向 B 的进攻方向，并执行掷球。',
    ],
  },
  {
    questionId: 'scenario-1-q3',
    animation: require('../../assets/referee/airborne-new-control.gif'),
    animationAlt: '队员从前场起跳，在空中建立新控制并落到后场的循环示意动画',
    animationLabel: '抢断传球 · 空中建立新控制',
    englishTerms: [
      { chinese: '球队控制', english: 'Team control' },
      { chinese: '空中新控制', english: 'New control while airborne' },
      { chinese: '前场／后场', english: 'Frontcourt / backcourt' },
      { chinese: '继续比赛', english: 'Play on' },
    ],
    signalSequence: ['不吹哨、不做回场手势；B 在空中建立新控制，可合法落到后场：Play on。'],
  },
];

const scenarioQuestions = refereeScenarioExams.flatMap((exam) => exam.questions);

export const refereeRealQuizQuestions: RefereeRealQuizQuestion[] = visuals.map((visual) => {
  const question = scenarioQuestions.find((item) => item.id === visual.questionId);
  if (!question) throw new Error(`真实判例题不存在：${visual.questionId}`);
  return { ...question, ...visual };
});

export function createRealQuizQueue(previousId: string | null = null, random: () => number = Math.random): string[] {
  const ids = refereeRealQuizQuestions.map((question) => question.id);
  for (let index = ids.length - 1; index > 0; index--) {
    const swapWith = Math.floor(random() * (index + 1));
    [ids[index], ids[swapWith]] = [ids[swapWith], ids[index]];
  }
  if (previousId && ids.length > 1 && ids[0] === previousId) {
    [ids[0], ids[1]] = [ids[1], ids[0]];
  }
  return ids;
}
