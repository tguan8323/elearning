'use client'

import { FormEvent, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type Slot = { id: string; title: string; purpose: string; acceptedMimeTypes: string[]; maxFileSize: number; learnerEligible: boolean }
type Item = { id: string; title: string; mediaType?: string; contentType?: string; language?: string; rightsNote?: string; description?: string; status?: 'draft' | 'cataloged' | 'bound' | 'published' | 'withdrawn'; source: string; purpose?: string; versions?: Array<{ id: string; fileName: string; mimeType: string; fileSize: number; uploadState: string; bindings?: Array<{ id: string; publications?: Array<{ id: string; state: string }> }> }> }

export function FamilyContentManager({ items }: { items: Item[] }) {
  const router = useRouter(); const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState(''); const [status, setStatus] = useState(''); const [saving, setSaving] = useState(false)
  const [slots, setSlots] = useState<Slot[]>([])
  async function loadSlots() { const response = await fetch('/api/family-content/slots', { credentials: 'include' }); if (response.ok) setSlots(await response.json() as Slot[]) }
  async function withdraw(publicationId: string) { const response = await fetch(`/api/family-content/publications/${publicationId}/withdraw`, { method: 'POST', credentials: 'include' }); if (response.ok) { setStatus('内容已从孩子页面撤回。'); router.refresh() } else setError('撤回失败，请稍后重试。') }
  async function lifecycle(versionId: string, slotId: string) { setError(''); const binding = await fetch(`/api/family-content/versions/${versionId}/bind`, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ slotId }) }); if (!binding.ok) { setError('绑定失败，请检查插槽兼容性。'); return }; const result = await binding.json() as { id: string }; const published = await fetch(`/api/family-content/bindings/${result.id}/publish`, { method: 'POST', credentials: 'include' }); if (!published.ok) { setError('绑定成功，但发布失败，请稍后重试。'); return }; setStatus('内容已明确发布给孩子。'); router.refresh() }
  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setStatus(''); setSaving(true)
    const formElement = event.currentTarget
    const form = new FormData(formElement); const file = fileRef.current?.files?.[0]
    if (!file) { setError('请选择要上传的文件。'); setSaving(false); return }
    const body = { title: String(form.get('title') || ''), mediaType: String(form.get('mediaType') || ''), source: String(form.get('source') || ''), purpose: String(form.get('purpose') || ''), targetLanguage: 'en-US', courseRefs: [], stimulusFeatures: [], mimeType: file.type, fileName: file.name, fileSize: file.size, acceptCopyrightResponsibility: form.get('rights') === 'on' }
    try {
      const created = await fetch('/api/family-content/assets', { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
      if (!created.ok) throw new Error('登记失败，请检查文件类型、大小和版权确认。')
      const asset = await created.json() as Item; const version = asset.versions?.[0]
      if (!version) throw new Error('服务未返回可上传的文件版本。')
      const upload = await fetch(`/api/family-content/versions/${version.id}/upload`, { method: 'POST', credentials: 'include', headers: { 'content-type': file.type }, body: file })
      if (!upload.ok) throw new Error('文件上传失败，可稍后重试。')
      setStatus('文件已上传，仍需绑定插槽并由家长明确发布。'); formElement.reset(); router.refresh()
    } catch (cause) { setError(cause instanceof Error ? cause.message : '无法连接服务，请稍后重试。') } finally { setSaving(false) }
  }
  return <section className="privateContent" aria-labelledby="private-content-title">
    <p className="eyebrow">家庭私有内容</p><h2 id="private-content-title">上传家庭内容</h2>
    <p className="formHint">文件只属于本家庭；上传完成不等于发布，孩子只有在家长明确发布后才能看到。</p>
    <aside className="copyrightNotice" aria-label="版权责任提示"><p>仅上传原创或已获授权内容。请勿上传商业教材、书页、插图、录音或其他受保护内容。</p></aside>
    <form className="authForm" onSubmit={register}>
      <label htmlFor="content-title">标题</label><input id="content-title" name="title" required maxLength={120} />
      <label htmlFor="media-type">媒体类型</label><select id="media-type" name="mediaType" defaultValue="image" required><option value="image">图片</option><option value="audio">音频</option><option value="video">视频</option><option value="document">文档</option><option value="text">文本</option></select>
      <label htmlFor="content-source">来源 / 作者</label><input id="content-source" name="source" required placeholder="例如：家长原创" />
      <label htmlFor="content-purpose">家庭学习用途</label><input id="content-purpose" name="purpose" required placeholder="例如：复习本周目标词" />
      <label htmlFor="content-file">文件（PNG/JPEG/MP3/WAV/MP4/PDF/TXT，最大 25MB）</label><input ref={fileRef} id="content-file" type="file" required accept="image/png,image/jpeg,audio/mpeg,audio/wav,video/mp4,application/pdf,text/plain" />
      <label><input name="rights" type="checkbox" required /> 我确认拥有或获准使用此内容，并承担版权责任。</label>
      {error && <p role="alert">{error}</p>}{status && <p role="status">{status}</p>}<button disabled={saving} type="submit">{saving ? '正在上传…' : '上传为未发布内容'}</button>
    </form>
    <section className="contentCatalog"><h3>已上传内容</h3>{items.length ? items.map(item => <article className="contentSnapshot" key={item.id}><h4>{item.title}</h4><p>{item.mediaType ?? item.contentType ?? '未分类'} · {item.source} · {item.purpose ?? item.description ?? '未填写用途'}</p>{item.versions?.map(v => <div key={v.id}><p className="formHint">{v.fileName} · {v.uploadState}</p><a href={`/api/family-content/versions/${v.id}/preview`} target="_blank" rel="noreferrer">预览文件</a>{v.bindings?.flatMap(binding => binding.publications ?? []).filter(publication => publication.state === 'PUBLISHED').map(publication => <button key={publication.id} type="button" onClick={() => { if (window.confirm('确认从孩子页面撤回此内容？')) void withdraw(publication.id) }}>撤回发布</button>)}{v.uploadState === 'UPLOADED' && <div><label htmlFor={`slot-${v.id}`}>发布插槽</label><select id={`slot-${v.id}`} defaultValue="" onFocus={() => { if (!slots.length) void loadSlots() }}><option value="" disabled>选择插槽</option>{slots.map(slot => <option key={slot.id} value={slot.id}>{slot.title}{slot.learnerEligible ? '（孩子可见）' : '（仅家长）'}</option>)}</select><button type="button" onClick={() => { const select = document.getElementById(`slot-${v.id}`) as HTMLSelectElement; if (select.value) void lifecycle(v.id, select.value) }}>绑定并发布</button></div>}</div>)}</article>) : <p className="formHint">还没有上传内容。</p>}</section>
  </section>
}
