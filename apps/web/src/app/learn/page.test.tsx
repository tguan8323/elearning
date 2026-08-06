import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))
vi.mock('@/lib/api', () => ({
  getSessionMode: vi.fn().mockResolvedValue('learner'),
  getLearnerHome: vi.fn().mockResolvedValue({ id: 'learner-1', nickname: 'Sam', avatarId: 'fox' }),
  getPracticeTargets: vi.fn().mockResolvedValue([{
    id: 'functional-help',
    title: 'Ask for what you need',
    prompt: 'What do you need?',
    choices: ['Help, please.', 'Stop.', 'Break, please.', 'All done.'],
  }]),
  getPublishedFamilyContent: vi.fn().mockResolvedValue([]),
}))

import LearnPage from './page'

describe('child independent practice', () => {
  afterEach(cleanup)

  it('offers a calm English-only activity with large need and ending controls', async () => {
    render(await LearnPage())

    expect(screen.getByRole('heading', { name: 'Hello, Sam!' })).toBeInTheDocument()
    expect(screen.getByText('What do you need?')).toBeInTheDocument()
    for (const label of ['Help, please.', 'Stop.', 'Break, please.', 'All done.']) {
      expect(screen.getByRole('button', { name: label })).toHaveClass('learnerAction')
    }
    const activity = screen.getByRole('region', { name: 'Ask for what you need' })
    expect(activity.textContent).not.toMatch(/[㐀-鿿]/u)
    expect(screen.queryByText(/score|points|streak|timer/i)).not.toBeInTheDocument()
    expect(document.querySelector('audio, input[type="file"], [data-recording]')).toBeNull()
  })

  it.each([
    ['Help, please.', 'Help is here.'],
    ['Stop.', 'Stopped. You are safe.'],
    ['Break, please.', 'Break time. Come back when you want.'],
    ['All done.', 'All done. Thank you for telling me.'],
  ])('honors %s immediately without penalties', async (choice, response) => {
    render(await LearnPage())
    fireEvent.click(screen.getByRole('button', { name: choice }))
    expect(screen.getByRole('status')).toHaveTextContent(response)
    expect(screen.queryByText(/wrong|try again|lost|score|points/i)).not.toBeInTheDocument()
  })
})
