import { redirect } from 'next/navigation'

import { getCurrentParent } from '@/lib/api'
import { LoginForm } from './login-form'

export default async function LoginPage() {
  if (await getCurrentParent()) redirect('/parent')

  return (
    <main className="shell">
      <section className="card authCard" aria-labelledby="page-title">
        <p className="eyebrow">家长区</p>
        <h1 id="page-title">登录家庭英语教学网站</h1>
        <p className="summary">使用已经安全初始化的家长账号登录。</p>
        <LoginForm />
      </section>
    </main>
  )
}
