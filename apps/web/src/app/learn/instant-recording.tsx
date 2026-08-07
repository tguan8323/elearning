'use client'

import { useEffect, useRef, useState } from 'react'

export function InstantRecording() {
  const recorder = useRef<MediaRecorder | null>(null)
  const stream = useRef<MediaStream | null>(null)
  const [audioUrl, setAudioUrl] = useState('')
  const [message, setMessage] = useState('Optional: record and listen on this device only.')

  useEffect(() => () => {
    stream.current?.getTracks().forEach((track) => track.stop())
    if (audioUrl) URL.revokeObjectURL(audioUrl)
  }, [audioUrl])

  async function start() {
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.current = media
      const chunks: Blob[] = []
      const next = new MediaRecorder(media)
      next.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data) }
      next.onstop = () => {
        if (audioUrl) URL.revokeObjectURL(audioUrl)
        setAudioUrl(URL.createObjectURL(new Blob(chunks, { type: next.mimeType })))
        media.getTracks().forEach((track) => track.stop())
        setMessage('Ready to listen. This recording was not uploaded or saved.')
      }
      recorder.current = next
      next.start()
      setMessage('Recording on this device…')
    } catch {
      setMessage('Microphone is unavailable. You can skip this activity.')
    }
  }

  function stop() { if (recorder.current?.state === 'recording') recorder.current.stop() }
  function clear() { if (audioUrl) URL.revokeObjectURL(audioUrl); setAudioUrl(''); setMessage('Recording cleared.') }

  return <section aria-label="Listen to yourself"><p>{message}</p><div className="lessonActions"><button onClick={() => void start()}>Record</button><button onClick={stop}>Stop</button><button className="secondaryButton" onClick={clear}>Skip / clear</button></div>{audioUrl ? <audio controls src={audioUrl} /> : null}</section>
}
