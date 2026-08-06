import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { PublishedFamilyContent } from './published-family-content'

describe('PublishedFamilyContent', () => {
  afterEach(cleanup)

  it('shows the family collection supplied by the published-only API seam', () => {
    render(<PublishedFamilyContent items={[{ id: 'p1', title: 'Our Garden Words', contentType: 'word-list', language: '英语', source: '家长原创', rightsNote: '家庭使用', description: 'Words from our garden', status: 'published' }]} />)
    expect(screen.getByRole('heading', { name: 'My family collection' })).toBeInTheDocument()
    expect(screen.getByText('Our Garden Words')).toBeInTheDocument()
  })

  it('renders no section when no published content is returned', () => {
    render(<PublishedFamilyContent items={[]} />)
    expect(screen.queryByRole('heading', { name: 'My family collection' })).not.toBeInTheDocument()
  })
})
