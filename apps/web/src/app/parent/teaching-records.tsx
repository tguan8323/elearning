'use client'

import { useEffect, useState } from 'react'

type Observation = { id: string; outcome: string; promptLevel?: string; materialVariant?: string; note?: string | null; observedAt: string }
type Session = { id: string; targetTitle: string; status: string; createdAt: string; observations: Observation[] }

export function TeachingRecords() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [message, setMessage] = useState('')
  useEffect(() => { void fetch('/api/learning/sessions', { credentials: 'include' }).then(async response => { if (response.ok) setSessions(await response.json() as Session[]) }) }, [])
  async function saveNote(id: string, note: string) { const response = await fetch(`/api/learning/observations/${id}/note`, { method: 'PATCH', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ note }) }); setMessage(response.ok ? '备注已保存。' : '备注保存失败。') }
  return <section className="todayPlan" aria-labelledby="records-title"><p className="eyebrow">教学记录</p><h2 id="records-title">最近的陪伴教学</h2>{message && <p role="status">{message}</p>}{sessions.length ? sessions.map(session => <article className="contentSnapshot" key={session.id}><h3>{session.targetTitle}</h3><p>{session.status} · {new Date(session.createdAt).toLocaleDateString('zh-CN')}</p>{session.observations.map(observation => <div key={observation.id}><p>{observation.outcome} · {observation.promptLevel ?? '无提示层级'} · {observation.materialVariant ?? '未记录材料'}</p><label>家长备注<textarea defaultValue={observation.note ?? ''} maxLength={500} onBlur={event => void saveNote(observation.id, event.currentTarget.value)} /></label></div>)}</article>) : <p className="formHint">还没有教学记录。</p>}</section>
}
