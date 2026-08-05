'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

const AUTH_API_URL = '/api/auth'

export function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    const data = new FormData(event.currentTarget)
    const response = await fetch(`${AUTH_API_URL}/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: data.get('email'), password: data.get('password') }),
    }).catch(() => null)
    setSubmitting(false)
    if (!response) {
      setError('无法连接服务器，请确认后端服务已启动')
      return
    }
    if (response.status === 401) {
      setError('邮箱或密码不正确')
      return
    }
    if (!response.ok) {
      setError('登录暂时不可用，请稍后重试')
      return
    }
    router.push('/parent')
    router.refresh()
  }

  return (
    <form className="authForm" onSubmit={submit}>
      <label htmlFor="email">家长邮箱</label>
      <input id="email" name="email" type="email" autoComplete="username" required />
      <label htmlFor="password">密码</label>
      <input id="password" name="password" type="password" autoComplete="current-password" required />
      {error ? <p role="alert">{error}</p> : null}
      <button type="submit" disabled={submitting}>{submitting ? '正在登录…' : '登录'}</button>
    </form>
  )
}
