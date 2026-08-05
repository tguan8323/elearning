import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const refresh = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))

import { CreateLearnerForm } from './create-learner-form'

describe('CreateLearnerForm', () => {
  afterEach(() => {
    cleanup()
    refresh.mockReset()
    vi.unstubAllGlobals()
  })

  it('collects only a nickname, preset avatar, and concealed six-digit PIN', () => {
    render(<CreateLearnerForm />)

    expect(screen.getByLabelText('孩子昵称')).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(3)
    expect(screen.getByLabelText('6 位数字 PIN')).toHaveAttribute('type', 'password')
    expect(screen.getByLabelText('6 位数字 PIN')).toHaveAttribute('pattern', '[0-9]{6}')
    expect(screen.getByLabelText('再次输入 PIN')).toHaveAttribute('type', 'password')
    expect(screen.queryByLabelText(/真实姓名|生日|学校|诊断/)).not.toBeInTheDocument()
  })

  it('rejects mismatched PIN values without sending them', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    render(<CreateLearnerForm />)

    fireEvent.change(screen.getByLabelText('孩子昵称'), { target: { value: '小星' } })
    fireEvent.change(screen.getByLabelText('6 位数字 PIN'), { target: { value: '123456' } })
    fireEvent.change(screen.getByLabelText('再次输入 PIN'), { target: { value: '654321' } })
    fireEvent.submit(screen.getByRole('button', { name: '建立孩子学习身份' }).closest('form')!)

    expect(await screen.findByRole('alert')).toHaveTextContent('两次输入的 PIN 不一致')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('submits through the same-origin API and refreshes after success', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 201 })
    vi.stubGlobal('fetch', fetchMock)
    render(<CreateLearnerForm />)

    fireEvent.change(screen.getByLabelText('孩子昵称'), { target: { value: '小星' } })
    fireEvent.change(screen.getByLabelText('6 位数字 PIN'), { target: { value: '123456' } })
    fireEvent.change(screen.getByLabelText('再次输入 PIN'), { target: { value: '123456' } })
    fireEvent.submit(screen.getByRole('button', { name: '建立孩子学习身份' }).closest('form')!)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/learners', expect.any(Object)))
    const options = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(JSON.parse(String(options.body))).toEqual({
      nickname: '小星',
      avatarId: 'fox',
      pin: '123456',
    })
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce())
  })
})
