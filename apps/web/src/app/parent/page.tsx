import { redirect } from 'next/navigation'

import { getCurrentParent } from '@/lib/api'
import { LogoutButton } from './logout-button'

export default async function ParentPage() {
  const session = await getCurrentParent()
  if (!session) redirect('/login')

  return (
    <main className="shell">
      <section className="card authCard" aria-labelledby="page-title">
        <p className="eyebrow">家长区</p>
        <h1 id="page-title">欢迎回来</h1>
        <p className="summary">当前登录邮箱：{session.parent.email}</p>
        <LogoutButton />
      </section>
    </main>
  )
}
