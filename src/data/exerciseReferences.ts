import type { Exercise, TechniqueReference } from '../workoutTypes';

export const REFERENCE_CHECKED_AT = '2026-09-25';
export const exerciseSource = (id: string) =>
  `https://github.com/yuhonas/free-exercise-db/blob/a859101d633a01c4a1a920d6a8ce41dabba0705f/exercises/${id}.json`;

export const REFERENCES = {
  pulldown: { title: 'Seated Lat Pulldown', publisher: 'ACE', kind: '技术教学', url: 'https://www.acefitness.org/resources/everyone/exercise-library/158/seated-lat-pulldown/' },
  shoulder: { title: '肩关节稳定与肩袖功能', publisher: 'ACE', kind: '解剖说明', url: 'https://www.acefitness.org/certifiednewsarticle/2660/a-commonsense-approach-to-addressing-shoulder-instability/' },
  adductors: { title: 'Muscles That Move the Leg', publisher: 'ACE', kind: '解剖说明', url: 'https://www.acefitness.org/fitness-certifications/ace-answers/exam-preparation-blog/3594/muscles-that-move-the-leg/' },
  abductors: { title: 'Strengthening Your Hips', publisher: 'ACE', kind: '解剖说明', url: 'https://www.acefitness.org/resources/everyone/blog/7335/enhance-your-running-game-by-strengthening-your-hips/' },
  abs: { title: 'Crunch Time: Training the Abs', publisher: 'ACE', kind: '技术教学', url: 'https://www.acefitness.org/resources/pros/expert-articles/8989/crunch-time-an-evidence-based-approach-to-training-the-abs/' },
  chest: { title: '卧推角度与胸大肌区域募集（2022）', publisher: 'Journal of Electromyography and Kinesiology', kind: '研究', url: 'https://pubmed.ncbi.nlm.nih.gov/36334406/', note: '小样本急性肌电与超声研究；不能直接推断长期增肌效果，也不是哑铃卧推操作教程。' },
  calves: { title: '站姿与坐姿提踵训练比较（2023）', publisher: 'Frontiers in Physiology', kind: '研究', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10753835/', note: '比较膝伸直与屈曲的训练效果，不能据此把两种站姿器械分配给不同小腿肌肉。' },
} satisfies Record<string, TechniqueReference>;

const extras: Record<string, TechniqueReference[]> = {
  'lat-pulldown': [REFERENCES.pulldown, REFERENCES.shoulder],
  'face-pull': [REFERENCES.shoulder],
  'dumbbell-bench-press': [REFERENCES.chest],
  'barbell-bench-press': [REFERENCES.chest],
  'incline-dumbbell-press': [REFERENCES.chest],
  'hip-adduction': [REFERENCES.adductors],
  'hip-abduction': [REFERENCES.abductors],
  'crunch': [REFERENCES.abs],
  'reverse-crunch': [REFERENCES.abs],
  'hanging-leg-raise': [REFERENCES.abs],
  'seated-calf-raise': [REFERENCES.calves],
  'smith-calf-raise': [REFERENCES.calves],
  'standing-dumbbell-calf-raise': [REFERENCES.calves],
};

const notes: Record<string, string> = {
  'lat-pulldown': '主要是背阔肌、大圆肌和肘屈肌参与。冈下肌、小圆肌属于肩袖，参与稳定和外旋；不能把高位下拉当作这两块肌肉的专项练习。',
  'face-pull': '主要涉及三角肌后束、上背；带可控外旋的变式也涉及肩袖。图中只写“三角肌”不够准确，更不是整个肩部的完整训练。',
  'seated-cable-row': '背阔肌、菱形肌、中斜方肌及肱二头肌共同参与；握法和肘部路径会改变侧重，不能只标为斜方肌。',
  'romanian-deadlift': '髋伸动作，腘绳肌与臀大肌共同发力，竖脊肌稳定躯干；不是只练臀部的动作。',
  'crunch': '腹直肌是一条连续肌肉，动作可有区域侧重，但不能把卷腹理解成只练“上腹”。',
  'reverse-crunch': '重点是骨盆向胸廓卷起；腹直肌整体参与，不是隔离一块独立的“下腹肌”。',
  'seated-calf-raise': '屈膝让跨过膝关节的腓肠肌处于较短位置，通常更偏重比目鱼肌；不代表腓肠肌完全不参与。',
  'dumbbell-bench-press': '胸大肌、前三角肌和肱三头肌共同参与；平板卧推不能隔离图中画出的“中胸”。',
  'barbell-bench-press': '胸大肌、前三角肌和肱三头肌共同参与；平板卧推不能隔离图中画出的“中胸”。',
  'dumbbell-shoulder-press': '以三角肌前束、中束及肱三头肌为主，不是只练某一条肩部肌肉。',
  'lateral-raise': '主要侧重三角肌中束；肩胛也会自然向上转动，不需要把肩胛全程强压向下。',
  'lying-leg-curl': '通过屈膝训练大腿后侧腘绳肌；与髋内收机夹腿的功能不同。',
  'hammer-curl': '肱肌、肱桡肌和肱二头肌共同参与，锤式握法不能完全排除肱二头肌。',
};

export function withTechniqueReferences(exercise: Exercise): Exercise {
  return {
    ...exercise,
    muscleNote: exercise.muscleNote ?? notes[exercise.id],
    techniqueReferences: [
      { title: exercise.nameEn, publisher: 'free-exercise-db · 社区动作库', kind: '动作资料', url: exercise.sourceUrl, note: '对应动作变式的原始资料；中文步骤经过整理，未照搬固定角度、强制锁关节等提示。' },
      ...(extras[exercise.id] ?? []),
    ],
  };
}
