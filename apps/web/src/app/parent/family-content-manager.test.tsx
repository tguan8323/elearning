import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const refresh = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))

import { FamilyContentManager } from './family-content-manager'

describe('FamilyContentManager', () => {
  afterEach(() => { cleanup(); refresh.mockReset(); vi.unstubAllGlobals() })

  it('explains truthful registration, lifecycle, and copyright boundaries', () => {
    render(<FamilyContentManager items={[]} />)
    expect(screen.getByText(/登记的是内容元数据，不会上传文件/)).toBeInTheDocument()
    const lifecycle = screen.getByLabelText('内容生命周期')
    for (const stage of ['草稿', '入目录', '绑定', '发布', '撤回 / 删除']) expect(lifecycle).toHaveTextContent(stage)
    expect(screen.getByLabelText('版权责任提示')).toHaveTextContent('请勿登记或分享商业教材')
    expect(screen.getByRole('button', { name: '登记元数据为草稿' })).toBeInTheDocument()
  })

  it('renders catalog metadata as a preview snapshot without claiming upload', () => {
    render(<FamilyContentManager items={[{ id: '1', title: 'Bedtime Words', contentType: 'word-list', language: '英语', source: '家长原创', rightsNote: '仅限家庭使用', description: '睡前五个词', status: 'cataloged' }]} />)
    expect(screen.getByRole('heading', { name: 'Bedtime Words' })).toBeInTheDocument()
    expect(screen.getByText('家长原创')).toBeInTheDocument()
    expect(screen.getByText(/目录预览快照，不是已上传文件/)).toBeInTheDocument()
  })

  it('registers catalog fields through the anticipated REST endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
    render(<FamilyContentManager items={[]} />)
    fireEvent.change(screen.getByLabelText('标题'), { target: { value: 'Family Rhyme' } })
    fireEvent.change(screen.getByLabelText('来源 / 作者'), { target: { value: '家长原创' } })
    fireEvent.change(screen.getByLabelText('使用权说明'), { target: { value: '本人原创，仅限家庭使用' } })
    fireEvent.submit(screen.getByRole('button', { name: '登记元数据为草稿' }).closest('form')!)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
    expect(fetchMock).toHaveBeenCalledWith('/api/family-content', expect.objectContaining({ method: 'POST', credentials: 'include' }))
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual(expect.objectContaining({ title: 'Family Rhyme', contentType: 'story', source: '家长原创' }))
    expect(refresh).toHaveBeenCalledOnce()
  })
})
