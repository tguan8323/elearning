import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { CastingView } from './casting-view'

const storageKey = 'family-english:current-cast-content'

describe('CastingView', () => {
  afterEach(() => {
    cleanup()
    window.localStorage.clear()
  })

  it('shows only the current child-facing content', () => {
    window.localStorage.setItem(storageKey, JSON.stringify({ sessionId: 'session-1', text: 'Listen.' }))

    render(<CastingView />)

    expect(screen.getByText('Listen.')).toBeInTheDocument()
    expect(screen.queryByText(/家长|教学|分析|笔记|管理/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('renders an empty view when no lesson content is active', () => {
    const { container } = render(<CastingView />)

    expect(container.querySelector('.castingContent')).toHaveTextContent('')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
