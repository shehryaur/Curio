'use client'
// One object: 3D viewer + Pip + Learn / Quiz / Explore + Ask Pip.
import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'
import Pet from '@/components/Pet'
import ViewerLoading from '@/components/three/ViewerLoading'
import { useSpeaker } from '@/hooks/useSpeaker'
import type { MeshyModelState } from '@/hooks/useMeshyModel'
import type { Activity, AgeMode, ObjectLesson, PetMood, Profile } from '@/lib/types'
import AskPip from './AskPip'
import ExplorePanel from './ExplorePanel'
import LearnPanel from './LearnPanel'
import QuizPanel from './QuizPanel'
import type { PanelProps, PartHandlers } from './shared'
import s from './experience.module.css'

const ObjectViewer = dynamic(() => import('@/components/three/ObjectViewer'), {
  ssr: false,
  loading: () => <ViewerLoading text="Loading the 3D model…" />,
})

interface Props {
  lesson: ObjectLesson
  mode: AgeMode
  profile: Profile
  photoUrl: string | null
  meshy: MeshyModelState
  /** Settings is open on top: be quiet. */
  suspended: boolean
  onBack: () => void
  onFrustrated: () => void
}

const TABS: { id: Activity; label: string; emoji: string }[] = [
  { id: 'learn', label: 'Learn', emoji: '📖' },
  { id: 'quiz', label: 'Quiz', emoji: '🎯' },
  { id: 'explore', label: 'Explore', emoji: '🔍' },
]

export default function ObjectScreen({ lesson, mode, profile, photoUrl, meshy, suspended, onBack, onFrustrated }: Props) {
  const speaker = useSpeaker()
  const [activity, setActivity] = useState<Activity>('learn')
  const [pipState, setPipState] = useState<{ mood: PetMood; message: string }>({ mood: 'idle', message: lesson.intro[mode] })
  const [focus, setFocus] = useState<string | null>(null)
  const [focusOverride, setFocusOverride] = useState<string | null>(null)
  const [highlight, setHighlight] = useState<string | null>(null)
  const [explode, setExplode] = useState(0)
  const [xray, setXray] = useState(false)
  const partHandlers = useRef<PartHandlers>({})

  const pip = useCallback((mood: PetMood, message: string) => setPipState({ mood, message }), [])

  useEffect(() => {
    if (suspended) speaker.stop()
  }, [suspended, speaker])

  const switchTo = (a: Activity) => {
    if (a === activity) return
    speaker.stop()
    setFocus(null)
    setFocusOverride(null)
    setHighlight(null)
    setActivity(a)
  }

  const frustrated = () => {
    onFrustrated()
    setFocusOverride(lesson.parts[0]?.id ?? null)
    setHighlight(lesson.parts[0]?.id ?? null)
  }

  const glbUrl = meshy.glbUrl
  const canExplode = !!lesson.templateId && !glbUrl
  const shownMood: PetMood = pipState.mood === 'talking' && !speaker.speaking ? 'idle' : pipState.mood

  const panelProps: PanelProps = {
    lesson,
    mode,
    speaker,
    pip,
    setFocus,
    setHighlight,
    partHandlers,
  }

  return (
    <>
      <div className={s.backRow}>
        <button className={s.backBtn} onClick={onBack}>
          ← Home
        </button>
        <h1 className={s.title}>
          <span aria-hidden>{lesson.emoji}</span>
          <span>{lesson.title[mode]}</span>
        </h1>
      </div>

      <div className={s.viewer}>
        <ObjectViewer
          lesson={lesson}
          mode={mode}
          glbUrl={glbUrl}
          photoUrl={glbUrl ? null : photoUrl}
          focusPartId={focusOverride ?? (activity === 'learn' ? focus : null)}
          highlightPartId={highlight}
          interaction={activity === 'learn' ? 'none' : activity === 'quiz' ? 'click' : 'hover'}
          showLabels={activity === 'explore'}
          explode={activity === 'explore' && canExplode ? explode : 0}
          xray={xray}
          onPartHover={(id) => partHandlers.current.hover?.(id)}
          onPartClick={(id) => partHandlers.current.click?.(id)}
        />
        {meshy.phase === 'building' && (
          <div className={s.buildBar}>
            <span>Building your 3D model… {meshy.progress}%</span>
            <div className="c-progress" aria-hidden>
              <span style={{ width: `${Math.max(4, meshy.progress)}%` }} />
            </div>
          </div>
        )}
      </div>
      {(lesson.templateId === 'bottle' || lesson.templateId === 'camera') && (
        <p className={s.note} style={{ fontSize: '11px', textAlign: 'center', margin: '4px 0 0' }}>
          3D model: Khronos glTF Sample Assets (CC0)
        </p>
      )}
      {meshy.phase === 'failed' && meshy.note && <p className={s.note}>{meshy.note}</p>}

      <div className={s.pipRow}>
        <Pet mood={shownMood} message={pipState.message} size="md" />
      </div>

      <div className={s.tabs} role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={activity === t.id}
            className={`${s.tab} ${activity === t.id ? s.tabActive : ''}`}
            onClick={() => switchTo(t.id)}
          >
            <span className={s.tabEmoji} aria-hidden>
              {t.emoji}
            </span>
            {t.label}
          </button>
        ))}
      </div>

      {activity === 'learn' && (
        <LearnPanel key="learn" {...panelProps} onGoQuiz={() => switchTo('quiz')} xray={xray} setXray={setXray} />
      )}
      {activity === 'quiz' && <QuizPanel key="quiz" {...panelProps} onExplore={() => switchTo('explore')} />}
      {activity === 'explore' && (
        <ExplorePanel
          key="explore"
          {...panelProps}
          canExplode={canExplode}
          explode={explode}
          setExplode={setExplode}
        />
      )}

      <AskPip lesson={lesson} mode={mode} profile={profile} speaker={speaker} pip={pip} onFrustrated={frustrated} />
      {speaker.note && <p className={s.note}>🔇 {speaker.note}</p>}
    </>
  )
}
