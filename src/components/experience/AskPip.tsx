'use client'
// "Ask Pip": typed question (ai-chat) or hold-to-talk (ai-voice-mode) -> /api/ask -> Pip speaks the answer.
import { useRef, useState } from 'react'
import { useKidPermission } from '@k-id/core'
import { postJson } from '@/lib/api'
import type { Speaker } from '@/hooks/useSpeaker'
import type { AgeMode, AskRequest, AskResponse, ObjectLesson, Profile, VoiceResponse } from '@/lib/types'
import MicButton from './MicButton'
import type { PipSay } from './shared'
import s from './experience.module.css'

interface Props {
  lesson: ObjectLesson
  mode: AgeMode
  profile: Profile
  speaker: Speaker
  pip: PipSay
  /** Voice sounded frustrated: switch to plain words and focus one part. */
  onFrustrated: () => void
}

const REASSURE = "That's okay. Let's go slowly. Look at this one part with me."

export default function AskPip({ lesson, mode, profile, speaker, pip, onFrustrated }: Props) {
  const { can } = useKidPermission()
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const seq = useRef(0)
  const chat = can('ai-chat')
  const voice = can('ai-voice-mode')

  const ask = async (question: string, m: AgeMode) => {
    const text = question.trim()
    if (!text) return
    const id = ++seq.current
    setBusy(true)
    setNote(null)
    speaker.stop()
    pip('thinking', m === 'child' ? 'Hmm, let me think…' : 'Thinking…')
    const body: AskRequest = { question: text.slice(0, 500), objectTitle: lesson.title.adult || lesson.title[m], mode: m }
    if (can('personalized-recommendations')) {
      if (profile.name) body.name = profile.name
      if (profile.interests.length) body.interests = profile.interests
    }
    const res = await postJson<AskResponse>('/api/ask', body)
    if (seq.current !== id) return
    setBusy(false)
    if (!res.ok || !res.data.answer) {
      pip('oops', "Oops, I couldn't answer that right now. Try again in a moment?")
      return
    }
    pip('talking', res.data.answer)
    await speaker.say(res.data.answer, m)
  }

  const onVoice = async (v: VoiceResponse) => {
    if (v.source === 'unavailable' && !v.transcript.trim()) {
      setNote(chat ? "Pip couldn't hear that. You can type instead." : "Pip couldn't hear that. Try again?")
      return
    }
    setNote(v.transcript ? `You said: “${v.transcript}”` : null)
    let m = mode
    if (v.isFrustrated) {
      m = 'plainWords'
      onFrustrated()
      pip('talking', REASSURE)
      await speaker.say(REASSURE, m)
    }
    if (v.transcript.trim()) await ask(v.transcript, m)
  }

  if (!chat && !voice) {
    return <p className={s.note}>Asking Pip questions is off. A grown-up can turn it on in Settings ⚙️.</p>
  }

  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <form
        className={s.askBar}
        onSubmit={(e) => {
          e.preventDefault()
          const text = q
          setQ('')
          void ask(text, mode)
        }}
      >
        {chat && (
          <>
            <input
              className="c-input"
              placeholder={mode === 'child' ? 'Ask Pip anything…' : 'Ask Pip a question…'}
              value={q}
              maxLength={500}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Ask Pip"
            />
            <button className="c-btn sm" type="submit" disabled={busy || !q.trim()}>
              Ask
            </button>
          </>
        )}
        {voice && (
          <MicButton
            isMinor={profile.isMinor}
            disabled={busy}
            onStart={() => {
              speaker.stop()
              setNote(null)
            }}
            onResult={onVoice}
            onError={setNote}
          />
        )}
        {!chat && voice && <span className={s.note} style={{ alignSelf: 'center' }}>Hold the button and ask Pip</span>}
      </form>
      {note && <p className={s.note}>{note}</p>}
    </div>
  )
}
