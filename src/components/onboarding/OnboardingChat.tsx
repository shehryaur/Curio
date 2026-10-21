'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactElement } from 'react'
import { KidSelectJurisdiction, useKidAgeGate, useKidJurisdictions, useKidStrings } from '@k-id/core'
import Pet from '@/components/Pet'
import { modeFromAge } from '@/lib/profile'
import type { PetMood, Profile } from '@/lib/types'
import { useOnboarding } from './OnboardingContext'
import styles from './Onboarding.module.css'

type Stage =
  | 'name'
  | 'age'
  | 'country' // quick chips
  | 'countryList' // "Somewhere else" / auto could not resolve: searchable list
  | 'state' // US: which state
  | 'locate' // waiting for k-ID to load the jurisdiction's rules
  | 'birthday' // only when the jurisdiction approves date-of-birth but not a plain age
  | 'interests'
  | 'checking' // k-ID age check running
  | 'email'
  | 'sending'
  | 'sent' // consent email sent: the app opens in limited mode
  | 'done'
  | 'prohibited'
  | 'fail'
  | 'error'

const COUNTRY_CHIPS = [
  { code: 'US', label: 'United States' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'KR', label: 'South Korea' },
  { code: 'IN', label: 'India' },
  { code: 'PK', label: 'Pakistan' },
  { code: 'DE', label: 'Germany' },
] as const

/** Last-resort US state when k-ID can't work with plain 'US' and the player skipped the state question. */
const US_FALLBACK = 'US-CA'

type Msg = { id: number; from: 'pip' | 'me'; text: string }

export const INTERESTS = [
  { id: 'Space', emoji: '' },
  { id: 'Art', emoji: '' },
  { id: 'Sports', emoji: '' },
  { id: 'Animals', emoji: '' },
  { id: 'Building', emoji: '' },
  { id: 'Music', emoji: '' },
  { id: 'Cooking', emoji: '' },
  { id: 'Games', emoji: '' },
] as const

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function ageFromDob(dob: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob)
  if (!m) return null
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const now = new Date()
  let age = now.getFullYear() - y
  if (now.getMonth() + 1 < mo || (now.getMonth() + 1 === mo && now.getDate() < d)) age -= 1
  return age
}

function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * True while k-ID needs a jurisdiction (jurisdiction="auto" could not be resolved). The SDK's public hooks don't
 * expose the flow `step`, but <KidSelectJurisdiction> renders only during that step — so we mount it hidden and
 * watch whether it rendered anything. The player sees our own searchable list instead.
 */
function useJurisdictionNeeded(): [boolean, ReactElement] {
  const ref = useRef<HTMLDivElement>(null)
  const [needed, setNeeded] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const check = () => setNeeded(el.childElementCount > 0)
    check()
    const obs = new MutationObserver(check)
    obs.observe(el, { childList: true })
    return () => obs.disconnect()
  }, [])
  const probe = (
    <div ref={ref} hidden aria-hidden="true">
      <KidSelectJurisdiction />
    </div>
  )
  return [needed, probe]
}

export function OnboardingChat({
  onComplete,
}: {
  onComplete: (p: Profile, info: { pending: boolean }) => void
}) {
  const ob = useOnboarding()
  const gate = useKidAgeGate()
  const jurisdictions = useKidJurisdictions()
  const subdivisionNames = useKidStrings().subdivisions
  const [jurisdictionNeeded, probe] = useJurisdictionNeeded()

  const { draft } = ob
  const name = draft.name ?? ''

  const nextId = useRef(1)
  const initial = useMemo<{ stage: Stage; msgs: Msg[] }>(() => {
    if (draft.name && draft.age !== undefined && draft.interests?.length && ob.age) {
      return { stage: 'checking', msgs: [{ id: 0, from: 'pip', text: `Let's try again, ${draft.name}!` }] }
    }
    if (draft.name && draft.age !== undefined && draft.jurisdiction) {
      return { stage: 'locate', msgs: [{ id: 0, from: 'pip', text: `One more try, ${draft.name}…` }] }
    }
    return { stage: 'name', msgs: [{ id: 0, from: 'pip', text: "Hi! I'm Pip. What's your name?" }] }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [stage, setStage] = useState<Stage>(initial.stage)
  const [msgs, setMsgs] = useState<Msg[]>(initial.msgs)
  const [mood, setMood] = useState<PetMood>('talking')
  const [text, setText] = useState('')
  const [dob, setDob] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [hint, setHint] = useState<string | null>(null)
  const [sendReq, setSendReq] = useState<{ email: string; n: number } | null>(null)

  const say = useCallback((t: string, m: PetMood = 'talking') => {
    setMsgs((prev) => [...prev, { id: nextId.current++, from: 'pip', text: t }])
    setMood(m)
    setHint(null)
  }, [])
  const reply = useCallback((t: string) => {
    setMsgs((prev) => [...prev, { id: nextId.current++, from: 'me', text: t }])
  }, [])
  const oops = useCallback((t: string) => {
    setHint(t)
    setMood('oops')
  }, [])

  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [msgs, stage, hint])

  useEffect(() => {
    if (mood !== 'talking') return
    const t = setTimeout(() => setMood('idle'), 1800)
    return () => clearTimeout(t)
  }, [mood, msgs])

  // ---- k-ID driven transitions ----

  // k-ID unreachable / rejected the jurisdiction. Plain 'US' rejected -> retry once with a state (last resort).
  useEffect(() => {
    if (gate.status !== 'error' || stage === 'error') return
    if (ob.jurisdiction === 'US' && !gate.requirements) {
      console.warn(`[curio] k-ID did not accept "US" without a state; retrying with ${US_FALLBACK} (last resort).`)
      ob.restart({ keepAnswers: true, jurisdiction: US_FALLBACK })
      return
    }
    setStage('error')
    say("Oops! I couldn't reach my helper k-ID. Let's try again.", 'oops')
  }, [gate.status, gate.requirements, stage, say, ob])

  // 'auto' only counts as unresolved once the probe has cleared (k-ID tried) and then asked again.
  const autoTried = useRef(false)
  useEffect(() => {
    if (ob.jurisdiction === 'auto' && !jurisdictionNeeded) autoTried.current = true
  }, [ob.jurisdiction, jurisdictionNeeded])

  // Wait for the jurisdiction's rules, then send the age (or ask for a birthday where only that is approved).
  useEffect(() => {
    if (stage !== 'locate') return
    if (ob.jurisdiction === 'auto' && jurisdictionNeeded && autoTried.current) {
      setStage('countryList')
      say("Hmm, I couldn't tell where you are. Can you find your country?")
      return
    }
    const req = gate.requirements
    if (!req || draft.age === undefined) return
    const methods = req.approvedAgeCollectionMethods
    if (!methods.includes('age-slider') && methods.includes('date-of-birth')) {
      setStage('birthday')
      say('One more thing! Where you live, I need your birthday')
      return
    }
    ob.setAge({ age: draft.age })
    setStage('interests')
    say(draft.age < 13 ? `${draft.age}! Awesome. What do you love? Pick a few!` : 'What do you love? Pick a few!')
  }, [stage, jurisdictionNeeded, ob, gate.requirements, draft.age, say])

  // After interests: branch on the age gate.
  useEffect(() => {
    if (stage !== 'checking' && stage !== 'email' && stage !== 'sending') return
    if (gate.status === 'pass') {
      setStage('done')
      say(`All set, ${name}! Let's explore`, 'happy')
      return
    }
    if (gate.status === 'prohibited') {
      setStage('prohibited')
      say(
        "Aww, Curio isn't open for kids your age where you live yet. Ask a grown-up to help you find other fun ways to learn!",
        'oops',
      )
      return
    }
    if (gate.status === 'fail') {
      setStage('fail')
      say("Your grown-up didn't approve this time. That's okay! We can ask again.", 'oops')
      return
    }
    if (stage === 'checking' && gate.status === 'running' && gate.challengeId) {
      setStage('email')
      setText(draft.email ?? '')
      say(
        gate.challengeKind === 'ageAssurance'
          ? "Quick check! What's your email? k-ID will send you a link to confirm your age."
          : `Awesome! Since you're ${draft.age ?? ''}, what's your parent or guardian's email? You can explore all the 3D starter objects right now, and if you snap a photo of something new, I'll ask them to approve it!`,
      )
    }
  }, [stage, gate.status, gate.challengeId, gate.challengeKind, name, draft.email, draft.age, say])

  // Send the consent email once the `email` prop reached the provider. The provider pushes props in its own effect,
  // which runs AFTER this child effect, so defer a tick (README: "set email, let it propagate, then submit()").
  const submit = gate.submit
  useEffect(() => {
    if (!sendReq || ob.email !== sendReq.email) return
    let cancelled = false
    const t = setTimeout(async () => {
      let res = await submit()
      if (!res.ok && res.code === 'invalid_request' && !cancelled) {
        await new Promise((r) => setTimeout(r, 300))
        res = await submit()
      }
      if (cancelled) return
      setSendReq(null)
      if (res.ok) {
        setStage('sent')
        say(
          gate.challengeKind === 'ageAssurance'
            ? 'I sent you a link Open it any time. Let’s explore the starter objects!'
            : 'I sent a note to your grown-up Let’s explore the starter objects while we wait!',
          'happy',
        )
      } else {
        setStage('email')
        oops("Hmm, I couldn't send that. Check the email and try again?")
      }
    }, 0)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [sendReq, ob.email, submit, say, oops, gate.challengeKind])

  // Finish: save the profile and enter the app (limited while consent is pending).
  const finished = useRef(false)
  const statusRef = useRef(gate.status)
  statusRef.current = gate.status
  const finish = useCallback(() => {
    if (finished.current) return
    const age = draft.age
    if (!draft.name || age === undefined) return
    finished.current = true
    onComplete(
      { name: draft.name, age, interests: draft.interests ?? [], mode: modeFromAge(age), isMinor: age < 18 },
      { pending: statusRef.current !== 'pass' },
    )
  }, [draft, onComplete])
  useEffect(() => {
    if (stage !== 'done' && stage !== 'sent') return
    const t = setTimeout(finish, stage === 'sent' ? 2800 : 1800)
    return () => clearTimeout(t)
  }, [stage, finish])

  // ---- answers ----

  function submitName(e: FormEvent) {
    e.preventDefault()
    const n = text.trim().replace(/\s+/g, ' ')
    if (!n) return oops('Type your name, or a nickname!')
    if (n.length > 24) return oops("That's a long one! Just your first name is perfect.")
    if (/[@\d]/.test(n)) return oops('Just your first name is perfect — no numbers or emails!')
    reply(n)
    ob.updateDraft({ name: n })
    setText('')
    setStage('age')
    say(`Nice to meet you, ${n}! How old are you?`)
  }

  function submitAge(e: FormEvent) {
    e.preventDefault()
    const n = Number(text.trim())
    if (!/^\d{1,3}$/.test(text.trim()) || n < 3 || n > 120) return oops('Type a number from 3 to 120')
    reply(String(n))
    ob.updateDraft({ age: n })
    setText('')
    setStage('country')
    say('And which country are you exploring from?')
  }

  function chooseJurisdiction(code: string, label: string) {
    reply(label)
    setQuery('')
    if (code === 'US') {
      setStage('state')
      say('Cool! Which state?')
      return
    }
    ob.setJurisdiction(code)
    ob.updateDraft({ jurisdiction: code })
    setStage('locate')
    say(code === 'auto' ? "No problem, I'll figure it out!" : 'Thanks!', 'happy')
  }

  function chooseState(code: string, label: string) {
    reply(label)
    setQuery('')
    ob.setJurisdiction(code)
    ob.updateDraft({ jurisdiction: code })
    setStage('locate')
    say('Thanks!', 'happy')
  }

  function submitBirthday(e: FormEvent) {
    e.preventDefault()
    const age = ageFromDob(dob)
    if (age === null) return oops('Pick your birthday on the calendar')
    if (age < 3 || age > 120) return oops('Hmm, that birthday looks off. Try again?')
    reply(new Date(`${dob}T12:00:00`).toLocaleDateString(undefined, { dateStyle: 'long' }))
    ob.updateDraft({ age, dateOfBirth: dob })
    ob.setAge({ dateOfBirth: dob })
    setDob('')
    setStage('interests')
    say('Thanks! What do you love? Pick a few!')
  }

  function toggleInterest(id: string) {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  }

  function submitInterests() {
    if (picked.length === 0) return oops('Tap at least one!')
    const labels = INTERESTS.filter((i) => picked.includes(i.id)).map((i) => `${i.emoji} ${i.id}`)
    reply(labels.join('  '))
    ob.updateDraft({ interests: picked })
    say('Great picks! Let me check something real quick…', 'thinking')
    setStage('checking')
  }

  function submitEmail(e: FormEvent) {
    e.preventDefault()
    const email = text.trim()
    if (!EMAIL_RE.test(email)) return oops("That doesn't look like an email. Try again?")
    reply(email)
    ob.updateDraft({ email })
    ob.setEmail(email)
    setText('')
    setStage('sending')
    setSendReq((prev) => ({ email, n: (prev?.n ?? 0) + 1 }))
  }

  const countryOptions = useMemo(() => {
    const q = query.trim().toLowerCase()
    const all = jurisdictions.filter((j) => j.code.length === 2)
    const list = q ? all.filter((j) => j.name.toLowerCase().includes(q) || j.code.toLowerCase() === q) : all
    return list.slice(0, 60)
  }, [query, jurisdictions])

  const stateOptions = useMemo(() => {
    const q = query.trim().toLowerCase()
    const all = jurisdictions
      .filter((j) => j.code.startsWith('US-'))
      .map((j) => ({ code: j.code, name: subdivisionNames[j.code] ?? j.name }))
      .sort((a, b) => a.name.localeCompare(b.name))
    return q ? all.filter((j) => j.name.toLowerCase().includes(q) || j.code.toLowerCase() === `us-${q}`) : all
  }, [query, jurisdictions, subdivisionNames])

  // ---- render ----

  const thinking = stage === 'locate' || stage === 'checking' || stage === 'sending'

  // A render helper (not a component) so the search box keeps focus while typing.
  function searchList(
    options: { code: string; name: string }[],
    placeholder: string,
    onPick: (code: string, name: string) => void,
  ) {
    return (
      <div className={styles.countryBox}>
        <input
          className={`c-input ${styles.bigInput}`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          autoFocus
          aria-label={placeholder}
        />
        <div className={styles.countryList} role="listbox" aria-label={placeholder}>
          {options.map((c) => (
            <button
              key={c.code}
              type="button"
              role="option"
              aria-selected={false}
              className={styles.countryItem}
              onClick={() => onPick(c.code, c.name)}
            >
              {c.name}
            </button>
          ))}
          {options.length === 0 && <p className="c-dim">No match. Try another spelling?</p>}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      {probe}
      <header className={styles.header}>
        <Pet mood={thinking ? 'thinking' : mood} size="md" />
      </header>

      <div className={styles.log} role="log" aria-live="polite">
        {msgs.map((m) => (
          <div key={m.id} className={m.from === 'pip' ? styles.rowPip : styles.rowMe}>
            {m.from === 'pip' && (
              <span className={styles.avatar} aria-hidden="true">
                <PipMini />
              </span>
            )}
            <div className={m.from === 'pip' ? styles.bubblePip : styles.bubbleMe}>{m.text}</div>
          </div>
        ))}
        {thinking && (
          <div className={styles.rowPip}>
            <span className={styles.avatar} aria-hidden="true">
              <PipMini />
            </span>
            <div className={`${styles.bubblePip} ${styles.typing}`} aria-label="Pip is thinking">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
        {hint && <p className={styles.hint}>{hint}</p>}
        <div ref={endRef} />
      </div>

      <div className={styles.composer}>
        {stage === 'name' && (
          <form className={styles.inputRow} onSubmit={submitName}>
            <input
              className={`c-input ${styles.bigInput}`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Your first name"
              autoComplete="given-name"
              maxLength={40}
              autoFocus
              aria-label="Your name"
            />
            <button className={`c-btn ${styles.big}`} type="submit" disabled={!text.trim()}>
              Send
            </button>
          </form>
        )}

        {stage === 'age' && (
          <form className={styles.inputRow} onSubmit={submitAge}>
            <input
              className={`c-input ${styles.bigInput}`}
              value={text}
              onChange={(e) => setText(e.target.value.replace(/\D/g, '').slice(0, 3))}
              placeholder="Your age"
              inputMode="numeric"
              pattern="[0-9]*"
              autoFocus
              aria-label="Your age"
            />
            <button className={`c-btn ${styles.big}`} type="submit" disabled={!text.trim()}>
              Send
            </button>
          </form>
        )}

        {stage === 'country' && (
          <div className={styles.chips}>
            {COUNTRY_CHIPS.map((c) => (
              <button key={c.code} type="button" className={styles.chip} onClick={() => chooseJurisdiction(c.code, c.label)}>
                {c.label}
              </button>
            ))}
            <button
              type="button"
              className={styles.chip}
              onClick={() => {
                reply(' Somewhere else')
                setStage('countryList')
                say('Type to find your country')
              }}
            >
              Somewhere else
            </button>
            <button type="button" className={styles.chip} onClick={() => chooseJurisdiction('auto', 'Not sure')}>
              Not sure
            </button>
          </div>
        )}

        {stage === 'countryList' && (
          searchList(countryOptions, 'Search your country', chooseJurisdiction)
        )}

        {stage === 'state' && (
          <div className={styles.chipsBox}>
            {searchList(stateOptions, 'Search your state', chooseState)}
            <button type="button" className={`c-btn secondary sm`} onClick={() => chooseState('US', 'Skip')}>
              Skip
            </button>
          </div>
        )}

        {stage === 'birthday' && (
          <form className={styles.inputRow} onSubmit={submitBirthday}>
            <input
              className={`c-input ${styles.bigInput}`}
              type="date"
              value={dob}
              max={todayIso()}
              min="1900-01-01"
              onChange={(e) => setDob(e.target.value)}
              autoFocus
              aria-label="Your birthday"
            />
            <button className={`c-btn ${styles.big}`} type="submit" disabled={!dob}>
              Send
            </button>
          </form>
        )}

        {stage === 'interests' && (
          <div className={styles.chipsBox}>
            <div className={styles.chips}>
              {INTERESTS.map((i) => {
                const on = picked.includes(i.id)
                return (
                  <button
                    key={i.id}
                    type="button"
                    aria-pressed={on}
                    className={`${styles.chip} ${on ? styles.chipOn : ''}`}
                    onClick={() => toggleInterest(i.id)}
                  >
                    <span aria-hidden="true">{i.emoji}</span> {i.id}
                  </button>
                )
              })}
            </div>
            <button className={`c-btn block ${styles.big}`} onClick={submitInterests} disabled={picked.length === 0}>
              Continue
            </button>
          </div>
        )}

        {stage === 'email' && (
          <form className={styles.inputRow} onSubmit={submitEmail}>
            <input
              className={`c-input ${styles.bigInput}`}
              type="email"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={gate.challengeKind === 'ageAssurance' ? 'you@example.com' : 'grownup@example.com'}
              autoComplete="email"
              autoFocus
              aria-label={gate.challengeKind === 'ageAssurance' ? 'Your email' : "Your grown-up's email"}
            />
            <button className={`c-btn ${styles.big}`} type="submit" disabled={!text.trim()}>
              Send
            </button>
          </form>
        )}

        {(stage === 'done' || stage === 'sent') && (
          <button className={`c-btn block ${styles.big}`} onClick={finish}>
            Let&apos;s explore!
          </button>
        )}

        {(stage === 'fail' || stage === 'error') && (
          <div className={styles.chips}>
            <button
              className={`c-btn ${styles.big}`}
              onClick={() => (ob.resuming ? ob.retry() : ob.restart({ keepAnswers: true }))}
            >
              Try again
            </button>
            <button className={`c-btn secondary ${styles.big}`} onClick={ob.startOver}>
              Start over
            </button>
          </div>
        )}

        {stage === 'prohibited' && (
          <button className={`c-btn secondary block ${styles.big}`} onClick={ob.startOver}>
            Start over
          </button>
        )}
      </div>
    </div>
  )
}

/** Tiny cardinal head for chat bubbles (matches Pet). */
function PipMini() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <circle cx="11" cy="13" r="7" fill="#d7263d" />
      <path d="M10 7 L 8 1 L 14 6 Z" fill="#d7263d" />
      <path d="M13 9.5c2.5-1 4.5.5 4.5 2.5-.5 1.5-2.5 2-4 1-1-1-1.2-2.5-.5-3.5Z" fill="#1d1b29" />
      <circle cx="14.6" cy="11" r="0.8" fill="#fff" />
      <path d="M17.2 11 L 21 12.2 L 17.2 13.4 Z" fill="#f29a2e" />
    </svg>
  )
}
