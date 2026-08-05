import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))
vi.mock('@/lib/api', () => ({ getCurrentParent: vi.fn().mockResolvedValue(null) }))

import LoginPage from './login/page'

describe('LoginPage', () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('shows parent login without a registration link', async () => {
    render(await LoginPage())

    expect(screen.getByRole('heading', { name: '登录家庭英语教学网站' })).toBeInTheDocument()
    expect(screen.getByLabelText('家长邮箱')).toBeInTheDocument()
    expect(screen.getByLabelText('密码')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /注册/ })).not.toBeInTheDocument()
  })

  it('uses the same-origin auth proxy and distinguishes network failures', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network unavailable'))
    vi.stubGlobal('fetch', fetchMock)
    render(await LoginPage())

    fireEvent.change(screen.getByLabelText('家长邮箱'), {
      target: { value: 'parent@example.com' },
    })
    fireEvent.change(screen.getByLabelText('密码'), {
      target: { value: 'password' },
    })
    fireEvent.submit(screen.getByRole('button', { name: '登录' }).closest('form')!)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', expect.any(Object)))
    expect(await screen.findByRole('alert')).toHaveTextContent('无法连接服务器')
  })
})
