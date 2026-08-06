'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

import type { FamilyContentItem } from '@/lib/api'

export function FamilyContentManager({ items }: { items: FamilyContentItem[] }) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSaving(true)
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const body = Object.fromEntries(['title', 'contentType', 'language', 'source', 'rightsNote', 'description'].map((key) => [key, form.get(key)]))

    try {
      const response = await fetch('/api/family-content', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!response.ok) {
        setError('登记失败，请稍后重试。')
        return
      }
      formElement.reset()
      router.refresh()
    } catch {
      setError('无法连接服务，请稍后重试。')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="privateContent" aria-labelledby="private-content-title">
      <p className="eyebrow">家庭私有内容</p>
      <h2 id="private-content-title">登记内容目录</h2>
      <p className="formHint">这里登记的是内容元数据，不会上传文件，也不代表内容已经发布给孩子。</p>

      <ol className="lifecycle" aria-label="内容生命周期">
        <li><strong>草稿</strong><span>先记录想法</span></li>
        <li><strong>入目录</strong><span>补全来源与权利信息</span></li>
        <li><strong>绑定</strong><span>关联家庭学习目标</span></li>
        <li><strong>发布</strong><span>家长确认后孩子才可见</span></li>
        <li><strong>撤回 / 删除</strong><span>停止展示或永久移除</span></li>
      </ol>

      <aside className="copyrightNotice" aria-label="版权责任提示">
        <strong>版权责任提示</strong>
        <p>仅登记您原创、已获授权或依法可使用的家庭内容。请勿登记或分享商业教材、教材扫描件、付费课程或其他侵权内容。家长负责核实来源与使用权。</p>
      </aside>

      <form className="authForm" onSubmit={register}>
        <label htmlFor="content-title">标题</label>
        <input id="content-title" name="title" required maxLength={120} />
        <label htmlFor="content-type">内容类型</label>
        <select id="content-type" name="contentType" defaultValue="story" required>
          <option value="story">家庭故事</option><option value="word-list">词汇清单</option><option value="activity">亲子活动</option><option value="original-audio">原创音频说明</option>
        </select>
        <label htmlFor="content-language">语言</label>
        <input id="content-language" name="language" defaultValue="英语" required />
        <label htmlFor="content-source">来源 / 作者</label>
        <input id="content-source" name="source" required placeholder="例如：家长原创" />
        <label htmlFor="rights-note">使用权说明</label>
        <input id="rights-note" name="rightsNote" required placeholder="例如：本人原创，仅限家庭使用" />
        <label htmlFor="content-description">内容摘要</label>
        <textarea id="content-description" name="description" rows={4} maxLength={500} />
        {error ? <p role="alert">{error}</p> : null}
        <button disabled={saving} type="submit">{saving ? '正在登记…' : '登记元数据为草稿'}</button>
      </form>

      <section className="contentCatalog" aria-labelledby="catalog-title">
        <h3 id="catalog-title">目录与预览快照</h3>
        {items.length ? items.map((item) => (
          <article className="contentSnapshot" key={item.id}>
            <div><span className="statusBadge">{item.status}</span><h4>{item.title}</h4></div>
            <dl><dt>类型</dt><dd>{item.contentType}</dd><dt>语言</dt><dd>{item.language}</dd><dt>来源</dt><dd>{item.source}</dd><dt>使用权</dt><dd>{item.rightsNote}</dd></dl>
            {item.description ? <p>{item.description}</p> : <p className="formHint">尚未填写摘要</p>}
            <p className="formHint">这是目录预览快照，不是已上传文件。仅“published”状态会出现在孩子端。</p>
          </article>
        )) : <p className="formHint">还没有登记内容。新登记项会先成为草稿。</p>}
      </section>
    </section>
  )
}
