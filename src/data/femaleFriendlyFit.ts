import type { Exercise, TechniqueReference } from '../workoutTypes';

export const FEMALE_FRIENDLY_LABEL = '女性友好候选';
export const FEMALE_FRIENDLY_EXPLANATION = '适配参考：按身体比例、关节活动和器械尺寸筛选。不是已证实更适合女性骨骼的排名；未标注也不代表不适合女性。';
export const FIT_CHECKED_AT = '2026-09-27';

export const FIT_REFERENCES: TechniqueReference[] = [
  {
    title: '器械选择与身体尺寸', publisher: 'NSCA', kind: '技术教学',
    url: 'https://www.nsca.com/certification/nsca-cpt/essentials-of-personal-training--3rd-edition/excerpts/types-of-resistance-training-equipment/',
    note: '支持按身高、肢段长度与动作能力选择器械；未评选女性专属动作。下方动作适配提示是基于这些原则的整理。',
  },
  {
    title: '站距、身体比例与深蹲活动范围（2018）', publisher: 'Journal of Human Kinetics', kind: '研究',
    url: 'https://pubmed.ncbi.nlm.nih.gov/29997725/',
    note: '研究提示应考虑身体比例和活动度；不能从平均骨盆差异推断所有女性都该宽站或练相扑式。',
  },
];

// Editorial candidates for individual fit, NOT evidence of female-specific superiority.
// Absence means no highlighted fit rationale, never a sex-based contraindication.
export const FEMALE_FRIENDLY_FITS: Record<string, NonNullable<Exercise['femaleFriendlyFit']>> = {
  'dumbbell-bench-press': { basis: '可自选轨迹', reason: '双手可分别选择间距和上臂路径，便于按肩宽、臂长调整。', check: '双脚需有稳定支撑；下放到肩部舒适位置，不照搬示范者的深度。' },
  'incline-dumbbell-press': { basis: '可自选轨迹', reason: '哑铃间距与手臂路径可随肩部结构和活动范围调整。', check: '凳背角度和肘部方向以个人控制能力为准；标签不代表上斜一定比平板更适合女性。' },
  'dumbbell-shoulder-press': { basis: '可自选轨迹', reason: '两侧手臂可以分别选择舒适的推举路径。', check: '要有足够的头顶活动范围；若必须明显挺腰才能推起，应调整幅度或换动作。' },
  'one-arm-dumbbell-row': { basis: '可自选轨迹', reason: '单臂路径和支撑脚位置可分别调整，便于适配臂长与躯干比例。', check: '训练凳高度须允许稳定支撑；避免为了够到凳子而扭转骨盆。' },
  'lateral-raise': { basis: '可自选轨迹', reason: '手臂可在舒适平面抬起，不受固定器械把手间距限制。', check: '高度和方向按肩部活动范围调整，不强求与示范图完全一致。' },
  'seated-dumbbell-curl': { basis: '可自选轨迹', reason: '两手可分别调整旋转角度，适应肘部与前臂的自然位置。', check: '凳面高度应让双脚踩稳；手腕保持自然，不强行旋转到不适位置。' },
  'standing-dumbbell-curl': { basis: '可自选轨迹', reason: '手距不被直杆固定，可让前臂沿自然路径屈伸。', check: '肘部保持相对稳定；手柄粗细要能握稳。' },
  'hammer-curl': { basis: '可自选轨迹', reason: '独立哑铃和中立握姿提供一种适配前臂、手腕位置的选择。', check: '中立握姿并非对每个人都更好；以手腕与肘部舒适为准。' },
  'rope-triceps-pushdown': { basis: '可自选轨迹', reason: '绳索两端可分别定位，便于调整手距与手腕方向。', check: '滑轮高度应允许上臂稳定；绳索末端大小需要握持舒适。' },
  'bodyweight-squat': { basis: '可调站位', reason: '可根据腿长比例和髋踝活动度试选站距、脚尖方向与深度。', check: '不因性别强制宽站或外八；选择脚掌稳定、髋膝可控的姿势。' },
  'dumbbell-lunge': { basis: '可调站位', reason: '步幅与左右脚间距可按腿长和平衡能力调整。', check: '先确认跨步、落地和回程都稳定；并非骨盆较宽就必须加大步幅。' },
  'push-up': { basis: '可调站位', reason: '手间距和肘部路径可按肩宽调整，也可提高支撑面改变负荷。', check: '支撑面要固定，手腕舒适；抬高支撑是难度调整，不是女性专用技术。' },
  'machine-chest-press': { basis: '需匹配器械', reason: '座椅和起始位置可调时，能为不同身高、臂长提供稳定支撑。', check: '必须能让双脚踩稳、把手位置合适；固定握距或起始位置不舒服时不要使用此标签作为推荐依据。' },
  'leg-press': { basis: '需匹配器械', reason: '靠背与踏板上的脚位可用于适配髋膝活动范围。', check: '先确认能安全够到踏板和解锁装置；下降时骨盆保持贴垫，不按性别规定脚位。' },
  'leg-extension': { basis: '需匹配器械', reason: '座椅、靠背和滚垫可调时，可适配大腿和小腿长度。', check: '膝关节需与转轴大致对齐，滚垫在脚踝上方；调不到位则不属于适配选择。' },
  'seated-leg-curl': { basis: '需匹配器械', reason: '靠背、压腿垫和滚垫的调节便于匹配不同腿长。', check: '膝关节对齐转轴，大腿能被稳定固定；不能因是坐姿就默认适合所有体型。' },
  'hip-abduction': { basis: '需匹配器械', reason: '可调起始开度的器械能让髋外展范围适应个人活动度。', check: '挡垫贴合、骨盆稳定；不是“女性骨盆宽就应该练外展”或纠正骨骼形态的依据。' },
  'hip-adduction': { basis: '需匹配器械', reason: '可调开腿范围有助于选择个人舒适的髋内收起点。', check: '不强行打开双腿；机器最小开度仍不舒服时应换动作。' },
  'barbell-hip-thrust': { basis: '需匹配器械', reason: '脚位、支撑高度和髋垫位置可以按躯干、腿长调整。', check: '凳子稳固且高度合适，杠铃垫在髋部而非腹部；练臀效果不等于女性骨骼专属优势。' },
  'seated-cable-row': { basis: '需匹配器械', reason: '坐位与脚部支撑位置可用于适配躯干和臂长。', check: '握住现有 V 型把手时肩腕需舒适，双脚能稳定踩住踏板；固定把手过窄时应换合适器材。' },
};

export function withFemaleFriendlyFit(exercise: Exercise): Exercise {
  const fit = FEMALE_FRIENDLY_FITS[exercise.id];
  return fit ? { ...exercise, femaleFriendlyFit: fit } : exercise;
}
