'use client'

import { useState } from 'react'

export function OfflinePackage() {
  const [message, setMessage] = useState('')
  const [active, setActive] = useState(false)
  const [manifest, setManifest] = useState<{ version: string; checksum: string; sizeBytes: number } | null>(null)
  async function prepare() { setMessage('正在准备离线包…'); const response = await fetch('/api/sync/package', { credentials: 'include', cache: 'no-store' }); if (!response.ok) { setMessage('离线包准备失败，请联网后重试。'); return }; const body = await response.json() as typeof manifest; setManifest(body); setActive(window.localStorage.getItem('family-english-package') === body?.version); setMessage('离线包清单已校验，可激活本机使用。') }
  function activate() { if (!manifest) return; window.localStorage.setItem('family-english-package', manifest.version); setActive(true); setMessage('离线包已激活；敏感操作仍需联网。') }
  return <section className="summary" aria-labelledby="offline-package-title"><h2 id="offline-package-title">离线教学包</h2><p>只包含课程核心内容和已发布的家庭内容，不包含密码、PIN 或敏感资料。</p>{manifest && <><p>版本 {manifest.version} · {manifest.sizeBytes} bytes · SHA-256 {manifest.checksum}</p><button type="button" onClick={activate} disabled={active}>{active ? '已激活到本机' : '激活离线包'}</button></>}<button type="button" onClick={() => void prepare()}>检查并准备离线包</button>{message && <p role="status">{message}</p>}</section>
}
