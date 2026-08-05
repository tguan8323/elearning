'use client'

import { useState } from 'react'

export function StartLesson({ target }: { target: { id: string; title: string; parentScript: string[]; materials: string[] } }) {
  const [step, setStep] = useState<number | null>(null)
  const [sessionId, setSessionId] = useState('')
  const stages = ['预告与准备', '回顾上一课', '引入一个新目标', '多方式练习', '明确结束']

  async function start() {
    const clientId = crypto.randomUUID()
    const response = await fetch('/api/learning/sessions', {
      method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ clientId, targetId: target.id }),
    })
    if (response.ok) { const body = await response.json() as { id: string }; setSessionId(body.id); setStep(0) }
  }

  async function observe(outcome: 'independent' | 'prompted' | 'not_observed' | 'declined') {
    await fetch('/api/learning/observations', {
      method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ clientId: crypto.randomUUID(), sessionId, targetId: target.id, outcome }),
    })
    await finish('COMPLETED')
  }

  async function finish(status: 'COMPLETED' | 'ENDED_EARLY') {
    await fetch(`/api/learning/sessions/${sessionId}`, {
      method: 'PATCH', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status }),
    })
    setStep(null)
  }

  if (step === null) return <button onClick={start}>开始 15 分钟教学</button>

  return (
    <section className="lessonStep" aria-live="polite">
      <p className="eyebrow">第 {step + 1} 步 / 5</p>
      <h3>{stages[step]}</h3>
      <p>{step === 2 ? target.title : step === 4 ? 'Say: All done.' : target.parentScript[Math.min(step, target.parentScript.length - 1)]}</p>
      <div className="lessonActions">
        {step < 4 ? <button onClick={() => setStep(step + 1)}>下一步</button> : (
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
