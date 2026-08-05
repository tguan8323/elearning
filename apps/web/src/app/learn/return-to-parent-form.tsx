'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

export function ReturnToParentForm() {
  const router = useRouter()
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const response = await fetch('/api/mode/parent', {
      method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: data.get('password') }),
    }).catch(() => null)
    if (response?.ok) router.push('/parent')
    else setError(response?.status === 429 ? '尝试次数过多，请稍后再试' : '邮箱或密码不正确')
  }

  return (
    <details className="parentReturn">
      <summary>请家长操作</summary>
      <form className="authForm" onSubmit={submit}>
        <label htmlFor="return-password">家长密码</label>
        <input id="return-password" name="password" type="password" autoComplete="current-password" required />
        {error ? <p role="alert">{error}</p> : null}
        <button type="submit">返回家长区</button>
      </form>
    </details>
  )
}
