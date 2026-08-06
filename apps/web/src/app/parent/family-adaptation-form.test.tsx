import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { FamilyAdaptationForm } from './family-adaptation-form'

const initial = { sessionMinutes: 15, sessionsPerWeek: 5, accent: 'en-US' as const, reducedMotion: true, soundEnabled: true, interests: [], excludedThemes: ['强烈声音'], availableMaterials: ['Flash Cards'] }
const catalog = [{ id: 'ort-physical-books', title: 'ORT 实体书', kind: 'physical-book-navigation', description: '仅记录实体书导航信息。', fields: ['书名', '书架位置'] }]

describe('FamilyAdaptationForm', () => {
  afterEach(() => { cleanup(); vi.restoreAllMocks() })

  it('edits controls and saves the complete strict payload', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(initial), { status: 200 }))
    render(<FamilyAdaptationForm initial={initial} catalog={catalog} />)
    fireEvent.change(screen.getByLabelText(/每次时长/), { target: { value: '20' } })
    fireEvent.click(screen.getByLabelText(/启用提示音/))
    fireEvent.change(screen.getByLabelText(/感兴趣/), { target: { value: '太空\n动物' } })
    fireEvent.click(screen.getByRole('button', { name: '保存家庭适配' }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    const request = fetchMock.mock.calls[0]!
    expect(request[0]).toBe('/api/learning/adaptation')
    expect(JSON.parse(String(request[1]?.body))).toMatchObject({ sessionMinutes: 20, accent: 'en-US', soundEnabled: false, interests: ['太空', '动物'] })
    expect(await screen.findByText('家庭适配已保存。')).toBeInTheDocument()
  })

  it('resets defaults and labels protected catalog as metadata only', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(initial), { status: 200 }))
    render(<FamilyAdaptationForm initial={{ ...initial, sessionMinutes: 30 }} catalog={catalog} />)
    expect(screen.getByText(/不包含受保护的卡面/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '恢复默认' }))
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledWith('/api/learning/adaptation/reset', expect.objectContaining({ method: 'POST' })))
    expect(await screen.findByText('已恢复默认设置。')).toBeInTheDocument()
  })
})
