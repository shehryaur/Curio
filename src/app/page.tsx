'use client'
// Curio main app: Home -> (photo flow) -> Object screen (Learn / Quiz / Explore). Owner: experience agent.
import { useCallback, useEffect, useState } from 'react'
import { useProfile } from '@/components/ProfileProvider'
import { SettingsPanel } from '@/components/SettingsPanel'
import GrownupDashboard from '@/components/experience/GrownupDashboard'
import HomeScreen from '@/components/experience/HomeScreen'
import ObjectScreen from '@/components/experience/ObjectScreen'
import PhotoFlow, { type PhotoResult } from '@/components/experience/PhotoFlow'
import TopBar from '@/components/experience/TopBar'
import s from '@/components/experience/experience.module.css'
import { useMeshyModel } from '@/hooks/useMeshyModel'
import { getTemplateLesson } from '@/lib/templates'
import type { ObjectLesson, TemplateId } from '@/lib/types'

type Screen =
  | { kind: 'home' }
  | { kind: 'photo' }
  | { kind: 'object'; lesson: ObjectLesson; photoUrl: string | null; key: number }

export default function Home() {
  const { profile, setMode } = useProfile()
  const mode = profile.mode
  const [screen, setScreen] = useState<Screen>({ kind: 'home' })
  const [showSettings, setShowSettings] = useState(false)
  const [showDash, setShowDash] = useState(false)

  // Tier tokens (senior: 18px base + high contrast) live on <html data-mode> so overlays get them too.
  useEffect(() => {
    document.documentElement.dataset.mode = mode
    return () => {
      delete document.documentElement.dataset.mode
    }
  }, [mode])
  useEffect(() => {
    if (mode !== 'adult') setShowDash(false)
  }, [mode])
  const meshy = useMeshyModel()

  const goHome = useCallback(() => {
    meshy.reset()
    setScreen({ kind: 'home' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meshy.reset])

  const openTemplate = (id: TemplateId) => {
    meshy.reset()
    let lesson: ObjectLesson | null = null
    try {
      lesson = getTemplateLesson(id)
    } catch {
      lesson = null
    }
    if (!lesson) return
    setScreen({ kind: 'object', lesson, photoUrl: null, key: Date.now() })
    window.scrollTo({ top: 0 })
  }

  const onPhotoLesson = useCallback(
    (r: PhotoResult) => {
      meshy.reset()
      setScreen({ kind: 'object', lesson: r.lesson, photoUrl: r.photoUrl, key: Date.now() })
      if (r.buildModel && r.photoUrl) void meshy.start(r.photoUrl)
      window.scrollTo({ top: 0 })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [meshy.reset, meshy.start],
  )

  return (
    <div className={s.app} data-mode={mode}>
      <TopBar onSettings={() => setShowSettings(true)} onDashboard={() => setShowDash(true)} />
      <main className={s.main}>
        {screen.kind === 'home' && (
          <HomeScreen onSnap={() => setScreen({ kind: 'photo' })} onTemplate={openTemplate} />
        )}
        {screen.kind === 'photo' && (
          <>
            <div className={s.backRow}>
              <button className={s.backBtn} onClick={goHome}>
                ← Home
              </button>
            </div>
            <PhotoFlow profile={profile} mode={mode} onLesson={onPhotoLesson} onCancel={goHome} />
          </>
        )}
        {screen.kind === 'object' && (
          <ObjectScreen
            key={screen.key}
            lesson={screen.lesson}
            mode={mode}
            profile={profile}
            photoUrl={screen.photoUrl}
            meshy={meshy}
            suspended={showSettings || showDash}
            onBack={goHome}
            onFrustrated={() => setMode('plainWords')}
          />
        )}
      </main>
      {showDash && (
        <div
          className={s.sheetBackdrop}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDash(false)
          }}
        >
          <div className={s.sheet} role="dialog" aria-modal="true" aria-label="Grown-up dashboard">
            <GrownupDashboard onClose={() => setShowDash(false)} />
          </div>
        </div>
      )}
      {showSettings && (
        <div
          className={s.sheetBackdrop}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSettings(false)
          }}
        >
          <div className={s.sheet} role="dialog" aria-modal="true" aria-label="Settings">
            <SettingsPanel onClose={() => setShowSettings(false)} />
          </div>
        </div>
      )}
    </div>
  )
}
