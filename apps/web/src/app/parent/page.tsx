import { redirect } from 'next/navigation'

import { getCurrentLearner, getCurrentParent, getSessionMode } from '@/lib/api'
import { CreateLearnerForm } from './create-learner-form'
import { LearnerManagement } from './learner-management'
import { LogoutButton } from './logout-button'

export default async function ParentPage() {
  const mode = await getSessionMode()
  if (mode === 'learner') redirect('/learn')
  const session = await getCurrentParent()
  if (!session) redirect('/login')

  const learner = await getCurrentLearner()

  return (
    <main className="shell">
      <section className="card authCard" aria-labelledby="page-title">
        <p className="eyebrow">家长区</p>
        <h1 id="page-title">欢迎回来</h1>
        <p className="summary">当前登录邮箱：{session.parent.email}</p>
        {learner ? (
          <section aria-labelledby="learner-title">
            <h2 id="learner-title">孩子学习身份已建立</h2>
            <p>昵称：{learner.nickname}</p>
            <p>头像：{learner.avatarId}</p>
            <LearnerManagement learner={learner} />
          </section>
        ) : (
          <section aria-labelledby="learner-title">
            <h2 id="learner-title">建立孩子学习身份</h2>
            <p className="summary">只需要昵称、预设头像和 6 位 PIN。</p>
            <CreateLearnerForm />
          </section>
        )}
        <LogoutButton />
      </section>
    </main>
  )
}
