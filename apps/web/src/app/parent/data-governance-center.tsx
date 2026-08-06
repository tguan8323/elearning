'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

type ExportData = {
  exportedAt: string
  learner: { id: string; nickname: string; avatarId: string; createdAt: string; updatedAt: string }
  adaptation: unknown
  teachingSessions: Array<{ id: string; targetId?: string; status?: string; createdAt?: string; [key: string]: unknown }>
  observations: unknown[]
  summary: string
}

type DeletionPreview = {
  nickname: string
  impact: { teachingSessions: number; observations: number }
  confirmationToken: string
  expiresAt: string
}

function download(name: string, contents: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

function readableExport(data: ExportData) {
  const lines = [
    `孩子学习数据导出`, data.summary, `导出时间：${data.exportedAt}`,
    `昵称：${data.learner.nickname}`, `头像：${data.learner.avatarId}`,
    '', `教学记录（${data.teachingSessions.length} 条）`,
    ...data.teachingSessions.map((item, index) => `${index + 1}. ${item.createdAt ?? '时间未知'} · ${item.targetId ?? '目标未知'} · ${item.status ?? '状态未知'}`),
    '', `学习观察（${data.observations.length} 条）`,
    ...data.observations.map((item, index) => `${index + 1}. ${JSON.stringify(item)}`),
  ]
  return lines.join('\n')
}

export function DataGovernanceCenter() {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [data, setData] = useState<ExportData | null>(null)
  const [preview, setPreview] = useState<DeletionPreview | null>(null)
  const [deletingSession, setDeletingSession] = useState<string | null>(null)

  async function requestExport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const password = new FormData(form).get('password')
    const response = await fetch('/api/learners/current/export', {
      method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password }),
    }).catch(() => null)
    if (!response?.ok) { setMessage(response?.status === 401 ? '家长密码不正确' : '暂时无法导出数据'); return }
    setData(await response.json() as ExportData)
    form.reset()
    setMessage('数据已准备好。请选择机器可读或易读版本下载。')
  }

  async function removeSession(id: string) {
    const response = await fetch(`/api/learning/sessions/${id}`, { method: 'DELETE', credentials: 'include' }).catch(() => null)
    if (!response?.ok) { setMessage('暂时无法删除这条教学记录'); return }
    setData((current) => current ? { ...current, teachingSessions: current.teachingSessions.filter((item) => item.id !== id) } : current)
    setDeletingSession(null)
    setMessage('这条教学记录已删除。相关学习观察不会随之删除。')
  }

  async function requestDeletionPreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const password = new FormData(event.currentTarget).get('password')
    const response = await fetch('/api/learners/current/deletion-preview', {
      method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password }),
    }).catch(() => null)
    if (!response?.ok) { setMessage(response?.status === 401 ? '家长密码不正确' : '暂时无法预览删除影响'); return }
    setPreview(await response.json() as DeletionPreview)
    setMessage('请核对删除影响，再进行第二次明确确认。')
  }

  async function confirmLearnerDeletion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!preview) return
    const form = event.currentTarget
    const values = new FormData(form)
    if (values.get('confirmation') !== preview.nickname) { setMessage('请输入孩子昵称以明确确认删除'); return }
    const response = await fetch('/api/learners/current', {
      method: 'DELETE', credentials: 'include', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: values.get('password'), confirmationToken: preview.confirmationToken, confirm: true }),
    }).catch(() => null)
    if (!response?.ok) { setMessage(response?.status === 401 ? '家长密码不正确' : '确认已失效或删除失败，请重新预览'); return }
    setPreview(null)
    setData(null)
    setMessage('孩子身份及其学习数据已删除，孩子模式已停用。')
    router.refresh()
  }

  return (
    <section className="governancePanel" aria-labelledby="data-governance-title">
      <p className="eyebrow">隐私与数据</p>
      <h2 id="data-governance-title">管理孩子的数据</h2>
      <p className="summary">导出和删除前都要重新验证家长密码。这里不会增加设备授权步骤。</p>
      <div className="privacyNotice" aria-label="离线与私有对象说明">
        <strong>离线与私有内容说明</strong>
        <p>导出的文件会保存到这台设备的下载目录，离线副本不受本应用继续保护，请由家长妥善保管或删除。</p>
        <p>家庭内容目前只登记元数据；私有文件或对象存储中的原始内容不包含在本导出中，也不会因删除教学记录而自动清除。</p>
      </div>

      <details>
        <summary>导出孩子数据</summary>
        <form className="authForm" onSubmit={requestExport}>
          <label htmlFor="export-password">导出用家长密码</label>
          <input id="export-password" name="password" type="password" autoComplete="current-password" required />
          <button type="submit">验证并准备导出</button>
        </form>
        {data ? <div className="managementStack">
          <p>{data.summary}</p>
          <div className="buttonRow">
            <button type="button" onClick={() => download(`learner-data-${data.learner.id}.json`, JSON.stringify(data, null, 2), 'application/json')}>下载机器可读 JSON</button>
            <button type="button" className="secondaryButton" onClick={() => download(`learner-data-${data.learner.id}.txt`, readableExport(data), 'text/plain;charset=utf-8')}>下载易读文本</button>
          </div>
          <h3>教学记录</h3>
          {data.teachingSessions.length ? <ul className="recordList">{data.teachingSessions.map((session) => <li key={session.id}>
            <span>{session.createdAt ? new Date(session.createdAt).toLocaleString('zh-CN') : '时间未知'} · {session.targetId ?? '学习目标未知'} · {session.status ?? '状态未知'}</span>
            {deletingSession === session.id ? <span className="buttonRow"><button type="button" className="dangerButton" onClick={() => void removeSession(session.id)}>确认删除这一条</button><button type="button" className="secondaryButton" onClick={() => setDeletingSession(null)}>取消</button></span> : <button type="button" className="secondaryButton" onClick={() => setDeletingSession(session.id)}>删除这条记录</button>}
          </li>)}</ul> : <p>没有教学记录。</p>}
        </div> : null}
      </details>

      <details>
        <summary>永久删除孩子身份</summary>
        <p>先用密码生成影响预览。预览不会删除任何内容，有效期为 10 分钟。</p>
        <form className="authForm" onSubmit={requestDeletionPreview}>
          <label htmlFor="preview-password">预览用家长密码</label>
          <input id="preview-password" name="password" type="password" autoComplete="current-password" required />
          <button type="submit" className="secondaryButton">预览删除影响</button>
        </form>
        {preview ? <div className="dangerZone" aria-label="删除影响预览">
          <h3>将永久删除“{preview.nickname}”</h3>
          <ul><li>{preview.impact.teachingSessions} 条教学记录</li><li>{preview.impact.observations} 条学习观察</li><li>孩子身份与 PIN；所有孩子模式会停用</li></ul>
          <p>此操作不可撤销。家庭私有对象或已经下载到设备的离线副本不会被本操作自动清除。</p>
          <form className="authForm" onSubmit={confirmLearnerDeletion}>
            <label htmlFor="delete-confirmation">输入孩子昵称“{preview.nickname}”进行第二次确认</label>
            <input id="delete-confirmation" name="confirmation" autoComplete="off" required />
            <label htmlFor="delete-password">再次输入家长密码</label>
            <input id="delete-password" name="password" type="password" autoComplete="current-password" required />
            <button type="submit" className="dangerButton">永久删除孩子身份和数据</button>
          </form>
        </div> : null}
      </details>
      {message ? <p role="status">{message}</p> : null}
    </section>
  )
}
