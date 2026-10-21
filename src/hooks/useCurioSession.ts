// Global state: persona, kid session, current prop, step, mode, isPro. Shared
// (Implemented by the frontend agent: app state + tour player. Used once, in src/app/page.tsx.)
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useKidPermission, useKidSession } from '@k-id/core'
import { PERSONAS, isMinorMode, modeFromAgeStatus, type Persona } from '@/lib/personas'
import { FALLBACK_TOURS } from '@/lib/fallbackTours'
import { postJson } from '@/lib/api'
import { sleep, speak } from '@/lib/speak'
import type {
  AgeMode,
  AnalyzeRequest,
  AnalyzeResponse,
  AskRequest,
  AskResponse,
  PropType,
  TourStep,
  VoiceResponse,
} from '@/lib/types'

export type StepNumber = 1 | 2 | 3
export const LOCKED_LINE = 'This part needs a grown-up. Ask them to unlock it!'

export function useCurioSession() {
  const { session } = useKidSession()
  const { can } = useKidPermission()

  // `personalized-recommendations` OFF => no persona/mood adaptation: everyone hears the 'teen'
  // scripts as the standard lesson, and frustration does NOT auto-switch to plain words (a note is shown).
  // Hazard locking still follows the persona/k-ID age (it is a safety rule, not personalization).
  const personalized = can('personalized-recommendations')

  // --- who is watching ---------------------------------------------------------------------
  const [personaId, setPersonaIdState] = useState<string | null>(null) // null = use k-ID ageStatus
  const [modeOverride, setModeOverride] = useState<AgeMode | null>(null) // set by frustration
  const persona: Persona | null = PERSONAS.find((p) => p.id === personaId) ?? null
  const kidMode = modeFromAgeStatus(session?.ageStatus)
  const baseMode: AgeMode = persona?.mode ?? kidMode
  const mode: AgeMode = personalized ? modeOverride ?? baseMode : 'teen'
  const isMinor = isMinorMode(baseMode)
  const jurisdiction = persona?.jurisdiction ?? session?.jurisdiction

  // --- object / tour -----------------------------------------------------------------------
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)
  const [lastImage, setLastImage] = useState<string | null>(null)
  const [activeStep, setActiveStep] = useState<StepNumber | null>(null)
  const [hazardsUnlocked, setHazardsUnlocked] = useState(false)
  const [guardianOpen, setGuardianOpen] = useState(false)

  // --- speech ------------------------------------------------------------------------------
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [tourPlaying, setTourPlaying] = useState(false)
  const [subtitle, setSubtitle] = useState('')
  const [speechNote, setSpeechNote] = useState<string | null>(null)
  const ctrlRef = useRef<AbortController | null>(null)

  // --- ask / voice -------------------------------------------------------------------------
  const [lastTranscript, setLastTranscript] = useState<string | null>(null)
  const [lastEmotion, setLastEmotion] = useState<string | null>(null)
  const [lastAnswer, setLastAnswer] = useState<string | null>(null)
  const [asking, setAsking] = useState(false)
  const [askError, setAskError] = useState<string | null>(null)
  const [voiceNote, setVoiceNote] = useState<string | null>(null)

  const stop = useCallback(() => {
    ctrlRef.current?.abort()
    ctrlRef.current = null
    setIsSpeaking(false)
    setTourPlaying(false)
  }, [])

  useEffect(() => () => ctrlRef.current?.abort(), [])

  const begin = () => {
    ctrlRef.current?.abort()
    const c = new AbortController()
    ctrlRef.current = c
    setSpeechNote(null)
    return c
  }
  const finish = (c: AbortController) => {
    if (ctrlRef.current === c) {
      ctrlRef.current = null
      setIsSpeaking(false)
      setTourPlaying(false)
    }
  }
  const say = async (text: string, m: AgeMode, c: AbortController) => {
    setSubtitle(text)
    setIsSpeaking(true)
    const r = await speak(text, m, c.signal)
    if (r.error && !c.signal.aborted) setSpeechNote(r.error)
  }

  const isStepLocked = useCallback(
    (step: Pick<TourStep, 'isHazardForChild'>) => step.isHazardForChild && isMinor && !hazardsUnlocked,
    [isMinor, hazardsUnlocked],
  )
  const lineFor = (step: TourStep, m: AgeMode) => (isStepLocked(step) ? LOCKED_LINE : step.scripts[m])

  const setPersona = useCallback(
    (id: string | null) => {
      setPersonaIdState(id)
      setModeOverride(null) // new viewer => drop any frustration override
    },
    [],
  )

  const analyze = useCallback(
    async (input: { imageBase64?: string; propHint?: PropType }) => {
      stop()
      setAnalyzing(true)
      setAnalyzeError(null)
      if (input.imageBase64) setLastImage(input.imageBase64)
      const body: AnalyzeRequest = { ...input, mode, jurisdiction }
      const res = await postJson<AnalyzeResponse>('/api/analyze', body)
      setAnalyzing(false)
      if (res.ok && Array.isArray(res.data.steps) && res.data.steps.length === 3) {
        setAnalysis(res.data)
        setActiveStep(1)
        return
      }
      const why = res.ok ? 'bad response shape' : res.error
      if (input.propHint && input.propHint !== 'wildcard') {
        // Demo must never depend on the server: use the canned tour bundled in the client.
        setAnalysis({ ...FALLBACK_TOURS[input.propHint], source: 'fallback' })
        setActiveStep(1)
        setAnalyzeError(`Analyze failed (${why}); using the offline tour.`)
      } else {
        setAnalyzeError(`Couldn't analyze the photo (${why}). Try a demo object below.`)
      }
    },
    [mode, jurisdiction, stop],
  )

  const playTour = useCallback(async () => {
    if (!analysis) return
    const c = begin()
    setTourPlaying(true)
    try {
      for (const step of analysis.steps) {
        if (c.signal.aborted) break
        setActiveStep(step.stepNumber)
        await say(lineFor(step, mode), mode, c)
        await sleep(400, c.signal)
      }
    } finally {
      finish(c)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysis, mode, isStepLocked])

  const playStep = useCallback(
    async (n: StepNumber, m: AgeMode = mode) => {
      const step = analysis?.steps.find((s) => s.stepNumber === n)
      setActiveStep(n)
      if (!step) return
      const c = begin()
      try {
        await say(lineFor(step, m), m, c)
      } finally {
        finish(c)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [analysis, mode, isStepLocked],
  )

  /** Pin click: locked hazard => guardian modal, else focus + explain that one part. */
  const selectPin = useCallback(
    (n: StepNumber) => {
      const step = analysis?.steps.find((s) => s.stepNumber === n)
      if (step && isStepLocked(step)) {
        setActiveStep(n)
        setGuardianOpen(true)
        return
      }
      void playStep(n)
    },
    [analysis, isStepLocked, playStep],
  )

  const askOwl = useCallback(
    async (question: string, m: AgeMode = mode) => {
      const q = question.trim()
      if (!q) return
      setAsking(true)
      setAskError(null)
      const body: AskRequest = { question: q, objectTitle: analysis?.objectTitle ?? 'this object', mode: m }
      const res = await postJson<AskResponse>('/api/ask', body)
      setAsking(false)
      if (!res.ok) {
        setAskError(`The owl couldn't answer (${res.error}).`)
        return
      }
      setLastAnswer(res.data.answer)
      const c = begin()
      try {
        await say(res.data.answer, m, c)
      } finally {
        finish(c)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [analysis, mode],
  )

  /** Called by MicButton with the /api/voice result. */
  const handleVoice = useCallback(
    async (v: VoiceResponse) => {
      setLastTranscript(v.transcript)
      setLastEmotion(v.emotion)
      setVoiceNote(v.source === 'unavailable' ? `Voice service unavailable${v.error ? ` (${v.error})` : ''}.` : null)
      let m = mode
      if (v.isFrustrated) {
        if (personalized) {
          setModeOverride('plainWords')
          setActiveStep(1) // zoom/focus on just one part
          m = 'plainWords'
        } else {
          setVoiceNote('You sound frustrated, but adapted lessons are off in Settings, so the lesson stays the same.')
        }
      }
      if (v.transcript.trim()) await askOwl(v.transcript, m)
    },
    [mode, personalized, askOwl],
  )

  const unlockHazards = useCallback(() => {
    setHazardsUnlocked(true)
    setGuardianOpen(false)
  }, [])

  return {
    // who
    session,
    persona,
    personaId,
    setPersona,
    kidMode,
    baseMode,
    mode,
    modeOverride,
    clearModeOverride: () => setModeOverride(null),
    personalized,
    isMinor,
    jurisdiction,
    // object
    analysis,
    analyzing,
    analyzeError,
    analyze,
    lastImage,
    activeStep,
    setActiveStep,
    selectPin,
    isStepLocked,
    hazardsUnlocked,
    unlockHazards,
    guardianOpen,
    openGuardian: () => setGuardianOpen(true),
    closeGuardian: () => setGuardianOpen(false),
    // speech
    isSpeaking,
    tourPlaying,
    subtitle,
    speechNote,
    playTour,
    playStep,
    stop,
    // ask / voice
    askOwl,
    asking,
    askError,
    lastAnswer,
    lastTranscript,
    lastEmotion,
    voiceNote,
    handleVoice,
  }
}

export type CurioSession = ReturnType<typeof useCurioSession>
