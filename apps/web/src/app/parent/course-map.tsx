type Target = { id: string; title: string; strand: string; parentScript: string[]; materials: string[]; prerequisiteIds: string[]; independentPractice?: unknown }

export function CourseMap({ version, targets }: { version: string; targets: Target[] }) {
  return <details className="todayPlan"><summary>查看完整开放课程地图</summary><p>课程版本：{version}。路线始终向家长开放；孩子页面不会显示进度或落后信息。</p><div className="recordList">{targets.map((target) => <article key={target.id} className="card"><p className="eyebrow">{target.strand}</p><h3>{target.title}</h3><p>前置目标：{target.prerequisiteIds.length ? target.prerequisiteIds.join('、') : '无'}</p><p>准备：{target.materials.join('、')}</p><p>家长语言：{target.parentScript.join(' ')}</p><p>独立巩固：{target.independentPractice ? '仅在陪伴接触后开放' : '暂不开放'}</p></article>)}</div></details>
}
