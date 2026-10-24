import type { ImageSourcePropType } from 'react-native';

import type { ScenarioQuestion } from '../refereeTypes';
import { refereeScenarioExams } from './refereeScenarioExams';

export type RefereeSignalId =
  | 'stop-clock' | 'stop-clock-foul' | 'two-points' | 'three-points' | 'cancel-score' | 'visible-count'
  | 'direction-of-play' | 'jump-ball' | 'travelling' | 'double-dribble' | 'five-seconds' | 'eight-seconds' | 'shot-clock'
  | 'backcourt' | 'deliberate-kick' | 'basket-interference' | 'number-1-5' | 'number-6-10' | 'number-11-15'
  | 'illegal-use-of-hands' | 'double-foul' | 'disruptive-foul' | 'flagrant-foul' | 'foul-no-free-throws'
  | 'two-free-throws' | 'three-free-throws';

export type RefereeSignal = {
  image: ImageSourcePropType;
  width: number;
  height: number;
  figure: string;
  english: string;
  chinese: string;
  alt: string;
};

// Crops of FIBA Official Basketball Rules 2026, Appendix A, made by scripts/extract-referee-signals.py.
export const refereeSignals: Record<RefereeSignalId, RefereeSignal> = {
  'stop-clock': { image: require('../../assets/referee/signals/stop-clock.png'), width: 461, height: 747, figure: '1', english: 'Stop the clock', chinese: '停表', alt: '裁判单臂上举，五指张开掌心向前' },
  'stop-clock-foul': { image: require('../../assets/referee/signals/stop-clock-foul.png'), width: 461, height: 792, figure: '2', english: 'Stop the clock for foul', chinese: '犯规停表', alt: '裁判单臂上举，握拳' },
  'two-points': { image: require('../../assets/referee/signals/two-points.png'), width: 461, height: 793, figure: '5', english: '2 points', chinese: '两分', alt: '裁判举起两根手指，手腕向下摆动一次' },
  'three-points': { image: require('../../assets/referee/signals/three-points.png'), width: 920, height: 846, figure: '6', english: '3 points', chinese: '三分（单臂＝出手，双臂＝有效）', alt: '裁判伸出三指：单臂上举表示三分出手，双臂上举表示三分有效' },
  'cancel-score': { image: require('../../assets/referee/signals/cancel-score.png'), width: 925, height: 794, figure: '11', english: 'Cancel score, cancel play', chinese: '取消得分', alt: '裁判双臂在胸前交叉后向两侧打开，剪刀式动作一次' },
  'visible-count': { image: require('../../assets/referee/signals/visible-count.png'), width: 925, height: 749, figure: '12', english: 'Visible count', chinese: '可见计数', alt: '裁判单臂平伸，掌心向下，边计数边横向摆动手掌' },
  'direction-of-play': { image: require('../../assets/referee/signals/direction-of-play.png'), width: 462, height: 952, figure: '15', english: 'Direction of play', chinese: '进攻方向', alt: '裁判单臂平举，手指指向进攻方向，手臂与边线平行' },
  'jump-ball': { image: require('../../assets/referee/signals/jump-ball.png'), width: 461, height: 959, figure: '16', english: 'Held ball / jump ball situation', chinese: '跳球情形', alt: '裁判双拇指向上，再按交替球权箭头指向进攻方向' },
  travelling: { image: require('../../assets/referee/signals/travelling.png'), width: 461, height: 740, figure: '17', english: 'Travelling', chinese: '走步', alt: '裁判双拳在胸前上下绕圈旋转' },
  'double-dribble': { image: require('../../assets/referee/signals/double-dribble.png'), width: 461, height: 854, figure: '18', english: 'Illegal dribble: double dribbling', chinese: '二次运球', alt: '裁判手掌向下，在身前上下做拍球动作' },
  'five-seconds': { image: require('../../assets/referee/signals/five-seconds.png'), width: 461, height: 749, figure: '21', english: '5 seconds', chinese: '五秒违例', alt: '裁判单手举起，伸出五指' },
  'eight-seconds': { image: require('../../assets/referee/signals/eight-seconds.png'), width: 462, height: 749, figure: '22', english: '8 seconds', chinese: '八秒违例', alt: '裁判双手举起，一手五指、一手三指，共示意八' },
  'shot-clock': { image: require('../../assets/referee/signals/shot-clock.png'), width: 461, height: 749, figure: '23', english: 'Shot clock', chinese: '进攻计时违例', alt: '裁判抬臂，手指触碰同侧肩部' },
  backcourt: { image: require('../../assets/referee/signals/backcourt.png'), width: 925, height: 749, figure: '24', english: 'Ball returned to backcourt', chinese: '回场违例', alt: '裁判手臂在身体前方左右摆动' },
  'deliberate-kick': { image: require('../../assets/referee/signals/deliberate-kick.png'), width: 461, height: 794, figure: '25', english: 'Deliberate kick', chinese: '故意踢球', alt: '裁判单手指向自己的脚' },
  'basket-interference': { image: require('../../assets/referee/signals/basket-interference.png'), width: 462, height: 899, figure: '26', english: 'Basket interference', chinese: '干扰投篮／篮筐干扰', alt: '裁判一手食指在另一手上方画圈' },
  'number-1-5': { image: require('../../assets/referee/signals/number-1-5.png'), width: 461, height: 798, figure: '28', english: 'No. 1 - 5', chinese: '号码 1–5：右手伸出对应手指', alt: '裁判右手举起，伸出与球员号码相同数目的手指' },
  'number-6-10': { image: require('../../assets/referee/signals/number-6-10.png'), width: 461, height: 903, figure: '29', english: 'No. 6 - 10', chinese: '号码 6：右手 5 指＋左手 1 指', alt: '裁判右手伸出五指、左手伸出手指报告球员号码；6 号为右手 5 指加左手 1 指' },
  'number-11-15': { image: require('../../assets/referee/signals/number-11-15.png'), width: 462, height: 903, figure: '30', english: 'No. 11 - 15', chinese: '号码 11：右拳＋左手 1 指', alt: '裁判右手握拳、左手伸出手指报告球员号码；11 号为右拳加左手 1 指' },
  'illegal-use-of-hands': { image: require('../../assets/referee/signals/illegal-use-of-hands.png'), width: 461, height: 790, figure: '41', english: 'Illegal use of hands', chinese: '非法用手', alt: '裁判一手在身前击打另一手的手腕' },
  'double-foul': { image: require('../../assets/referee/signals/double-foul.png'), width: 461, height: 782, figure: '52', english: 'Double foul', chinese: '双方犯规', alt: '裁判双手握拳举过头顶，左右交叉挥动' },
  'disruptive-foul': { image: require('../../assets/referee/signals/disruptive-foul.png'), width: 462, height: 843, figure: '54', english: 'Disruptive foul', chinese: '破坏性犯规', alt: '裁判一臂握拳上举，再落到面部高度示意数字 2' },
  'flagrant-foul': { image: require('../../assets/referee/signals/flagrant-foul.png'), width: 461, height: 738, figure: '55', english: 'Flagrant foul', chinese: '严重犯规', alt: '裁判举起双臂，一手在头顶上方握住另一手的手腕' },
  'foul-no-free-throws': { image: require('../../assets/referee/signals/foul-no-free-throws.png'), width: 365, height: 992, figure: '62', english: 'After foul without free throws', chinese: '犯规后无罚球：指示进攻方向', alt: '裁判单臂平举，与边线平行，指向获得球权一方的进攻方向' },
  'two-free-throws': { image: require('../../assets/referee/signals/two-free-throws.png'), width: 365, height: 789, figure: '65', english: '2 free throws', chinese: '两次罚球', alt: '裁判向记录台举起两根手指' },
  'three-free-throws': { image: require('../../assets/referee/signals/three-free-throws.png'), width: 365, height: 789, figure: '66', english: '3 free throws', chinese: '三次罚球', alt: '裁判向记录台举起三根手指' },
};

export type SignalStep = { text: string; signals?: RefereeSignalId[] };

export type RefereeRealQuizQuestion = ScenarioQuestion & {
  animation: ImageSourcePropType;
  animationAlt: string;
  animationLabel: string;
  englishTerms: { chinese: string; english: string }[];
  signalSequence: SignalStep[];
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
      { text: '吹哨，同时直臂举拳：Stop the clock for a foul。', signals: ['stop-clock-foul'] },
      { text: '确认符合无人阻挡推进、从后或侧非法接触的标准后，做破坏性犯规手势：一臂举拳，再在面部高度示意数字 2。', signals: ['disruptive-foul'] },
      { text: '到记录台依次报告：B11 → Disruptive foul → 2 free throws。', signals: ['number-11-15', 'disruptive-foul', 'two-free-throws'] },
      { text: '罚球后指示 A 在记录台对侧前场掷球线恢复，进攻钟 14 秒。' },
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
    signalSequence: [{ text: '不吹哨、不向记录台报告；保持观察并让比赛继续：Play on。' }],
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
      { text: '吹哨并直臂开掌停表：Stop the clock。', signals: ['stop-clock'] },
      { text: '做走步手势：Travelling（双拳旋转）。', signals: ['travelling'] },
      { text: '指向 B 的进攻方向，并在最近地点执行掷球。', signals: ['direction-of-play'] },
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
    signalSequence: [{ text: '不吹哨；继续五秒可见计数（Visible count），让合法的端线掷球继续：Play on。', signals: ['visible-count'] }],
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
      { text: '吹哨并直臂开掌停表：Stop the clock。', signals: ['stop-clock'] },
      { text: '示意五秒违例：5-second violation。', signals: ['five-seconds'] },
      { text: '指向 B 的进攻方向，并执行掷球。', signals: ['direction-of-play'] },
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
    signalSequence: [{ text: '不吹技术犯规、不做 T 手势；确认球员安全落地后继续比赛：Play on。' }],
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
      { text: '吹哨并直臂开掌停表：Stop the clock。', signals: ['stop-clock'] },
      { text: '做回场违例手势：Ball returned to the backcourt。', signals: ['backcourt'] },
      { text: '指向 B 的进攻方向，并执行相应掷球。', signals: ['direction-of-play'] },
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
    signalSequence: [{ text: '不吹哨、不做走步手势；确认没有主动翻滚或持球站起后继续比赛：Play on。' }],
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
      { text: '吹哨并直臂开掌停表：Stop the clock。', signals: ['stop-clock'] },
      { text: '示意进攻计时违例：Shot-clock violation，并明确进球无效：No basket。', signals: ['shot-clock', 'cancel-score'] },
      { text: '指向 B 的进攻方向，并执行掷球。', signals: ['direction-of-play'] },
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
    signalSequence: [{ text: '不吹哨、不做回场手势；B 在空中建立新控制，可合法落到后场：Play on。' }],
  },
  {
    questionId: 'scenario-2-q3',
    animation: require('../../assets/referee/eight-second-pass.gif'),
    animationAlt: 'A 在后场推进，八秒计数届满时传球仍在飞向前场的循环示意动画',
    animationLabel: '后场推进 · 八秒计数',
    englishTerms: [
      { chinese: '八秒违例', english: '8-second violation' },
      { chinese: '后场／前场', english: 'Backcourt / frontcourt' },
      { chinese: '空中传球', english: 'Pass in the air' },
      { chinese: '中线', english: 'Centre line' },
    ],
    signalSequence: [
      { text: '吹哨并直臂开掌停表：Stop the clock。', signals: ['stop-clock'] },
      { text: '示意八秒违例：8 seconds（双手共伸出八指）。', signals: ['eight-seconds'] },
      { text: '指向 B 的进攻方向；B 在其前场靠近中线处掷球，进攻钟 14 秒。', signals: ['direction-of-play'] },
    ],
  },
  {
    questionId: 'scenario-2-q5',
    animation: require('../../assets/referee/tap-in-three.gif'),
    animationAlt: 'A2 在三分区出手，球在上升途中被两分区的 A7 拍到后入篮的循环示意动画',
    animationLabel: '三分出手 · 队友上升中拍球',
    englishTerms: [
      { chinese: '三分投篮区域', english: '3-point field goal area' },
      { chinese: '合法触球', english: 'Legal touch' },
      { chinese: '进球分值', english: 'Value of the goal' },
      { chinese: '计三分', english: '3 points' },
    ],
    signalSequence: [
      { text: '不吹违例哨；A2 出手时单臂三指上举示意三分出手，球入篮后改为双臂上举示意三分有效：3 points。', signals: ['three-points'] },
    ],
    signalNote: '分值看原出手位置，不看 A7 拍球时站在哪里。',
  },
  {
    questionId: 'scenario-5-q3',
    animation: require('../../assets/referee/rim-grab-interference.gif'),
    animationAlt: 'A 的三分投篮仍在篮圈上时，B8 抓住篮圈的循环示意动画',
    animationLabel: '球在篮圈上 · 防守抓圈',
    englishTerms: [
      { chinese: '篮筐干扰', english: 'Basket interference' },
      { chinese: '有入篮机会', english: 'Possibility to enter the basket' },
      { chinese: '判给得分', english: 'Points awarded' },
      { chinese: '计三分', english: '3 points' },
    ],
    signalSequence: [
      { text: '吹哨并直臂开掌停表：Stop the clock。', signals: ['stop-clock'] },
      { text: '示意篮筐干扰：Basket interference（一手食指在另一手上方画圈）。', signals: ['basket-interference'] },
      { text: '判给 A 三分：3 points（双臂三指上举）。', signals: ['three-points'] },
      { text: '按投篮得分后的方式恢复，由 B 在端线后掷球。' },
    ],
    signalNote: '不要把这次抓圈当成普通悬挂的技术犯规；球在篮圈上时，抓圈就是干扰，按原三分计分。',
  },
  {
    questionId: 'scenario-1-q6',
    animation: require('../../assets/referee/buzzer-rebound.gif'),
    animationAlt: 'A 的投篮在进攻钟蜂鸣前出手、只碰篮板，B2 在蜂鸣后立即接住篮板球的循环示意动画',
    animationLabel: '进攻钟蜂鸣 · 立即抢到篮板',
    englishTerms: [
      { chinese: '进攻钟信号', english: 'Shot-clock signal' },
      { chinese: '未碰篮圈', english: 'Ball fails to touch the ring' },
      { chinese: '立即且清楚的控制', english: 'Immediate and clear control' },
      { chinese: '继续比赛', english: 'Play on' },
    ],
    signalSequence: [{ text: '不吹哨；忽略这次进攻钟蜂鸣，让 B 的新控制继续：Play on。' }],
  },
  {
    questionId: 'scenario-3-q5',
    animation: require('../../assets/referee/closeout-landing.gif'),
    animationAlt: 'A6 三分出手后仍在空中，B6 冲进其落地区域，A6 落地踩到 B6 脚的循环示意动画',
    animationLabel: '三分防守 · 冲进落地区域',
    englishTerms: [
      { chinese: '严重犯规', english: 'Flagrant foul' },
      { chinese: '扑防', english: 'Close-out' },
      { chinese: '落地区域', english: 'Landing space' },
      { chinese: '三次罚球', english: '3 free throws' },
    ],
    signalSequence: [
      { text: '吹哨，同时直臂举拳：Stop the clock for a foul。', signals: ['stop-clock-foul'] },
      { text: '做严重犯规手势：Flagrant foul（双臂上举，一手握住另一手腕）。', signals: ['flagrant-foul'] },
      { text: '到记录台依次报告：B6 → Flagrant foul → 3 free throws。', signals: ['number-6-10', 'flagrant-foul', 'three-free-throws'] },
      { text: '罚球后由 A 在前场掷球恢复，并核对 B6 的严重犯规累计。' },
    ],
  },
  {
    questionId: 'scenario-2-q2',
    animation: require('../../assets/referee/straddle-pass-back.gif'),
    animationAlt: 'A6 双脚跨在中线两侧接球后，马上回传后场 A9 的循环示意动画',
    animationLabel: '后场推进 · 跨骑中线回传',
    englishTerms: [
      { chinese: '跨骑中线', english: 'Straddling the centre line' },
      { chinese: '回场违例', english: 'Ball returned to the backcourt' },
      { chinese: '八秒计数', english: '8-second count' },
      { chinese: '继续比赛', english: 'Play on' },
    ],
    signalSequence: [{ text: '不吹哨、不做回场手势；八秒计数不重置，从第 5 秒接着数（只剩三秒）：Play on。' }],
  },
  {
    questionId: 'scenario-4-q2',
    animation: require('../../assets/referee/deliberate-kick.gif'),
    animationAlt: 'A 前场传球时，B2 主动伸脚把球踢走的循环示意动画',
    animationLabel: '传球路线 · 主动伸脚',
    englishTerms: [
      { chinese: '故意踢球', english: 'Deliberate kick' },
      { chinese: '偶然碰到脚', english: 'Accidental contact with the foot' },
      { chinese: '保留进攻时间', english: 'Shot clock continues' },
      { chinese: '前场掷球', english: 'Frontcourt throw-in' },
    ],
    signalSequence: [
      { text: '吹哨并直臂开掌停表：Stop the clock。', signals: ['stop-clock'] },
      { text: '示意故意踢球：Deliberate kick（指向脚）。', signals: ['deliberate-kick'] },
      { text: '指向 A 的进攻方向；A 在前场相应地点掷球，进攻钟保留 16 秒。', signals: ['direction-of-play'] },
    ],
  },
  {
    questionId: 'scenario-3-q10',
    animation: require('../../assets/referee/semicircle-drive.gif'),
    animationAlt: 'A3 控球突破跨过半圆线，空中传球后与一脚踩在半圆线上的 B4 接触的循环示意动画',
    animationLabel: '突破上篮 · 无撞人半圆区',
    englishTerms: [
      { chinese: '无撞人半圆区', english: 'No-charge semicircle' },
      { chinese: '撞人', english: 'Charging' },
      { chinese: '合法防守位置', english: 'Legal guarding position' },
      { chinese: '继续比赛', english: 'Play on' },
    ],
    signalSequence: [{ text: '不吹哨、不做撞人手势；半圆线属于半圆区，本题情形继续比赛：Play on。' }],
  },
  {
    questionId: 'scenario-2-q8',
    animation: require('../../assets/referee/wedged-ball.gif'),
    animationAlt: 'A 的投篮把球夹在篮圈与篮板之间的循环示意动画',
    animationLabel: '投篮夹球 · 篮圈与篮板之间',
    englishTerms: [
      { chinese: '跳球情形', english: 'Jump ball situation' },
      { chinese: '交替球权', english: 'Alternating possession' },
      { chinese: '球夹在篮圈与篮板之间', english: 'Ball lodged between ring and backboard' },
      { chinese: '进攻钟 14 秒', english: '14-second shot clock' },
    ],
    signalSequence: [
      { text: '吹哨并直臂开掌停表：Stop the clock。', signals: ['stop-clock'] },
      { text: '做跳球情形手势：Held ball / jump ball situation（双拇指向上），再按交替球权箭头指向 A 的进攻方向。', signals: ['jump-ball'] },
      { text: 'A 以交替球权掷球，进攻钟 14 秒。' },
    ],
  },
  {
    questionId: 'scenario-5-q5',
    animation: require('../../assets/referee/free-throw-tip.gif'),
    animationAlt: 'A 最后一罚碰篮圈未进，A8 合法把球拍进的循环示意动画',
    animationLabel: '最后一罚 · 碰圈后补进',
    englishTerms: [
      { chinese: '最后一次罚球', english: 'Last free throw' },
      { chinese: '补篮', english: 'Tip-in' },
      { chinese: '两分进球', english: '2-point field goal' },
      { chinese: '罚球违例', english: 'Free-throw violation' },
    ],
    signalSequence: [
      { text: '不吹违例哨；向记录台示意两分：2 points（两指、手腕下摆），避免被误记为罚球 1 分。', signals: ['two-points'] },
    ],
  },
  {
    questionId: 'scenario-1-q1',
    animation: require('../../assets/referee/fingertip-deflection.gif'),
    animationAlt: 'A 传球时 B4 只用指尖拨偏，A8 随即收回球的循环示意动画',
    animationLabel: '传球路线 · 指尖拨球',
    englishTerms: [
      { chinese: '球队控制', english: 'Team control' },
      { chinese: '拨球', english: 'Deflection' },
      { chinese: '进攻钟继续', english: 'Shot clock continues' },
      { chinese: '继续比赛', english: 'Play on' },
    ],
    signalSequence: [{ text: '不吹哨；B4 只拨到球、没有控制，A 的进攻计时继续：Play on。' }],
  },
  {
    questionId: 'scenario-1-q4',
    animation: require('../../assets/referee/backboard-toss.gif'),
    animationAlt: 'A5 结束运球后把球抛向篮板再接回，随后又开始运球的循环示意动画',
    animationLabel: '结束运球 · 抛板接回再运',
    englishTerms: [
      { chinese: '二次运球', english: 'Double dribble' },
      { chinese: '结束运球', english: 'End of dribble' },
      { chinese: '抛篮板', english: 'Throwing the ball against the backboard' },
      { chinese: '最近地点掷球', english: 'Throw-in from the nearest place' },
    ],
    signalSequence: [
      { text: '吹哨并直臂开掌停表：Stop the clock。', signals: ['stop-clock'] },
      { text: '做二次运球手势：Illegal dribble: double dribbling（手掌上下拍）。', signals: ['double-dribble'] },
      { text: '指向 B 的进攻方向，并在最近地点执行掷球。', signals: ['direction-of-play'] },
    ],
  },
  {
    questionId: 'scenario-1-q10',
    animation: require('../../assets/referee/double-foul-contact.gif'),
    animationAlt: 'A1 运球时与 B1 几乎同时互相非法接触的循环示意动画',
    animationLabel: '持球突破 · 双方互相犯规',
    englishTerms: [
      { chinese: '双方犯规', english: 'Double foul' },
      { chinese: '近乎同时', english: 'Approximately the same time' },
      { chinese: '个人犯规', english: 'Personal foul' },
      { chinese: '剩余进攻时间', english: 'Remaining shot-clock time' },
    ],
    signalSequence: [
      { text: '吹哨，同时直臂举拳：Stop the clock for a foul。', signals: ['stop-clock-foul'] },
      { text: '做双方犯规手势：Double foul（双拳举过头顶交叉挥动）。', signals: ['double-foul'] },
      { text: '到记录台分别报告 A1 和 B1 的犯规（号码 1 都是右手伸 1 指）。', signals: ['number-1-5'] },
      { text: '指向 A 的进攻方向；A 在最近地点掷球，进攻钟仍为 7 秒。', signals: ['direction-of-play'] },
    ],
  },
  {
    questionId: 'scenario-2-q1',
    animation: require('../../assets/referee/ap-throw-in-count.gif'),
    animationAlt: 'A 执行交替球权掷球，掷球队员持球数到五秒仍未传出的循环示意动画',
    animationLabel: '交替球权 · 掷球五秒',
    englishTerms: [
      { chinese: '交替球权', english: 'Alternating possession' },
      { chinese: '掷球违例', english: 'Throw-in violation' },
      { chinese: '五秒限制', english: '5-second limit' },
      { chinese: '箭头转向', english: 'Arrow reversed' },
    ],
    signalSequence: [
      { text: '吹哨并直臂开掌停表：Stop the clock。', signals: ['stop-clock'] },
      { text: '示意五秒违例：5 seconds（伸出五指）。', signals: ['five-seconds'] },
      { text: '指向 B 的进攻方向；B 在原处掷球，交替球权箭头立即转向 B。', signals: ['direction-of-play'] },
    ],
  },
  {
    questionId: 'scenario-2-q7',
    animation: require('../../assets/referee/airball-recovery.gif'),
    animationAlt: 'A10 停球后投篮没碰篮圈，自己抢回球再运球的循环示意动画',
    animationLabel: '投篮不中 · 自己抢回再运',
    englishTerms: [
      { chinese: '投篮未碰篮圈', english: 'Shot fails to touch the ring' },
      { chinese: '二次运球', english: 'Double dribble' },
      { chinese: '新的运球', english: 'New dribble' },
      { chinese: '进攻钟不重置', english: 'Shot clock not reset' },
    ],
    signalSequence: [{ text: '不吹哨、不做二次运球手势；真实投篮后自己抢回可以再运球，进攻钟不因这次没碰圈的投篮重置：Play on。' }],
  },
  {
    questionId: 'scenario-2-q9',
    animation: require('../../assets/referee/handed-throw-in.gif'),
    animationAlt: 'A5 掷球时把球直接递到场内 A6 手中，两人交接握球的循环示意动画',
    animationLabel: '掷球入界 · 直接递球',
    englishTerms: [
      { chinese: '掷球入界', english: 'Throw-in' },
      { chinese: '离手传球', english: 'Release the ball' },
      { chinese: '直接递交', english: 'Handing the ball' },
      { chinese: '掷球违例', english: 'Throw-in violation' },
    ],
    signalSequence: [
      { text: '吹哨并直臂开掌停表：Stop the clock。', signals: ['stop-clock'] },
      { text: '指向 B 的进攻方向，B 在相应地点掷球。', signals: ['direction-of-play'] },
    ],
    signalNote: '附录 A 没有专门的“递球”违例手势：停表后直接指示 B 的进攻方向即可。',
  },
  {
    questionId: 'scenario-3-q2',
    animation: require('../../assets/referee/transition-reach.gif'),
    animationAlt: 'A3 快攻推进，B3 正面抢球却打到其前臂，前方还有防守人 B5 的循环示意动画',
    animationLabel: '转换进攻 · 抢球打到前臂',
    englishTerms: [
      { chinese: '个人犯规', english: 'Personal foul' },
      { chinese: '非法用手', english: 'Illegal use of hands' },
      { chinese: '直接争球', english: 'Legitimate attempt to play the ball' },
      { chinese: '破坏性犯规', english: 'Disruptive foul' },
    ],
    signalSequence: [
      { text: '吹哨，同时直臂举拳：Stop the clock for a foul。', signals: ['stop-clock-foul'] },
      { text: '到记录台依次报告：B3 → Illegal use of hands → 无罚球，指向 A 的进攻方向。', signals: ['number-1-5', 'illegal-use-of-hands', 'foul-no-free-throws'] },
      { text: 'A 在前场最近地点掷球，进攻钟从 10 秒升到 14 秒。' },
    ],
    signalNote: '和「后方追防接触」那题对比：这里 B3 是正面直接抢球，前方也还有防守人，所以只是普通个人犯规，不升级为破坏性犯规。',
  },
  {
    questionId: 'scenario-3-q4',
    animation: require('../../assets/referee/late-clock-hold.gif'),
    animationAlt: '第四节最后 8 秒，B 为停表拉住正在两分投篮的 A4 衣服的循环示意动画',
    animationLabel: '比赛末段 · 拉住投篮者',
    englishTerms: [
      { chinese: '破坏性犯规', english: 'Disruptive foul' },
      { chinese: '故意停表', english: 'Stopping the game clock' },
      { chinese: '投篮动作', english: 'Act of shooting' },
      { chinese: '两次罚球', english: '2 free throws' },
    ],
    signalSequence: [
      { text: '吹哨，同时直臂举拳：Stop the clock for a foul。', signals: ['stop-clock-foul'] },
      { text: '做破坏性犯规手势：一臂举拳，再在面部高度示意数字 2。', signals: ['disruptive-foul'] },
      { text: '到记录台报告：犯规队员号码 → Disruptive foul → 2 free throws。', signals: ['disruptive-foul', 'two-free-throws'] },
      { text: '罚球后由 A 在前场掷球；比赛钟仍只剩 8 秒。' },
    ],
    signalNote: '末段不争球、故意停表是独立的破坏性犯规标准，即使 A4 已开始投篮也适用。',
  },
  {
    questionId: 'scenario-3-q6',
    animation: require('../../assets/referee/offensive-rebound-14.gif'),
    animationAlt: '比赛钟剩 18 秒，A 的投篮碰篮圈后 A9 抢到进攻篮板，进攻钟改为显示 14 秒的循环示意动画',
    animationLabel: '最后 18 秒 · 进攻篮板',
    englishTerms: [
      { chinese: '进攻钟', english: 'Shot clock' },
      { chinese: '进攻篮板', english: 'Offensive rebound' },
      { chinese: '碰篮圈', english: 'Ball touches the ring' },
      { chinese: '继续比赛', english: 'Play on' },
    ],
    signalSequence: [{ text: '不吹哨；碰圈后 A 再控制，进攻钟应显示新的 14 秒并运行：Play on。' }],
  },
  {
    questionId: 'scenario-4-q3',
    animation: require('../../assets/referee/buzzer-catch-shoot.gif'),
    animationAlt: '本节剩 0.3 秒，A7 接掷球后立即两分投篮，球在结束信号前离手入篮的循环示意动画',
    animationLabel: '0.3 秒 · 接球投篮',
    englishTerms: [
      { chinese: '0.3 秒', english: '0.3 seconds' },
      { chinese: '接球投篮', english: 'Catch and shoot' },
      { chinese: '结束信号', english: 'End-of-period signal' },
      { chinese: '计两分', english: '2 points' },
    ],
    signalSequence: [
      { text: '不吹违例哨；球在结束信号前已离手，示意两分有效：2 points（两指、手腕下摆）。', signals: ['two-points'] },
    ],
  },
  {
    questionId: 'scenario-5-q4',
    animation: require('../../assets/referee/offensive-board-slap.gif'),
    animationAlt: 'A 的两分投篮仍在篮圈上时，A9 拍了篮板、球随后落入篮筐的循环示意动画',
    animationLabel: '球在篮圈上 · 进攻方拍篮板',
    englishTerms: [
      { chinese: '篮筐干扰', english: 'Basket interference' },
      { chinese: '进攻方干扰', english: 'Offensive interference' },
      { chinese: '进球无效', english: 'No basket' },
      { chinese: '最近地点掷球', english: 'Throw-in from the nearest place' },
    ],
    signalSequence: [
      { text: '吹哨并直臂开掌停表：Stop the clock。', signals: ['stop-clock'] },
      { text: '示意篮筐干扰：Basket interference（一手食指在另一手上方画圈）。', signals: ['basket-interference'] },
      { text: '示意进球无效：Cancel score（双臂在胸前交叉后打开）。', signals: ['cancel-score'] },
      { text: '指向 B 的进攻方向，B 在相应最近地点掷球。', signals: ['direction-of-play'] },
    ],
    signalNote: '和「防守抓圈」那题对比：同样是球在篮圈上时碰篮筐，防守方干扰判给得分，进攻方干扰则取消得分。',
  },
  {
    questionId: 'scenario-5-q6',
    animation: require('../../assets/referee/expired-held-ball.gif'),
    animationAlt: 'A6 持球时进攻钟先到零，之后 B6 才上来形成争球的循环示意动画',
    animationLabel: '进攻钟到零 · 随后争球',
    englishTerms: [
      { chinese: '进攻计时违例', english: 'Shot-clock violation' },
      { chinese: '争球', english: 'Held ball' },
      { chinese: '交替球权', english: 'Alternating possession' },
      { chinese: '先后顺序', english: 'Order of events' },
    ],
    signalSequence: [
      { text: '吹哨并直臂开掌停表：Stop the clock。', signals: ['stop-clock'] },
      { text: '示意进攻计时违例：Shot clock（手指触肩）。', signals: ['shot-clock'] },
      { text: '指向 B 的进攻方向，B 掷球。', signals: ['direction-of-play'] },
    ],
    signalNote: '不要做争球手势：违例发生在争球之前，A 的箭头救不回这次球权。',
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
