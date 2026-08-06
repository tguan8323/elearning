'use client'

import { useEffect, useState } from 'react'
import { pendingOperationCount, pullChanges, replayQueue } from '@/lib/offline-queue'

export function SyncStatus() {
  const [state, setState] = useState(navigator.onLine ? 'online' : 'offline')
  const [message, setMessage] = useState('')
  useEffect(() => { const online = () => setState('online'); const offline = () => setState('offline'); addEventListener('online', online); addEventListener('offline', offline); return () => { removeEventListener('online', online); removeEventListener('offline', offline) } }, [])
  const [pending, setPending] = useState(0)
  useEffect(() => { void pendingOperationCount().then(setPending).catch(() => undefined) }, [state])
  async function sync() { setMessage('同步中…'); try { await replayQueue(); const pulled = await pullChanges(); setPending(await pendingOperationCount()); setMessage(`已完成同步，拉取 ${pulled} 条更新。`) } catch (error) { setMessage(error instanceof Error && error.message.includes('409') ? '存在同步冲突，请保持联网并重新登录后重试。' : '同步失败；记录仍保存在本机，可稍后重试。') } }
  return <section aria-label="同步状态" className="summary"><strong>{state === 'online' ? '已联网' : '当前离线'}</strong><p>{state === 'offline' ? '新的教学记录会保存在本机，联网后再同步。' : '联网后可重试待同步记录。'}</p><p>待同步操作：{pending}</p><button type="button" onClick={() => void sync()} disabled={state === 'offline'}>立即同步</button>{message && <p role="status">{message}</p>}</section>
}
