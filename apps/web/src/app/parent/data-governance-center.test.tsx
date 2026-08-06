import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const refresh = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))

import { DataGovernanceCenter } from './data-governance-center'

const exported = {
  exportedAt: '2026-08-06T10:00:00.000Z',
  learner: { id: 'learner-1', nickname: '小安', avatarId: 'fox', createdAt: '2026-01-01', updatedAt: '2026-01-02' },
  adaptation: null,
  teachingSessions: [{ id: 'session-1', targetId: 'phonics-1', status: 'COMPLETED', createdAt: '2026-08-05T10:00:00.000Z' }],
  observations: [{ id: 'observation-1' }],
  summary: '孩子 小安：共 1 条教学记录、1 条学习观察。',
}

describe('DataGovernanceCenter', () => {
  afterEach(() => { cleanup(); refresh.mockReset(); vi.unstubAllGlobals() })

  it('clearly explains offline and private-object implications', () => {
    render(<DataGovernanceCenter />)
    expect(screen.getByLabelText('离线与私有对象说明')).toHaveTextContent('下载目录')
    expect(screen.getByLabelText('离线与私有对象说明')).toHaveTextContent('私有文件或对象存储中的原始内容不包含在本导出中')
    expect(screen.getByText(/不会增加设备授权步骤/)).toBeInTheDocument()
  })

  it('reverifies password and offers JSON and readable exports', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => exported })
    vi.stubGlobal('fetch', fetchMock)
    render(<DataGovernanceCenter />)
    fireEvent.click(screen.getByText('导出孩子数据'))
    fireEvent.change(screen.getByLabelText('导出用家长密码'), { target: { value: 'secret' } })
    fireEvent.click(screen.getByRole('button', { name: '验证并准备导出' }))
    await waitFor(() => expect(screen.getByRole('button', { name: '下载机器可读 JSON' })).toBeInTheDocument())
    expect(screen.getByRole('button', { name: '下载易读文本' })).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith('/api/learners/current/export', expect.objectContaining({ method: 'POST', body: JSON.stringify({ password: 'secret' }) }))
  })

  it('requires an inline confirmation before deleting one teaching session', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => exported })
      .mockResolvedValueOnce({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
    render(<DataGovernanceCenter />)
    fireEvent.click(screen.getByText('导出孩子数据'))
    fireEvent.change(screen.getByLabelText('导出用家长密码'), { target: { value: 'secret' } })
    fireEvent.click(screen.getByRole('button', { name: '验证并准备导出' }))
    await screen.findByRole('button', { name: '删除这条记录' })
    fireEvent.click(screen.getByRole('button', { name: '删除这条记录' }))
    expect(fetchMock).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: '确认删除这一条' }))
    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith('/api/learning/sessions/session-1', { method: 'DELETE', credentials: 'include' }))
    expect(await screen.findByText(/相关学习观察不会随之删除/)).toBeInTheDocument()
  })

  it('previews impact then requires nickname and a second password confirmation', async () => {
    const preview = { nickname: '小安', impact: { teachingSessions: 3, observations: 5 }, confirmationToken: 'token', expiresAt: '2026-08-06T10:10:00Z' }
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => preview })
      .mockResolvedValueOnce({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
    render(<DataGovernanceCenter />)
    fireEvent.click(screen.getByText('永久删除孩子身份'))
    fireEvent.change(screen.getByLabelText('预览用家长密码'), { target: { value: 'first-password' } })
    fireEvent.click(screen.getByRole('button', { name: '预览删除影响' }))
    await screen.findByLabelText('删除影响预览')
    expect(screen.getByLabelText('删除影响预览')).toHaveTextContent('3 条教学记录')
    expect(screen.getByLabelText('删除影响预览')).toHaveTextContent('5 条学习观察')
    fireEvent.change(screen.getByLabelText(/输入孩子昵称/), { target: { value: '小安' } })
    fireEvent.change(screen.getByLabelText('再次输入家长密码'), { target: { value: 'second-password' } })
    fireEvent.click(screen.getByRole('button', { name: '永久删除孩子身份和数据' }))
    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith('/api/learners/current', expect.objectContaining({
      method: 'DELETE', body: JSON.stringify({ password: 'second-password', confirmationToken: 'token', confirm: true }),
    })))
    expect(refresh).toHaveBeenCalledOnce()
  })
})
