import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { StartLesson } from './start-lesson'

const target = {
  id: 'target-1',
  title: 'Ready / Look / Listen',
  parentScript: ['Ready?', 'Look.', 'Listen.', 'Your turn.', 'All done.'],
  materials: ['a toy'],
}

describe('StartLesson casting', () => {
  afterEach(() => {
    cleanup()
    window.localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('opens the unauthorised casting route and publishes current content', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'session-1' }) }))
    render(<StartLesson target={target} />)

    fireEvent.click(screen.getByRole('button', { name: '开始 15 分钟教学' }))
    const link = await screen.findByRole('link', { name: '打开孩子画面' })

    expect(link).toHaveAttribute('href', '/cast')
    expect(link).toHaveAttribute('target', '_blank')
    expect(JSON.parse(window.localStorage.getItem('family-english:current-cast-content')!)).toEqual({
      sessionId: 'session-1', text: 'Ready?',
    })

    fireEvent.click(screen.getByRole('button', { name: '下一步' }))
    await waitFor(() => expect(JSON.parse(window.localStorage.getItem('family-english:current-cast-content')!).text).toBe('Look.'))
  })
})
