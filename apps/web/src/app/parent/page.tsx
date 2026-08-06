import { redirect } from 'next/navigation'

import { getCurrentLearner, getCurrentParent, getEvidenceSummary, getFamilyAdaptation, getFamilyContentCatalog, getLearningPlan, getMaterialsCatalog, getSessionMode } from '@/lib/api'
import { FamilyAdaptationForm } from './family-adaptation-form'
import { CreateLearnerForm } from './create-learner-form'
import { DataGovernanceCenter } from './data-governance-center'
import { FamilyContentManager } from './family-content-manager'
import { LearnerManagement } from './learner-management'
import { LogoutButton } from './logout-button'
import { TeachingRecords } from './teaching-records'
import { StartLesson } from './start-lesson'

export default async function ParentPage() {
  const mode = await getSessionMode()
  if (mode === 'learner') redirect('/learn')
  const session = await getCurrentParent()
  if (!session) redirect('/login')

  const learner = await getCurrentLearner()
  const [plan, evidence, familyContent, adaptation, materialsCatalog] = await Promise.all([
    learner ? getLearningPlan() : Promise.resolve(null),
    learner ? getEvidenceSummary() : Promise.resolve(null),
    getFamilyContentCatalog(),
    getFamilyAdaptation(),
    getMaterialsCatalog(),
  ])

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
            <DataGovernanceCenter />
            {evidence ? (
              <section className="todayPlan" aria-labelledby="review-title">
                <p className="eyebrow">学习证据回顾</p>
                <h2 id="review-title">回顾建议</h2>
                <p>{evidence.trendSummary}</p>
                {evidence.reviewQueue.length > 0 ? (
                  <ul>{evidence.reviewQueue.map((item) => <li key={item.id}><strong>{item.title}</strong>：{item.reason}</li>)}</ul>
                ) : <p>当前没有需要优先安排的回顾项。</p>}
              </section>
            ) : null}
            {plan ? (
              <section className="todayPlan" aria-labelledby="today-title">
                <p className="eyebrow">今日建议</p>
                <h2 id="today-title">{plan.target.title}</h2>
                <p>只引入这一个主要新目标。</p>
                <h3>准备教具</h3>
                <ul>{plan.target.materials.map((item) => <li key={item}>{item}</li>)}</ul>
                <h3>家长可以这样说</h3>
                <ul>{plan.target.parentScript.map((line) => <li key={line}>{line}</li>)}</ul>
                <StartLesson target={plan.target} />
              </section>
            ) : null}
          </section>
        ) : (
          <section aria-labelledby="learner-title">
            <h2 id="learner-title">建立孩子学习身份</h2>
            <p className="summary">只需要昵称、预设头像和 6 位 PIN。</p>
            <CreateLearnerForm />
          </section>
        )}
        {adaptation ? <FamilyAdaptationForm initial={adaptation} catalog={materialsCatalog} /> : null}
        {learner ? <TeachingRecords /> : null}
        <FamilyContentManager items={familyContent} />
        <LogoutButton />
      </section>
    </main>
  )
}
