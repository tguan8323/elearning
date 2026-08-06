'use client'

import { useState } from 'react'

async function sha256Hex(body: ArrayBuffer) {
  const digest = await crypto.subtle.digest('SHA-256', body)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function OfflinePackage() {
  const [message, setMessage] = useState('')
  const [active, setActive] = useState(false)
  const [manifest, setManifest] = useState<{ version: string; checksum: string; sizeBytes: number; payload?: { resources?: string[] } } | null>(null)
  async function prepare() {
    setMessage('正在准备离线包…')
    const response = await fetch('/api/sync/package', { credentials: 'include', cache: 'no-store' })
    if (!response.ok) { setMessage('离线包准备失败，请联网后重试。'); return }
    const body = await response.json() as typeof manifest
    const estimate = await navigator.storage?.estimate?.()
    if (estimate?.quota && body && body.sizeBytes > estimate.quota - (estimate.usage ?? 0)) { setMessage('本机可用存储空间不足，请先清理空间。'); return }
    setManifest(body)
    setActive(window.localStorage.getItem('family-english-package') === body?.version)
    setMessage('离线包清单已获取，请下载后校验。')
  }
  async function activate() {
    if (!manifest) return
    setMessage('正在下载并校验离线包…')
    const response = await fetch('/api/sync/package/download', { credentials: 'include', cache: 'no-store' })
    if (!response.ok) { setMessage('离线包下载失败，请联网后重试。'); return }
    const body = await response.arrayBuffer()
    const checksum = await sha256Hex(body)
    if (checksum !== manifest.checksum) { setMessage('离线包校验失败，未替换现有离线包。'); return }
    const registration = await navigator.serviceWorker.ready
    const channel = new MessageChannel()
    const activated = new Promise<boolean>((resolve) => {
      channel.port1.onmessage = (event) => resolve(event.data?.ok === true)
      setTimeout(() => resolve(false), 10_000)
    })
    registration.active?.postMessage({ type: 'ACTIVATE_PACKAGE', urls: ['/learn', ...(manifest.payload?.resources ?? [])], version: manifest.version }, [channel.port2])
    if (!await activated) { setMessage('离线包资源未能完整缓存，未完成激活。'); return }
    window.localStorage.setItem('family-english-package', manifest.version)
    setActive(true)
    setMessage('离线包已激活；敏感操作仍需联网。')
  }
  async function clearPackage() {
    const registration = await navigator.serviceWorker.ready
    registration.active?.postMessage({ type: 'CLEAR_PACKAGE' })
    window.localStorage.removeItem('family-english-package')
    setActive(false)
    setMessage('已清除本机离线包。')
  }
  return <section className="summary" aria-labelledby="offline-package-title"><h2 id="offline-package-title">离线教学包</h2><p>只包含课程核心内容和已发布的家庭内容，不包含密码、PIN 或敏感资料。</p>{manifest && <><p>版本 {manifest.version} · {manifest.sizeBytes} bytes · SHA-256 {manifest.checksum}</p><button type="button" onClick={() => void activate()} disabled={!manifest || active}>{active ? '已激活到本机' : '下载并激活离线包'}</button><button type="button" onClick={() => void clearPackage()} disabled={!active}>清除本机离线包</button></>}<button type="button" onClick={() => void prepare()}>检查并准备离线包</button>{message && <p role="status">{message}</p>}</section>
}
