'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function OfflinePackage() {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [active, setActive] = useState(false)
  const [manifest, setManifest] = useState<{ version: string; checksum: string; sizeBytes: number; payload?: { resources?: string[] } } | null>(null)
  async function prepare() { setMessage('正在准备离线包…'); const response = await fetch('/api/sync/package', { credentials: 'include', cache: 'no-store' }); if (!response.ok) { setMessage('离线包准备失败，请联网后重试。'); return }; const body = await response.json() as typeof manifest; const estimate = await navigator.storage?.estimate?.(); if (estimate?.quota && body && body.sizeBytes > estimate.quota - (estimate.usage ?? 0)) { setMessage('本机可用存储空间不足，请先清理空间。'); return }; setManifest(body); setActive(window.localStorage.getItem('family-english-package') === body?.version); setMessage('离线包清单已校验，可激活本机使用。') }
  function download() { router.push('/api/sync/package/download') }
  function activate() { if (!manifest) return; const urls = ['/learn', ...(manifest.payload?.resources ?? [])]; navigator.serviceWorker.controller?.postMessage({ type: 'ACTIVATE_PACKAGE', urls }); window.localStorage.setItem('family-english-package', manifest.version); setActive(true); setMessage('离线包已激活；敏感操作仍需联网。') }
  function clearPackage() { navigator.serviceWorker.controller?.postMessage({ type: 'CLEAR_PACKAGE' }); window.localStorage.removeItem('family-english-package'); setActive(false); setMessage('已清除本机离线包。') }
  return <section className="summary" aria-labelledby="offline-package-title"><h2 id="offline-package-title">离线教学包</h2><p>只包含课程核心内容和已发布的家庭内容，不包含密码、PIN 或敏感资料。</p>{manifest && <><p>版本 {manifest.version} · {manifest.sizeBytes} bytes · SHA-256 {manifest.checksum}</p><button type="button" onClick={download} disabled={!manifest}>下载离线包</button><button type="button" onClick={activate} disabled={!manifest || active}>{active ? '已激活到本机' : '激活离线包'}</button><button type="button" onClick={clearPackage} disabled={!active}>清除本机离线包</button></>}<button type="button" onClick={() => void prepare()}>检查并准备离线包</button>{message && <p role="status">{message}</p>}</section>
}
