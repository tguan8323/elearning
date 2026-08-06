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
  planOverride?: { mode: 'skip' | 'light_contact' | 'specified_ort' | 'review_only'; reason: string; specifiedOrt?: string } | null
  structuredGuide?: { actions: string[]; praisePhrases: string[]; substituteActivities: string[]; ortRecords: Array<{ title: string; level: string; context: string; interactionGoal: string }>; objectInventory: string[] }
}

type CatalogItem = { id: string; title: string; kind: string; description: string; fields: readonly string[] }

const asLines = (items: string[]) => items.join('\n')
const fromLines = (value: string) => value.split(/\r?\n|，|,/).map((item) => item.trim()).filter(Boolean)

const emptyGuide = () => ({ actions: [], praisePhrases: [], substituteActivities: [], ortRecords: [], objectInventory: [] })
const emptyOrtRecord = () => ({ title: '', level: '', context: '', interactionGoal: '' })

export function FamilyAdaptationForm({ initial, catalog }: { initial: FamilyAdaptation; catalog: readonly CatalogItem[] }) {
  const [value, setValue] = useState<FamilyAdaptation>({ ...initial, planOverride: initial.planOverride ?? null, structuredGuide: initial.structuredGuide ?? emptyGuide() })
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
        <fieldset><legend>今日计划覆盖</legend><select aria-label="计划覆盖模式" value={value.planOverride?.mode ?? ''} onChange={e => setValue({ ...value, planOverride: e.currentTarget.value ? { mode: e.currentTarget.value as NonNullable<FamilyAdaptation['planOverride']>['mode'], reason: value.planOverride?.reason ?? '', ...(e.currentTarget.value === 'specified_ort' ? { specifiedOrt: value.planOverride?.specifiedOrt ?? '' } : {}) } : null })}><option value="">按系统建议</option><option value="skip">跳过新增目标</option><option value="light_contact">轻量接触</option><option value="specified_ort">指定 ORT</option><option value="review_only">只做回顾</option></select>{value.planOverride && <><input aria-label="计划覆盖原因" required maxLength={200} placeholder="覆盖原因" value={value.planOverride.reason} onChange={e => setValue({ ...value, planOverride: { ...value.planOverride!, reason: e.currentTarget.value } })} />{value.planOverride.mode === 'specified_ort' ? <input aria-label="指定 ORT 书名" required maxLength={120} placeholder="家庭自有 ORT 书名" value={value.planOverride.specifiedOrt ?? ''} onChange={e => setValue({ ...value, planOverride: { ...value.planOverride!, specifiedOrt: e.currentTarget.value } })} /> : null}</>}</fieldset>
        <fieldset><legend>互动准备（每行一项）</legend><label>可用动作<textarea aria-label="可用动作" value={asLines(value.structuredGuide?.actions ?? [])} onChange={e => setValue({ ...value, structuredGuide: { ...value.structuredGuide!, actions: fromLines(e.currentTarget.value) } })} /></label><label>表扬语<textarea aria-label="表扬语" value={asLines(value.structuredGuide?.praisePhrases ?? [])} onChange={e => setValue({ ...value, structuredGuide: { ...value.structuredGuide!, praisePhrases: fromLines(e.currentTarget.value) } })} /></label><label>替代活动<textarea aria-label="替代活动" value={asLines(value.structuredGuide?.substituteActivities ?? [])} onChange={e => setValue({ ...value, structuredGuide: { ...value.structuredGuide!, substituteActivities: fromLines(e.currentTarget.value) } })} /></label><label>实物清单<textarea aria-label="实物清单" value={asLines(value.structuredGuide?.objectInventory ?? [])} onChange={e => setValue({ ...value, structuredGuide: { ...value.structuredGuide!, objectInventory: fromLines(e.currentTarget.value) } })} /></label></fieldset>
        <fieldset><legend>ORT 实体书记录</legend><p>只记录家庭自有实体书的导航信息，不上传书页或受保护内容。</p>{(value.structuredGuide?.ortRecords ?? []).map((record, index) => <div className="formGrid" key={`ort-${index}`}><label>书名<input aria-label={`ORT 书名 ${index + 1}`} maxLength={120} required value={record.title} onChange={e => { const records = [...value.structuredGuide!.ortRecords]; records[index] = { ...record, title: e.currentTarget.value }; setValue({ ...value, structuredGuide: { ...value.structuredGuide!, ortRecords: records } }) }} /></label><label>级别<input aria-label={`ORT 级别 ${index + 1}`} maxLength={40} required value={record.level} onChange={e => { const records = [...value.structuredGuide!.ortRecords]; records[index] = { ...record, level: e.currentTarget.value }; setValue({ ...value, structuredGuide: { ...value.structuredGuide!, ortRecords: records } }) }} /></label><label>情境<input aria-label={`ORT 情境 ${index + 1}`} maxLength={160} required value={record.context} onChange={e => { const records = [...value.structuredGuide!.ortRecords]; records[index] = { ...record, context: e.currentTarget.value }; setValue({ ...value, structuredGuide: { ...value.structuredGuide!, ortRecords: records } }) }} /></label><label>互动目标<input aria-label={`ORT 互动目标 ${index + 1}`} maxLength={160} required value={record.interactionGoal} onChange={e => { const records = [...value.structuredGuide!.ortRecords]; records[index] = { ...record, interactionGoal: e.currentTarget.value }; setValue({ ...value, structuredGuide: { ...value.structuredGuide!, ortRecords: records } }) }} /></label><button type="button" className="secondaryButton" onClick={() => setValue({ ...value, structuredGuide: { ...value.structuredGuide!, ortRecords: value.structuredGuide!.ortRecords.filter((_, itemIndex) => itemIndex !== index) } })}>移除此书</button></div>)}<button type="button" className="secondaryButton" disabled={(value.structuredGuide?.ortRecords.length ?? 0) >= 20} onClick={() => setValue({ ...value, structuredGuide: { ...value.structuredGuide!, ortRecords: [...value.structuredGuide!.ortRecords, emptyOrtRecord()] } })}>添加 ORT 记录</button></fieldset>
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
