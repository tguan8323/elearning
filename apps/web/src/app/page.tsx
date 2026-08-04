import { getHealth } from '@/lib/api'

export default async function HomePage() {
  const health = await getHealth()

  return (
    <main className="shell">
      <section className="card" aria-labelledby="page-title">
        <p className="eyebrow">工程基线</p>
        <h1 id="page-title">家庭英语教学网站</h1>
        <p className="summary">
          前后端开发仓库已经建立。下一阶段将从家长登录、孩子学习身份和第一条教学闭环开始。
        </p>
        <div className="status" role="status">
          <span className={health ? 'dot dotOnline' : 'dot'} aria-hidden="true" />
          <span>{health ? '前端与后端连接正常' : '后端暂未连接'}</span>
        </div>
      </section>
    </main>
  )
}
