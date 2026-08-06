export type CurriculumStrand = 'participation' | 'functional' | 'phonics' | 'writing' | 'reading'

export type CurriculumTarget = {
  id: string
  title: string
  strand: CurriculumStrand
  group?: number
  grapheme?: string
  evidenceDimension?: 'sound_discrimination' | 'sound_symbol' | 'production' | 'blending' | 'segmenting' | 'writing'
  parentScript: string[]
  materials: string[]
  prerequisiteIds: string[]
  independentPractice?: {
    title: string
    prompt: string
    choices: string[]
  }
}

const participationTargets: CurriculumTarget[] = [
  { id: 'participation-ready', title: 'Ready / Look / Listen', strand: 'participation', parentScript: ['Ready?', 'Look.', 'Listen.', 'All done.'], materials: ['一件孩子喜欢的实物'], prerequisiteIds: [], independentPractice: { title: 'Look and listen', prompt: 'Choose what you want to say.', choices: ['Help, please.', 'Stop.', 'Break, please.', 'All done.'] } },
  { id: 'functional-help', title: 'Help / Stop / Break', strand: 'functional', parentScript: ['Help, please.', 'Stop.', 'Break, please.', 'All done.'], materials: ['原创表达卡或手势'], prerequisiteIds: [], independentPractice: { title: 'Ask for what you need', prompt: 'What do you need?', choices: ['Help, please.', 'Stop.', 'Break, please.', 'All done.'] } },
  { id: 'functional-choice', title: 'I want / I do not want', strand: 'functional', parentScript: ['Which one?', 'I want this.', 'No, thank you.', 'All done.'], materials: ['两个熟悉实物'], prerequisiteIds: ['functional-help'] },
]

const phonicsGroups = [
  ['s', 'a', 't', 'i', 'p', 'n'],
  ['c-k', 'e', 'h', 'r', 'm', 'd'],
  ['g', 'o', 'u', 'l', 'f', 'b'],
  ['ai', 'j', 'oa', 'ie', 'ee', 'or'],
  ['z', 'w', 'ng', 'v', 'oo-short', 'oo-long'],
  ['y', 'x', 'ch', 'sh', 'th-voiceless', 'th-voiced'],
  ['qu', 'ou', 'oi', 'ue', 'er', 'ar'],
] as const

const displayNames: Record<string, string> = {
  'c-k': 'c / k', 'oo-short': 'oo（短音）', 'oo-long': 'oo（长音）',
  'th-voiceless': 'th（清音）', 'th-voiced': 'th（浊音）',
}

const phonicsTargets: CurriculumTarget[] = []
let previousId = 'participation-ready'
for (const [groupIndex, graphemes] of phonicsGroups.entries()) {
  for (const grapheme of graphemes) {
    const id = `phonics-${grapheme}`
    const shown = displayNames[grapheme] ?? grapheme
    phonicsTargets.push({
      id,
      title: `声音与字形 ${shown}`,
      strand: 'phonics',
      group: groupIndex + 1,
      grapheme,
      evidenceDimension: 'sound_symbol',
      parentScript: [`Listen: ${shown}.`, 'Your turn.', `Find ${shown}.`, 'All done.'],
      materials: [`实体字母卡 ${shown}`, '两个熟悉实物', '原创声音辨认卡'],
      prerequisiteIds: [previousId],
    })
    phonicsTargets.push({
      id: `produce-${grapheme}`,
      title: `尝试发出 ${shown}`,
      strand: 'phonics',
      group: groupIndex + 1,
      grapheme,
      evidenceDimension: 'production',
      parentScript: [`Listen: ${shown}.`, 'Your turn.', 'Nice trying.', 'All done.'],
      materials: ['小镜子（可选）', `实体字母卡 ${shown}`],
      prerequisiteIds: [id],
    })
    phonicsTargets.push({
      id: `write-${grapheme}`,
      title: `多感官描写 ${shown}`,
      strand: 'writing',
      group: groupIndex + 1,
      grapheme,
      evidenceDimension: 'writing',
      parentScript: ['Watch me.', 'Your turn.', 'Slow and easy.', 'All done.'],
      materials: ['沙盘、白板或大号字母块，任选一种'],
      prerequisiteIds: [id],
    })
    previousId = id
  }
}

const blendingTargets: CurriculumTarget[] = [
  { id: 'blend-sat', title: '连续合音 s–a–t', strand: 'reading', group: 1, evidenceDimension: 'blending', parentScript: ['Listen.', 's…a…t.', 'Together.', 'All done.'], materials: ['字母块 s、a、t'], prerequisiteIds: ['phonics-s', 'phonics-a', 'phonics-t'] },
  { id: 'segment-sat', title: '拆分 sat 的声音', strand: 'reading', group: 1, evidenceDimension: 'segmenting', parentScript: ['Say sat.', 'First sound?', 'Next sound?', 'All done.'], materials: ['三个实物标记', '字母块 s、a、t'], prerequisiteIds: ['blend-sat'] },
  { id: 'blend-pin', title: '连续合音 p–i–n', strand: 'reading', group: 1, evidenceDimension: 'blending', parentScript: ['Listen.', 'p…i…n.', 'Together.', 'All done.'], materials: ['字母块 p、i、n'], prerequisiteIds: ['phonics-p', 'phonics-i', 'phonics-n'] },
  { id: 'blend-red', title: '连续合音 r–e–d', strand: 'reading', group: 2, evidenceDimension: 'blending', parentScript: ['Listen.', 'r…e…d.', 'Together.', 'All done.'], materials: ['字母块 r、e、d'], prerequisiteIds: ['phonics-r', 'phonics-e', 'phonics-d'] },
  { id: 'blend-log', title: '连续合音 l–o–g', strand: 'reading', group: 3, evidenceDimension: 'blending', parentScript: ['Listen.', 'l…o…g.', 'Together.', 'All done.'], materials: ['字母块 l、o、g'], prerequisiteIds: ['phonics-l', 'phonics-o', 'phonics-g'] },
  { id: 'read-phrase-1', title: '阅读可解码短语', strand: 'reading', evidenceDimension: 'blending', parentScript: ['Point and read.', 'Take your time.', 'Show me.', 'All done.'], materials: ['仅含已接触拼写的原创短语卡'], prerequisiteIds: ['blend-log'] },
]

export const curriculumTargets: CurriculumTarget[] = [
  ...participationTargets,
  ...phonicsTargets,
  ...blendingTargets,
]

export const curriculumVersion = '2026.08-original-v1'
export const phonicsGroupCount = phonicsGroups.length
