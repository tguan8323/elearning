'use client'

import { useEffect, useState } from 'react'

const CAST_STORAGE_KEY = 'family-english:current-cast-content'
const CAST_CHANNEL = 'family-english:lesson-cast'

export type CastContent = {
  sessionId: string
  text: string
}

function readCurrentContent(): CastContent | null {
  try {
    const value = window.localStorage.getItem(CAST_STORAGE_KEY)
    return value ? JSON.parse(value) as CastContent : null
  } catch {
    return null
  }
}

export function CastingView() {
  const [content, setContent] = useState<CastContent | null>(() => {
    if (typeof window === 'undefined') return null
    return readCurrentContent()
  })

  useEffect(() => {
    const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(CAST_CHANNEL)
    const receive = (event: MessageEvent<CastContent>) => setContent(event.data)
    const receiveStored = (event: StorageEvent) => {
      if (event.key === CAST_STORAGE_KEY) setContent(readCurrentContent())
    }

    channel?.addEventListener('message', receive)
    window.addEventListener('storage', receiveStored)
    return () => {
      channel?.removeEventListener('message', receive)
      channel?.close()
      window.removeEventListener('storage', receiveStored)
    }
  }, [])

  return (
    <main className="castingView" aria-live="polite">
      <p className="castingContent">{content?.text ?? ''}</p>
    </main>
  )
}

export function publishCastContent(content: CastContent) {
  window.localStorage.setItem(CAST_STORAGE_KEY, JSON.stringify(content))
  if (typeof BroadcastChannel !== 'undefined') {
    const channel = new BroadcastChannel(CAST_CHANNEL)
    channel.postMessage(content)
    channel.close()
  }
}
