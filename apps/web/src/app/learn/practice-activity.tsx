'use client'

import { useState } from 'react'

type PracticeTarget = {
  id: string
  title: string
  prompt: string
  choices: string[]
}

const responses: Record<string, string> = {
  'Help, please.': 'Help is here.',
  'Stop.': 'Stopped. You are safe.',
  'Break, please.': 'Break time. Come back when you want.',
  'All done.': 'All done. Thank you for telling me.',
}

export function PracticeActivity({ targets }: { targets: PracticeTarget[] }) {
  const [target] = useState(targets[0])
  const [message, setMessage] = useState('')

  if (!target) return <p>Practice with a parent first.</p>

  function choose(choice: string) {
    setMessage(responses[choice] ?? 'You chose it.')
  }

  return (
    <section className="practiceActivity" aria-labelledby="practice-title">
      <h2 id="practice-title">{target.title}</h2>
      <p className="practicePrompt">{target.prompt}</p>
      <div className="learnerActions">
        {target.choices.map((choice) => (
          <button className="learnerAction" key={choice} type="button" onClick={() => choose(choice)}>
            {choice}
          </button>
        ))}
      </div>
      {message ? <p className="practiceResponse" role="status">{message}</p> : null}
    </section>
  )
}
