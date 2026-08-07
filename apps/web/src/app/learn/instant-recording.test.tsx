import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { InstantRecording } from './instant-recording'

describe('InstantRecording', () => {
  it('records locally without network or indexedDB access', async () => {
    const stopTrack = vi.fn()
    const recorder = vi.fn().mockImplementation(function (this: MediaRecorder) {
      const mock = this as unknown as { mimeType: string; state: RecordingState; start: () => void; stop: () => void; ondataavailable?: (event: BlobEvent) => void; onstop?: (event: Event) => void }
      mock.mimeType = 'audio/webm'
      mock.state = 'recording'
      mock.start = vi.fn()
      mock.stop = vi.fn(() => { mock.state = 'inactive'; mock.ondataavailable?.({ data: new Blob(['audio']) } as BlobEvent); mock.onstop?.({} as Event) })
    })
    Object.assign(globalThis, { MediaRecorder: recorder, fetch: vi.fn(), indexedDB: undefined })
    Object.assign(navigator, { mediaDevices: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop: stopTrack }] }) } })
    Object.assign(URL, { createObjectURL: vi.fn().mockReturnValue('blob:local'), revokeObjectURL: vi.fn() })
    render(<InstantRecording />)
    fireEvent.click(screen.getByRole('button', { name: 'Record' }))
    await waitFor(() => expect(screen.getByText('Recording on this device…')).toBeVisible())
    fireEvent.click(screen.getByRole('button', { name: 'Stop' }))
    await waitFor(() => expect(document.querySelector('audio')).toHaveAttribute('src', 'blob:local'))
    expect(fetch).not.toHaveBeenCalled()
    expect(stopTrack).toHaveBeenCalled()
  })
})
