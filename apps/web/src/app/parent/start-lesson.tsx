'use client'

import { useState } from 'react'

import { createOperation, saveRecordAndQueue } from '@/lib/offline-queue'
import { publishCastContent } from '../cast/casting-view'
export function StartLesson({ target }: { target: { id: string; title: string; parentScript: string[]; materials: string[] } }) {
  const [step, setStep] = useState<number | null>(null)
  const [sessionId, setSessionId] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const stages = ['预告与准备', '回顾上一课', '引入一个新目标', '多方式练习', '明确结束']
  const currentContent = step === null ? '' : target.parentScript[Math.min(step, target.parentScript.length - 1)]

  function cast(content: string) {
    publishCastContent({ sessionId, text: content })
  }

  function advance() {
    const nextStep = Math.min((step ?? 0) + 1, 4)
    setStep(nextStep)
    cast(target.parentScript[Math.min(nextStep, target.parentScript.length - 1)] ?? '')
  }

  async function start() {
    const clientId = crypto.randomUUID()
    const payload = { clientId, targetId: target.id }
    let response: Response | null = null
    try { response = await fetch('/api/learning/sessions', { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }) } catch { response = null }
    if (response?.ok) {
      const body = await response.json() as { id: string }
      setSessionId(body.id)
      setStep(0)
      publishCastContent({ sessionId: body.id, text: target.parentScript[0] ?? '' })
    } else {
      setSessionId(clientId)
      setStep(0)
      await saveRecordAndQueue({ recordId: clientId, version: 0, deleted: false, payload: { clientId, targetId: target.id, status: 'IN_PROGRESS' } }, createOperation({ kind: 'upsert-session', recordId: clientId, baseVersion: 0, payload }))
      setStatusMessage('当前离线，教学记录已保存在本机，联网后会同步。')
    }
  }

  async function observe(outcome: 'independent' | 'prompted' | 'not_observed' | 'declined') {
    const observation = { clientId: crypto.randomUUID(), sessionId, targetId: target.id, outcome, promptLevel: outcome === 'independent' ? 'none' : outcome === 'prompted' ? 'gesture' : 'not_applicable', materialVariant: `lesson-stage-${step ?? 4}` }
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
      await saveRecordAndQueue({ recordId: `${sessionId}:finish`, version: 0, deleted: false, payload: { clientId: `${sessionId}:finish`, sessionId, targetId: target.id, status } }, createOperation({ kind: 'upsert-session', recordId: sessionId, baseVersion: 0, payload: { clientId: `${sessionId}:finish`, targetId: target.id, status } }))
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
      <p>{step === 2 ? target.title : step === 4 ? 'Say: All done.' : currentContent}</p>
      <div className="lessonActions">
        <a className="buttonLink" href="/cast" target="_blank" rel="noreferrer" onClick={() => cast(currentContent ?? '')}>
          打开孩子画面
        </a>
        {step < 4 ? <button onClick={advance}>下一步</button> : (
          <div className="observationChoices">
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
