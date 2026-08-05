'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

const avatars = [
  { id: 'fox', label: '小狐狸' },
  { id: 'panda', label: '小熊猫' },
  { id: 'dolphin', label: '小海豚' },
]

export function CreateLearnerForm() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const form = event.currentTarget
    const data = new FormData(form)
    const pin = String(data.get('pin') ?? '')
    const confirmPin = String(data.get('confirmPin') ?? '')
    if (pin !== confirmPin) {
      setError('两次输入的 PIN 不一致')
      return
    }

    setSubmitting(true)
    const response = await fetch('/api/learners', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        nickname: data.get('nickname'),
        avatarId: data.get('avatarId'),
        pin,
      }),
    }).catch(() => null)
    setSubmitting(false)

    if (!response) setError('无法连接服务器，请稍后重试')
    else if (response.status === 409) setError('孩子学习身份已经建立')
    else if (!response.ok) setError('无法建立孩子学习身份，请检查输入')
    else {
      form.reset()
      router.refresh()
    }
  }

  return (
    <form className="authForm" onSubmit={submit}>
      <label htmlFor="nickname">孩子昵称</label>
      <input id="nickname" name="nickname" maxLength={24} required />

      <fieldset className="avatarChoices">
        <legend>选择头像</legend>
        {avatars.map((avatar, index) => (
          <label key={avatar.id}>
            <input
              type="radio"
              name="avatarId"
              value={avatar.id}
              defaultChecked={index === 0}
            />
            {avatar.label}
          </label>
        ))}
      </fieldset>

      <label htmlFor="pin">6 位数字 PIN</label>
      <input
        id="pin"
        name="pin"
        type="password"
        inputMode="numeric"
        autoComplete="new-password"
        pattern="[0-9]{6}"
        minLength={6}
        maxLength={6}
        required
      />
      <label htmlFor="confirmPin">再次输入 PIN</label>
      <input
        id="confirmPin"
        name="confirmPin"
        type="password"
        inputMode="numeric"
        autoComplete="new-password"
        pattern="[0-9]{6}"
        minLength={6}
        maxLength={6}
        required
      />
      <p className="formHint">PIN 只用于已登录家长会话中的孩子模式切换，不能单独登录。</p>
      {error ? <p role="alert">{error}</p> : null}
      <button type="submit" disabled={submitting}>
        {submitting ? '正在建立…' : '建立孩子学习身份'}
      </button>
    </form>
  )
}
