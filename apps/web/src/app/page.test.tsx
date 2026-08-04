import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import HomePage from './page'

vi.mock('@/lib/api', () => ({ getHealth: vi.fn() }))

import { getHealth } from '@/lib/api'

const mockedGetHealth = vi.mocked(getHealth)

describe('HomePage', () => {
  beforeEach(() => mockedGetHealth.mockReset())

  it('shows a healthy API connection', async () => {
    mockedGetHealth.mockResolvedValue({ status: 'ok', service: 'family-english-api' })

    render(await HomePage())

    expect(screen.getByRole('heading', { name: '家庭英语教学网站' })).toBeInTheDocument()
    expect(screen.getByText('前端与后端连接正常')).toBeInTheDocument()
  })
})
