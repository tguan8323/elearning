import { redirect } from 'next/navigation'

import { getLearnerHome, getSessionMode } from '@/lib/api'
import { ReturnToParentForm } from './return-to-parent-form'

export default async function LearnPage() {
  const mode = await getSessionMode()
  if (!mode) redirect('/login')
  if (mode === 'parent') redirect('/parent')
  const learner = await getLearnerHome()
  if (!learner) redirect('/login')

  return (
    <main className="shell learnerShell">
      <section className="card learnerCard" aria-labelledby="learn-title">
        <p className="avatarDisplay" aria-hidden="true">{learner.avatarId === 'fox' ? '🦊' : learner.avatarId === 'panda' ? '🐼' : '🐬'}</p>
        <h1 id="learn-title">Hello, {learner.nickname}!</h1>
        <p className="summary">Ready to practice?</p>
        <button type="button">Start</button>
        <ReturnToParentForm />
      </section>
    </main>
  )
}
