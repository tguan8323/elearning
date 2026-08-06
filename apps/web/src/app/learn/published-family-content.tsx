import type { FamilyContentItem } from '@/lib/api'

export function PublishedFamilyContent({ items }: { items: FamilyContentItem[] }) {
  if (!items.length) return null

  return (
    <section className="publishedContent" aria-labelledby="family-content-title">
      <h2 id="family-content-title">My family collection</h2>
      {items.map((item) => (
        <article key={item.id}>
          <h3>{item.title}</h3>
          {item.mediaType === 'audio' || item.contentType === 'audio' ? <audio controls preload="none" src={`/api/learner/family-content/${item.id}/media`} /> : null}
        </article>
      ))}
    </section>
  )
}
