'use client'

import { useEffect, useState } from 'react'
import { pendingOperationCount, pullChanges, replayQueue, resolveConflict } from '@/lib/offline-queue'

export function SyncStatus() {
  const [state, setState] = useState(navigator.onLine ? 'online' : 'offline')
  const [message, setMessage] = useState('')
  useEffect(() => { const online = () => setState('online'); const offline = () => setState('offline'); addEventListener('online', online); addEventListener('offline', offline); return () => { removeEventListener('online', online); removeEventListener('offline', offline) } }, [])
  const [pending, setPending] = useState(0)
  useEffect(() => { void pendingOperationCount().then(setPending).catch(() => undefined) }, [state])
  const [conflict, setConflict] = useState<{ text: string; operationId?: string; currentVersion?: number } | null>(null)
  async function sync() { setMessage('同步中…'); setConflict(null); try { await replayQueue(); const pulled = await pullChanges(); setPending(await pendingOperationCount()); setMessage(`已完成同步，拉取 ${pulled} 条更新。`) } catch (error) { const detail = error instanceof Error ? error.message : ''; if (detail.startsWith('同步冲突：')) { try { const parsed = JSON.parse(detail.slice(5)); setConflict({ text: JSON.stringify(parsed, null, 2), operationId: parsed.operationId, currentVersion: parsed.currentVersion }) } catch { setConflict({ text: detail }) } } setMessage(detail.includes('401') ? '登录已过期，请重新登录后重试。' : '同步失败；记录仍保存在本机，可稍后重试。') } }
  async function chooseConflict(choice: 'server' | 'local') { if (!conflict?.operationId) return; await resolveConflict(conflict.operationId, choice, conflict.currentVersion); setConflict(null); setMessage(choice === 'server' ? '已采用服务器版本。' : '已保留本地版本，正在重新尝试。'); if (choice === 'local') void sync(); setPending(await pendingOperationCount()) }
  return <section aria-label="同步状态" className="summary"><strong>{state === 'online' ? '已联网' : '当前离线'}</strong><p>{state === 'offline' ? '新的教学记录会保存在本机，联网后再同步。' : '联网后可重试待同步记录。'}</p><p>待同步操作：{pending}</p><button type="button" onClick={() => void sync()} disabled={state === 'offline'}>立即同步</button>{message && <p role="status">{message}</p>}{conflict && <details open><summary>查看冲突详情</summary><pre>{conflict.text}</pre><p>选择要保留的版本：</p><button type="button" onClick={() => void chooseConflict('server')}>采用服务器版本</button><button type="button" onClick={() => void chooseConflict('local')}>保留本地并重试</button></details>}</section>
}
