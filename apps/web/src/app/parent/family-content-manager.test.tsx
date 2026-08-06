import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const refresh = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))
import { FamilyContentManager } from './family-content-manager'

describe('FamilyContentManager', () => {
  afterEach(() => { cleanup(); refresh.mockReset(); vi.unstubAllGlobals() })

  it('explains upload, explicit publication, and copyright boundaries', () => {
    render(<FamilyContentManager items={[]} />)
    expect(screen.getByText(/上传完成不等于发布/)).toBeInTheDocument()
    expect(screen.getByLabelText('版权责任提示')).toHaveTextContent('请勿上传商业教材')
    expect(screen.getByLabelText(/文件（PNG/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '上传为未发布内容' })).toBeInTheDocument()
  })

  it('renders uploaded versions without claiming publication', () => {
    render(<FamilyContentManager items={[{ id: '1', title: 'Bedtime Words', mediaType: 'text', source: '家长原创', purpose: '复习目标词', versions: [{ id: 'v1', fileName: 'words.txt', mimeType: 'text/plain', fileSize: 5, uploadState: 'UPLOADED' }] }]} />)
    expect(screen.getByRole('heading', { name: 'Bedtime Words' })).toBeInTheDocument()
    expect(screen.getByText(/text · 家长原创 · 复习目标词/)).toBeInTheDocument()
    expect(screen.getByText(/words.txt · UPLOADED/)).toBeInTheDocument()
  })

  it('creates an asset and uploads its selected file through separate endpoints', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'a1', title: 'Family Rhyme', mediaType: 'text', source: '家长原创', purpose: '复习', versions: [{ id: 'v1' }] }) })
      .mockResolvedValueOnce({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
    render(<FamilyContentManager items={[]} />)
    fireEvent.change(screen.getByLabelText('标题'), { target: { value: 'Family Rhyme' } })
    fireEvent.change(screen.getByLabelText('来源 / 作者'), { target: { value: '家长原创' } })
    fireEvent.change(screen.getByLabelText('家庭学习用途'), { target: { value: '复习' } })
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.change(screen.getByLabelText(/文件（PNG/), { target: { files: [new File(['hello'], 'rhyme.txt', { type: 'text/plain' })] } })
    fireEvent.submit(screen.getByRole('button', { name: '上传为未发布内容' }).closest('form')!)
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/family-content/assets')
    expect(fetchMock.mock.calls[1]?.[0]).toBe('/api/family-content/versions/v1/upload')
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce())
  })
})
