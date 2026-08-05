'use client'

import type { LearnerProfile } from '@family-english/contracts'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

const avatars = [
  { id: 'fox', label: '小狐狸' },
  { id: 'panda', label: '小熊猫' },
  { id: 'dolphin', label: '小海豚' },
]

export function LearnerManagement({ learner }: { learner: LearnerProfile }) {
  const router = useRouter()
  const [message, setMessage] = useState('')

  async function enter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const response = await fetch('/api/mode/learner', {
      method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pin: data.get('pin') }),
    }).catch(() => null)
    if (response?.ok) router.push('/learn')
    else setMessage(response?.status === 429 ? '尝试次数过多，请稍后再试' : 'PIN 不正确')
  }

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const response = await fetch('/api/learners/current', {
      method: 'PATCH', credentials: 'include', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ nickname: data.get('nickname'), avatarId: data.get('avatarId') }),
    }).catch(() => null)
    if (response?.ok) { setMessage('资料已更新'); router.refresh() }
    else setMessage('无法更新资料')
  }

  async function updatePin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const pin = String(data.get('pin') ?? '')
    if (pin !== data.get('confirmPin')) { setMessage('两次输入的 PIN 不一致'); return }
    const response = await fetch('/api/learners/current/pin', {
      method: 'PATCH', credentials: 'include', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: data.get('password'), pin }),
    }).catch(() => null)
    if (response?.ok) { form.reset(); setMessage('PIN 已更新，旧 PIN 已失效') }
    else setMessage(response?.status === 401 ? '邮箱或密码不正确' : '无法更新 PIN')
  }

  return (
    <div className="managementStack">
      <form className="authForm" onSubmit={enter}>
        <h3>进入孩子学习区</h3>
        <label htmlFor="switch-pin">6 位数字 PIN</label>
        <input id="switch-pin" name="pin" type="password" inputMode="numeric" pattern="[0-9]{6}" required />
        <button type="submit">进入孩子学习区</button>
      </form>
      <details>
        <summary>编辑孩子资料</summary>
        <form className="authForm" onSubmit={updateProfile}>
          <label htmlFor="edit-nickname">孩子昵称</label>
          <input id="edit-nickname" name="nickname" defaultValue={learner.nickname} maxLength={24} required />
          <label htmlFor="edit-avatar">预设头像</label>
          <select id="edit-avatar" name="avatarId" defaultValue={learner.avatarId}>
            {avatars.map((avatar) => <option key={avatar.id} value={avatar.id}>{avatar.label}</option>)}
          </select>
          <button type="submit">保存资料</button>
        </form>
      </details>
      <details>
        <summary>修改 PIN</summary>
        <form className="authForm" onSubmit={updatePin}>
          <label htmlFor="parent-password">家长密码</label>
          <input id="parent-password" name="password" type="password" autoComplete="current-password" required />
          <label htmlFor="new-pin">新 PIN</label>
          <input id="new-pin" name="pin" type="password" inputMode="numeric" pattern="[0-9]{6}" required />
          <label htmlFor="confirm-new-pin">确认新 PIN</label>
          <input id="confirm-new-pin" name="confirmPin" type="password" inputMode="numeric" pattern="[0-9]{6}" required />
          <button type="submit">更新 PIN</button>
        </form>
      </details>
      {message ? <p role="status">{message}</p> : null}
    </div>
  )
}
