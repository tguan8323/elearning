'use client'

import { useState, type FormEvent } from 'react'

export type FamilyAdaptation = {
  sessionMinutes: number
  sessionsPerWeek: number
  accent: 'en-US'
  reducedMotion: boolean
  soundEnabled: boolean
  interests: string[]
  excludedThemes: string[]
  availableMaterials: string[]
}

type CatalogItem = { id: string; title: string; kind: string; description: string; fields: readonly string[] }

const asLines = (items: string[]) => items.join('\n')
const fromLines = (value: string) => value.split(/\r?\n|，|,/).map((item) => item.trim()).filter(Boolean)

export function FamilyAdaptationForm({ initial, catalog }: { initial: FamilyAdaptation; catalog: readonly CatalogItem[] }) {
  const [value, setValue] = useState(initial)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    await save('/api/learning/adaptation', 'PATCH', value, '家庭适配已保存。')
  }

  async function save(url: string, method: string, body: FamilyAdaptation | undefined, success: string) {
    setBusy(true); setMessage('')
    const response = await fetch(url, { method, credentials: 'include', headers: { 'content-type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) })
    if (response.ok) {
      const next = await response.json() as FamilyAdaptation
      setValue(next); setMessage(success)
    } else {
      setMessage('未能保存，请检查时长、频率和文本长度。')
    }
    setBusy(false)
  }

  return (
    <section className="todayPlan" aria-labelledby="adaptation-title">
      <p className="eyebrow">家庭适配</p><h2 id="adaptation-title">按孩子和家庭调整</h2>
      <p className="summary">设置会影响教学准备与呈现。发音固定为美式英语。</p>
      <form onSubmit={submit}>
        <div className="formGrid">
          <label>每次时长（5–60 分钟）<input type="number" min="5" max="60" required value={value.sessionMinutes} onChange={(e) => setValue({ ...value, sessionMinutes: e.currentTarget.valueAsNumber })} /></label>
          <label>每周次数（1–7 次）<input type="number" min="1" max="7" required value={value.sessionsPerWeek} onChange={(e) => setValue({ ...value, sessionsPerWeek: e.currentTarget.valueAsNumber })} /></label>
        </div>
        <p><strong>发音：</strong>美式英语（固定）</p>
        <label className="checkLabel"><input type="checkbox" checked={value.reducedMotion} onChange={(e) => setValue({ ...value, reducedMotion: e.currentTarget.checked })} /> 减少动画和移动效果</label>
        <label className="checkLabel"><input type="checkbox" checked={value.soundEnabled} onChange={(e) => setValue({ ...value, soundEnabled: e.currentTarget.checked })} /> 启用提示音和示范音频</label>
        <label>孩子感兴趣的主题（每行一项）<textarea maxLength={820} value={asLines(value.interests)} onChange={(e) => setValue({ ...value, interests: fromLines(e.currentTarget.value) })} /></label>
        <label>需要避开的主题（每行一项）<textarea maxLength={1620} value={asLines(value.excludedThemes)} onChange={(e) => setValue({ ...value, excludedThemes: fromLines(e.currentTarget.value) })} /></label>
        <label>家里可用的材料（每行一项）<textarea maxLength={1620} value={asLines(value.availableMaterials)} onChange={(e) => setValue({ ...value, availableMaterials: fromLines(e.currentTarget.value) })} /></label>
        <div className="lessonActions"><button disabled={busy} type="submit">{busy ? '保存中…' : '保存家庭适配'}</button><button disabled={busy} className="secondaryButton" type="button" onClick={() => void save('/api/learning/adaptation/reset', 'POST', undefined, '已恢复默认设置。')}>恢复默认</button></div>
        <p role="status" aria-live="polite">{message}</p>
      </form>
      <details><summary>Flash Cards 与 ORT 实体书导航</summary>
        <p>这里只提供目录元数据，不包含受保护的卡面、书页、插图、正文或扫描件。</p>
        {catalog.map((item) => <article key={item.id}><h3>{item.title}</h3><p>{item.description}</p><p>可记录：{item.fields.join('、')}</p></article>)}
      </details>
    </section>
  )
}
