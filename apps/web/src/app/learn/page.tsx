import { redirect } from 'next/navigation'

import { getLearnerHome, getPracticeTargets, getSessionMode } from '@/lib/api'
import { ReturnToParentForm } from './return-to-parent-form'

export default async function LearnPage() {
  const mode = await getSessionMode()
  if (!mode) redirect('/login')
  if (mode === 'parent') redirect('/parent')
  const learner = await getLearnerHome()
  if (!learner) redirect('/login')
  const practice = await getPracticeTargets()

  return (
    <main className="shell learnerShell">
      <section className="card learnerCard" aria-labelledby="learn-title">
        <p className="avatarDisplay" aria-hidden="true">{learner.avatarId === 'fox' ? '🦊' : learner.avatarId === 'panda' ? '🐼' : '🐬'}</p>
        <h1 id="learn-title">Hello, {learner.nickname}!</h1>
        <p className="summary">Ready to practice?</p>
        {practice.length ? practice.map((target) => <button key={target.id} type="button">{target.title}</button>) : <p>Practice with a parent first.</p>}
        <ReturnToParentForm />
      </section>
    </main>
  )
}
