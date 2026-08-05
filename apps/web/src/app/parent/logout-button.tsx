'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

const AUTH_API_URL = '/api/auth'

export function LogoutButton() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  async function logout() {
    setSubmitting(true)
    await fetch(`${AUTH_API_URL}/logout`, { method: 'POST', credentials: 'include' })
    router.replace('/login')
    router.refresh()
  }

  return <button onClick={logout} disabled={submitting}>{submitting ? '正在退出…' : '退出登录'}</button>
}
