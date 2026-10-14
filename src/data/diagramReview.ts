import type { TechniqueReference } from '../workoutTypes';
import { REFERENCES } from './exerciseReferences';

type Finding = {
  title: string;
  verdict: '基本合理' | '需要纠正' | '过度简化' | '名称不明确';
  explanation: string;
  exerciseIds: string[];
};
export type DiagramReview = {
  id: string;
  title: string;
  summary: string;
  findings: Finding[];
  references: TechniqueReference[];
};

export const DIAGRAM_REVIEWS: DiagramReview[] = [
  {
    id: 'legs', title: '照片 1 · 腿臀（原帖 3/3）',
    summary: '多数动作能练到腿臀，但后侧示意图不能准确表达所有主力肌群。',
    findings: [
      { title: '坐姿髋内收的位置', verdict: '需要纠正', explanation: '夹腿主要训练大腿内侧的髋内收肌群。把它写在大腿后侧而不区分肌肉，容易误认为是腘绳肌练习。', exerciseIds: ['hip-adduction', 'lying-leg-curl'] },
      { title: '臀推、外展、腿弯举', verdict: '基本合理', explanation: '臀推侧重臀大肌；髋外展涉及臀中肌、臀小肌等；俯卧腿弯举通过屈膝练腘绳肌。图中位置只能提示大致区域。', exerciseIds: ['barbell-hip-thrust', 'hip-abduction', 'lying-leg-curl'] },
      { title: '深蹲与各种硬拉', verdict: '过度简化', explanation: '深蹲涉及股四头肌、臀大肌和内收肌；罗马尼亚与直腿硬拉涉及腘绳肌、臀大肌及躯干稳定；相扑硬拉也有伸膝需求。它们都不是对应一小条肌肉的孤立动作。', exerciseIds: ['barbell-squat', 'wide-stance-squat', 'romanian-deadlift', 'stiff-leg-deadlift', 'sumo-deadlift'] },
      { title: '两种站姿提踵', verdict: '需要纠正', explanation: '史密斯与哑铃站姿提踵都涉及腓肠肌和比目鱼肌，不能按器械分给左右不同小腿肌肉。膝盖屈伸状态比器械名称更能解释侧重差异。', exerciseIds: ['smith-calf-raise', 'standing-dumbbell-calf-raise', 'seated-calf-raise'] },
      { title: '山羊挺身放在臀部', verdict: '过度简化', explanation: '髋铰链式背伸可练臀和腘绳肌，竖脊肌也参与稳定；做法改变会影响侧重，不应把它仅当作臀部或腰部的孤立动作。', exerciseIds: ['back-extension'] },
    ], references: [REFERENCES.adductors, REFERENCES.abductors, REFERENCES.calves],
  },
  {
    id: 'back', title: '照片 2 · 背部（原帖 2/3）',
    summary: '高位下拉的肌群标注是最明显的问题，其他复合动作也被画得过于局部。',
    findings: [
      { title: '高位下拉 ≠ 冈下肌、小圆肌专项', verdict: '需要纠正', explanation: '下拉主要涉及背阔肌、大圆肌和肘屈肌。冈下肌、小圆肌是肩袖外旋与稳定肌，不能因它们位于背面就把高位下拉视为对应的专项训练。', exerciseIds: ['lat-pulldown'] },
      { title: '面拉与坐姿划船', verdict: '过度简化', explanation: '面拉主要侧重后束和上背，带外旋时还涉及肩袖；坐姿划船涉及背阔肌、菱形肌、中斜方肌和肘屈肌，不只练图中标出的一个区域。', exerciseIds: ['face-pull', 'seated-cable-row'] },
      { title: '反手划船与山羊挺身', verdict: '过度简化', explanation: '反手划船不能隔离下背阔肌；背伸也不仅练竖脊肌。理解拉肘、肩胛运动与髋伸，比照着文字所在位置判断更有用。', exerciseIds: ['reverse-grip-barbell-row', 'back-extension'] },
      { title: '“提拉”是什么动作', verdict: '名称不明确', explanation: '仅凭名称无法区分直立划船、高拉等变式。下方按杠铃直立划船提供参考；它涉及三角肌和斜方肌，并非唯一的斜方肌训练方式。', exerciseIds: ['upright-row', 'dumbbell-shrug'] },
    ], references: [REFERENCES.pulldown, REFERENCES.shoulder],
  },
  {
    id: 'front', title: '照片 3 · 正面（原帖 1/3）',
    summary: '肩和手臂的对应大体可作提示，胸腹的“分区独练”容易误导。',
    findings: [
      { title: '上斜、平板、双杠的胸部划分', verdict: '过度简化', explanation: '角度可以改变胸肌区域侧重，但无法把胸肌切成三个互不参与的区域。卧推、双杠还涉及前肩与肱三头肌；肌电差异不等于长期增肌保证。', exerciseIds: ['incline-dumbbell-press', 'barbell-bench-press', 'parallel-bar-dip'] },
      { title: '卷腹与悬垂举腿的上、下腹划分', verdict: '需要纠正', explanation: '腹直肌并非两块独立的上腹、下腹肌。举腿还涉及髋屈肌；控制骨盆卷动与摆荡，比把动作分配给某一格腹肌更重要。', exerciseIds: ['crunch', 'hanging-leg-raise', 'reverse-crunch'] },
      { title: '耸肩、平举、弯举和臂屈伸', verdict: '基本合理', explanation: '耸肩偏上斜方肌，前平举偏三角肌前束，侧平举偏中束，弯举练肘屈肌，臂屈伸练肱三头肌。但这仍是简化对应；正握弯举不能代表全部前臂功能。', exerciseIds: ['dumbbell-shrug', 'dumbbell-front-raise', 'lateral-raise', 'dumbbell-shoulder-press', 'standing-dumbbell-curl', 'hammer-curl', 'reverse-barbell-curl', 'dumbbell-overhead-triceps-extension'] },
      { title: '腹侧的小字动作', verdict: '名称不明确', explanation: '图片分辨率下疑似“侧提膝/侧提胯”，不足以确定具体技术。下方另列哑铃侧屈供参考，不认定它就是图中动作，也不把练侧腹理解成局部减脂。', exerciseIds: ['dumbbell-side-bend'] },
    ], references: [REFERENCES.chest, REFERENCES.abs, REFERENCES.shoulder],
  },
];
