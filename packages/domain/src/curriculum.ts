export type CurriculumTarget = {
  id: string
  title: string
  strand: 'participation' | 'functional' | 'phonics' | 'writing' | 'reading'
  parentScript: string[]
  materials: string[]
  prerequisiteIds: string[]
}

export const curriculumTargets: CurriculumTarget[] = [
  {
    id: 'participation-ready', title: 'Ready / Look / Listen', strand: 'participation',
    parentScript: ['Ready?', 'Look.', 'Listen.', 'All done.'], materials: ['一件孩子喜欢的实物'], prerequisiteIds: [],
  },
  {
    id: 'functional-help', title: 'Help / Stop / Break', strand: 'functional',
    parentScript: ['Help, please.', 'Stop.', 'Break, please.', 'All done.'], materials: ['表达卡或手势'], prerequisiteIds: [],
  },
  {
    id: 'phonics-s', title: '声音 /s/', strand: 'phonics',
    parentScript: ['Listen: /s/.', 'Your turn.', 'Find /s/.', 'All done.'], materials: ['实体字母卡 s', '三个熟悉实物'], prerequisiteIds: ['participation-ready'],
  },
  {
    id: 'phonics-a', title: '声音 /æ/', strand: 'phonics',
    parentScript: ['Listen: /æ/.', 'Your turn.', 'Find /æ/.', 'All done.'], materials: ['实体字母卡 a'], prerequisiteIds: ['phonics-s'],
  },
  {
    id: 'blend-sa', title: '连续合音 /s/–/æ/', strand: 'reading',
    parentScript: ['Listen.', '/s/…/æ/.', 'Together.', 'All done.'], materials: ['字母块 s、a'], prerequisiteIds: ['phonics-s', 'phonics-a'],
  },
]
