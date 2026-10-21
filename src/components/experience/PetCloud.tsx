'use client'
// Interactive Pip with an attached Thought Cloud for typed & voice questions.
import { useState, useRef } from 'react'
import Pet from '@/components/Pet'
import { postJson } from '@/lib/api'
import { useSpeaker } from '@/hooks/useSpeaker'
import type { AgeMode, AskRequest, AskResponse, ObjectLesson, PetMood, Profile, VoiceResponse } from '@/lib/types'
import MicButton from './MicButton'
import s from './experience.module.css'

interface Props {
  mode: AgeMode
  profile: Profile
  lesson?: ObjectLesson | null
  initialMessage?: string
  mood?: PetMood
  onFrustrated?: () => void
  onFocusPart?: (partId: string) => void
  size?: 'sm' | 'md' | 'lg'
}

export default function PetCloud({
  mode,
  profile,
  lesson,
  initialMessage,
  mood: initialMood = 'happy',
  onFrustrated,
  onFocusPart,
  size = 'md',
}: Props) {
  const speaker = useSpeaker()
  const [expanded, setExpanded] = useState(false)
  const [inputVal, setInputVal] = useState('')
  const [currentMood, setCurrentMood] = useState<PetMood>(initialMood)
  const [message, setMessage] = useState(initialMessage || "Hi! I'm Pip! Tap my thought cloud to ask me anything.")
  const [busy, setBusy] = useState(false)
  const [lastAnswer, setLastAnswer] = useState<string | null>(null)
  const [voiceNote, setVoiceNote] = useState<string | null>(null)
  const seq = useRef(0)

  const ask = async (question: string) => {
    const text = question.trim()
    if (!text || busy) return

    const id = ++seq.current
    setBusy(true)
    setVoiceNote(null)
    speaker.stop()
    setCurrentMood('thinking')
    setMessage(mode === 'child' ? 'Hmm, let me think…' : 'Thinking…')

    const objectTitle = lesson ? (lesson.title.adult || lesson.title[mode] || 'this object') : 'things around us'
    const parts = lesson?.parts?.map((p) => ({
      id: p.id,
      name: p.name.adult || p.name[mode] || p.id,
    }))

    const body: AskRequest = {
      question: text.slice(0, 500),
      objectTitle,
      mode,
      name: profile.name,
      interests: profile.interests,
      parts,
    }

    try {
      const res = await postJson<AskResponse>('/api/ask', body)
      if (seq.current !== id) return
      setBusy(false)

      if (!res.ok || !res.data.answer) {
        setCurrentMood('oops')
        setMessage("Oops, I couldn't find an answer right now. Want to ask something else?")
        return
      }

      const answer = res.data.answer
      setLastAnswer(answer)
      setMessage(answer)
      setCurrentMood('talking')
      if (res.data.focusPartId && onFocusPart) {
        onFocusPart(res.data.focusPartId)
      }
      await speaker.say(answer, mode)
      setCurrentMood('happy')
    } catch {
      setBusy(false)
      setCurrentMood('oops')
      setMessage("Oops! Let's try asking that again in a moment.")
    }
  }

  const onVoiceResult = async (v: VoiceResponse) => {
    if (v.source === 'unavailable' && !v.transcript.trim()) {
      setVoiceNote("Pip couldn't quite hear that. Try speaking closer or typing below!")
      return
    }
    if (v.transcript) {
      setVoiceNote(`You asked: "${v.transcript}"`)
    }
    if (v.isFrustrated && onFrustrated) {
      onFrustrated()
    }
    if (v.transcript.trim()) {
      await ask(v.transcript)
    }
  }

  // Quick suggestion prompts
  const suggestions = lesson
    ? [
        `How does it work?`,
        `What is it made of?`,
        `Why is it shaped like that?`,
      ]
    : [
        `Why is the sky blue?`,
        `How do honeybees fly?`,
        `Why do leaves change color?`,
      ]

  return (
    <div className={s.petCloudContainer}>
      <div className={s.petCloudRow}>
        <div className={s.petAvatarWrap}>
          <Pet mood={currentMood} size={size} />
        </div>

        {/* Thought / Speech Cloud */}
        <div className={`${s.thoughtCloud} ${expanded ? s.cloudExpanded : ''}`}>
          <div className={s.cloudBubble}>
            <div className={s.cloudContent}>
              <p className={s.cloudText}>{message}</p>

              {voiceNote && <p className={s.cloudVoiceNote}>{voiceNote}</p>}

              {!expanded ? (
                <button
                  className={s.askTriggerBtn}
                  onClick={() => setExpanded(true)}
                  aria-label="Ask Pip anything"
                >
                  <span className={s.cloudIcon} aria-hidden>
                    💭
                  </span>
                  <span>Ask anything…</span>
                  <span className={s.cloudMicPill} aria-hidden>
                    🎙️
                  </span>
                </button>
              ) : (
                <div className={s.cloudForm}>
                  {/* Suggestions */}
                  <div className={s.cloudSuggestions}>
                    {suggestions.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        className={s.cloudChip}
                        onClick={() => {
                          setInputVal(sug)
                          void ask(sug)
                        }}
                        disabled={busy}
                      >
                        {sug}
                      </button>
                    ))}
                  </div>

                  {/* Input Row */}
                  <form
                    className={s.cloudInputRow}
                    onSubmit={(e) => {
                      e.preventDefault()
                      const val = inputVal
                      setInputVal('')
                      void ask(val)
                    }}
                  >
                    <input
                      className={s.cloudInput}
                      placeholder={mode === 'child' ? 'Ask Pip anything…' : 'Type a question…'}
                      value={inputVal}
                      onChange={(e) => setInputVal(e.target.value)}
                      disabled={busy}
                      autoFocus
                    />
                    <div className={s.cloudActions}>
                      <MicButton
                        isMinor={profile.isMinor}
                        disabled={busy}
                        onResult={onVoiceResult}
                        onError={(err) => setVoiceNote(err)}
                      />
                      <button
                        type="submit"
                        className={s.cloudSendBtn}
                        disabled={busy || !inputVal.trim()}
                      >
                        Ask
                      </button>
                      <button
                        type="button"
                        className={s.cloudCloseBtn}
                        onClick={() => setExpanded(false)}
                        title="Close"
                      >
                        ✕
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
