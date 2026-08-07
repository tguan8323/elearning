'use client'

import { useState } from 'react'

import { createOperation, readLessonPackage, saveRecordAndQueue } from '@/lib/offline-queue'
import { publishCastContent } from '../cast/casting-view'
export function StartLesson({ target }: { target: { id: string; title: string; parentScript: string[]; materials: string[] } }) {
  const [step, setStep] = useState<number | null>(null)
  const [sessionId, setSessionId] = useState('')
  const [lessonTarget, setLessonTarget] = useState(target)
  const [statusMessage, setStatusMessage] = useState('')
  const [interestLevel, setInterestLevel] = useState('not_observed')
  const [fatigueLevel, setFatigueLevel] = useState('not_observed')
  const [discomfort, setDiscomfort] = useState(false)
  const [effectivePrompt, setEffectivePrompt] = useState('')
  const [note, setNote] = useState('')
  const stages = ['预告与准备', '回顾上一课', '引入一个新目标', '多方式练习', '明确结束']
  const currentContent = step === null ? '' : lessonTarget.parentScript[Math.min(step, lessonTarget.parentScript.length - 1)]

  function cast(content: string) {
    publishCastContent({ sessionId, text: content })
  }

  function advance() {
    const nextStep = Math.min((step ?? 0) + 1, 4)
    setStep(nextStep)
    cast(lessonTarget.parentScript[Math.min(nextStep, lessonTarget.parentScript.length - 1)] ?? '')
  }

  async function start() {
    const offlinePackage = !navigator.onLine ? await readLessonPackage() : null
    const offlineTarget = offlinePackage?.targets.find((item) => item.id === target.id)
    if (!navigator.onLine && !offlineTarget) {
      setStatusMessage('这节课尚未下载到本机，请联网准备离线教学包。')
      return
    }
    const activeTarget = offlineTarget ?? target
    const clientId = crypto.randomUUID()
    const payload = { clientId, targetId: activeTarget.id }
    let response: Response | null = null
    try { response = await fetch('/api/learning/sessions', { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }) } catch { response = null }
    setLessonTarget(activeTarget)
    if (response?.ok) {
      const body = await response.json() as { id: string }
      setSessionId(body.id)
      setStep(0)
      publishCastContent({ sessionId: body.id, text: activeTarget.parentScript[0] ?? '' })
    } else {
      setSessionId(clientId)
      setStep(0)
      await saveRecordAndQueue({ recordId: clientId, version: 0, deleted: false, payload: { clientId, targetId: target.id, status: 'IN_PROGRESS' } }, createOperation({ kind: 'upsert-session', recordId: clientId, baseVersion: 0, payload }))
      setStatusMessage('当前离线，教学记录已保存在本机，联网后会同步。')
    }
  }

  async function observe(outcome: 'independent' | 'prompted' | 'not_observed' | 'declined') {
    const observation = { clientId: crypto.randomUUID(), sessionId, targetId: target.id, outcome, promptLevel: outcome === 'independent' ? 'none' : outcome === 'prompted' ? 'gesture' : 'not_applicable', effectivePrompt: effectivePrompt.trim() || undefined, materialVariant: `lesson-stage-${step ?? 4}`, interestLevel, fatigueLevel, discomfort, note: note.trim() || undefined }
    try {
      const response = await fetch('/api/learning/observations', { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify(observation) })
      if (!response.ok) throw new Error('offline')
    } catch {
      await saveRecordAndQueue({ recordId: observation.clientId, version: 0, deleted: false, payload: observation }, createOperation({ kind: 'upsert-observation', recordId: observation.clientId, baseVersion: 0, payload: observation }))
      setStatusMessage('观察记录已保存在本机，联网后会同步。')
    }
    await finish('COMPLETED')
  }

  async function finish(status: 'COMPLETED' | 'ENDED_EARLY') {
    try {
      const response = await fetch(`/api/learning/sessions/${sessionId}`, { method: 'PATCH', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status }) })
      if (!response.ok) throw new Error('offline')
    } catch {
      await saveRecordAndQueue({ recordId: sessionId, version: 0, deleted: false, payload: { clientId: sessionId, sessionId, targetId: target.id, status } }, createOperation({ kind: 'upsert-session', recordId: sessionId, baseVersion: 0, payload: { clientId: sessionId, targetId: target.id, status } }))
      setStatusMessage('结束状态已保存在本机，联网后会同步。')
    }
    publishCastContent({ sessionId, text: '' })
    setStep(null)
  }

  if (step === null) return <button onClick={start}>开始 15 分钟教学</button>

  return (
    <section className="lessonStep" aria-live="polite">
      <p className="eyebrow">第 {step + 1} 步 / 5</p>{statusMessage ? <p role="status">{statusMessage}</p> : null}
      <h3>{stages[step]}</h3>
      <p>{step === 2 ? lessonTarget.title : step === 4 ? 'Say: All done.' : currentContent}</p>
      <div className="lessonActions">
        <a className="buttonLink" href="/cast" target="_blank" rel="noreferrer" onClick={() => cast(currentContent ?? '')}>
          打开孩子画面
        </a>
        {step < 4 ? <button onClick={advance}>下一步</button> : (
          <div className="observationChoices">
            <label>兴趣<select value={interestLevel} onChange={(event) => setInterestLevel(event.target.value)}><option value="not_observed">未观察</option><option value="high">高</option><option value="medium">中</option><option value="low">低</option></select></label>
            <label>疲劳<select value={fatigueLevel} onChange={(event) => setFatigueLevel(event.target.value)}><option value="not_observed">未观察</option><option value="none">无</option><option value="mild">轻微</option><option value="high">明显</option></select></label>
            <label><input type="checkbox" checked={discomfort} onChange={(event) => setDiscomfort(event.target.checked)} /> 感觉不适</label>
            <label>实际提示<input value={effectivePrompt} onChange={(event) => setEffectivePrompt(event.target.value)} maxLength={120} placeholder="可选" /></label>
            <label>课后备注<textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} placeholder="可选" /></label>
            <button onClick={() => void observe('independent')}>独立完成</button>
            <button onClick={() => void observe('prompted')}>提示后完成</button>
            <button onClick={() => void observe('not_observed')}>未观察到</button>
            <button onClick={() => void observe('declined')}>孩子拒绝</button>
          </div>
        )}
        <button className="secondaryButton" onClick={() => void finish('ENDED_EARLY')}>提前结束</button>
      </div>
    </section>
  )
}
