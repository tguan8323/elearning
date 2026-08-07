import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { basename, extname, relative, resolve, sep } from 'node:path'

const sourceRoot = resolve(process.argv[2] ?? 'D:/BaiduNetdiskDownload/English Learning')
const outputRoot = resolve('private-content/phonics')
const outputFile = resolve(outputRoot, 'catalog.json')
const mimeByExtension = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.wma': 'audio/x-ms-wma',
  '.zip': 'application/zip',
}
const phonicsPattern = /\[([^\]]+)\]|(?:phonics|songs?|letter sounds?)[ _-]+([^./\\]+)/i

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) files.push(...await walk(path))
    else if (entry.isFile()) files.push(path)
  }
  return files
}

function levelFromPath(path) {
  const match = relative(sourceRoot, path).match(/(?:^|\\|\/)(Level \d+\+?)(?:\\|\/)/i)
  return match?.[1] ?? 'Unclassified'
}

function seriesFromPath(path) {
  const value = relative(sourceRoot, path).toLowerCase()
  if (value.includes('jolly')) return 'Jolly Phonics'
  if (value.includes('ort') || value.includes('牛津阅读树')) return 'Oxford Reading Tree'
  if (value.includes('dictionary')) return 'Oxford Phonics Spelling Dictionary'
  return 'Other English Learning'
}

function kindFor(extension, path) {
  if (extension === '.wma') return 'phonics-audio'
  if (extension === '.png') return 'flashcard-image'
  if (extension === '.pdf' && /phonics|jolly|letter|sound/i.test(path)) return 'phonics-book'
  if (extension === '.pdf' && /dictionary/i.test(path)) return 'reference-book'
  if (extension === '.zip') return 'archive-needs-review'
  return 'reading-material'
}

function slotFor(kind, extension) {
  if (kind === 'phonics-audio') return 'learner-audio'
  if (kind === 'flashcard-image') return 'learner-visual'
  if (kind === 'phonics-book') return 'decodable-reading'
  if (kind === 'reference-book') return 'parent-reference'
  if (extension === '.pdf') return 'lesson-review'
  return 'parent-reference'
}

function stageFor(kind) {
  if (kind === 'phonics-audio') return ['introduce', 'practice', 'review']
  if (kind === 'flashcard-image') return ['prepare', 'practice', 'review']
  if (kind === 'phonics-book') return ['introduce', 'practice', 'finish']
  return ['prepare', 'review']
}

function targetsFor(name) {
  const match = name.match(phonicsPattern)
  const raw = match?.[1] ?? match?.[2]
  if (!raw) return []
  return raw.split(/[_+,\s]+/).map((item) => item.trim().toLowerCase()).filter(Boolean)
}

const files = (await walk(sourceRoot)).sort((a, b) => a.localeCompare(b))
const items = []
for (const path of files) {
  const extension = extname(path).toLowerCase()
  const info = await stat(path)
  const sourcePath = relative(sourceRoot, path).split(sep).join('/')
  const name = basename(path, extension)
  const kind = kindFor(extension, sourcePath)
  const targets = targetsFor(name)
  items.push({
    id: createHash('sha256').update(sourcePath).digest('hex').slice(0, 16),
    series: seriesFromPath(path),
    level: levelFromPath(path),
    kind,
    title: name,
    sourcePath,
    mimeType: mimeByExtension[extension] ?? 'application/octet-stream',
    sizeBytes: info.size,
    targetHints: targets,
    suggestedSlot: slotFor(kind, extension),
    suggestedStages: stageFor(kind),
    license: 'private-family-use',
    importState: targets.length > 0 ? 'candidate' : 'needs-review',
  })
}
const catalog = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  source: 'local-private-directory',
  sourceRootLabel: 'English Learning',
  sourceFileCount: files.length,
  fileTypeCounts: items.reduce((counts, item) => {
    const extension = extname(item.sourcePath).toLowerCase()
    counts[extension] = (counts[extension] ?? 0) + 1
    return counts
  }, {}),
  items,
}
await mkdir(outputRoot, { recursive: true })
await writeFile(outputFile, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8')
console.log(`catalog generated: ${items.length} files`)
console.log(JSON.stringify(catalog.fileTypeCounts))
