'use client'
// Snap -> (grown-up approves by email if needed) -> /api/analyze -> lesson.
// Permissions come from k-ID only (camera-access, ai-media-upload, ai-media-generation) — never from age.
import { useCallback, useEffect, useRef, useState } from 'react'
import type { PermissionName } from '@k-id/core'
import Pet from '@/components/Pet'
import { useProfile } from '@/components/ProfileProvider'
import { postJson } from '@/lib/api'
import { getTemplateLesson, TEMPLATES } from '@/lib/templates'
import type { AgeMode, AnalyzeRequest, AnalyzeResponse, ObjectLesson, Profile } from '@/lib/types'
import CameraView from './CameraView'
import GrownupAsk from './GrownupAsk'
import s from './experience.module.css'

export interface PhotoResult {
  lesson: ObjectLesson
  /** The snapshot, for 2D pins while there is no 3D model. null when a template matched. */
  photoUrl: string | null
  /** true => build a 3D model with /api/meshy in the background */
  buildModel: boolean
}

interface Props {
  profile: Profile
  mode: AgeMode
  onLesson: (r: PhotoResult) => void
  onCancel: () => void
}

const PHOTO_PERMS: readonly PermissionName[] = ['camera-access', 'ai-media-upload', 'ai-media-generation']
const CAMERA_PERM: readonly PermissionName[] = ['camera-access']
const AI_PERMS: readonly PermissionName[] = ['ai-media-upload', 'ai-media-generation']

type Stage = 'cameraPerm' | 'camera' | 'preview' | 'aiPerm' | 'analyzing' | 'error'

function isLesson(x: unknown): x is ObjectLesson {
  if (!x || typeof x !== 'object') return false
  const l = x as Partial<ObjectLesson>
  return Array.isArray(l.parts) && l.parts.length > 0 && Array.isArray(l.quiz) && !!l.title && !!l.intro
}

export default function PhotoFlow({ profile, mode, onLesson, onCancel }: Props) {
  const { effectiveCan: can } = useProfile()
  const [stage, setStage] = useState<Stage>(() => (can('camera-access') ? 'camera' : 'cameraPerm'))
  const [photo, setPhoto] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const ctrl = useRef<AbortController | null>(null)

  useEffect(() => () => ctrl.current?.abort(), [])

  const analyze = useCallback(
    async (image: string) => {
      setStage('analyzing')
      setError(null)
      ctrl.current?.abort()
      const c = new AbortController()
      ctrl.current = c
      const body: AnalyzeRequest = { imageBase64: image, mode }
      if (can('personalized-recommendations')) {
        if (profile.name) body.name = profile.name
        if (profile.interests.length) body.interests = profile.interests
      }
      const res = await postJson<AnalyzeResponse>('/api/analyze', body, c.signal)
      if (c.signal.aborted) return
      if (!res.ok || !isLesson(res.data.lesson)) {
        setError(res.ok ? 'Pip got a strange answer back.' : res.error)
        setStage('error')
        return
      }
      const { matchedTemplate, needsModel } = res.data
      if (matchedTemplate) {
        const lesson = TEMPLATES[matchedTemplate] ? getTemplateLesson(matchedTemplate) : res.data.lesson
        onLesson({ lesson, photoUrl: null, buildModel: false })
        return
      }
      onLesson({ lesson: res.data.lesson, photoUrl: image, buildModel: needsModel && can('ai-media-generation') })
    },
    // `can` changes identity every render; read it at call time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode, profile, onLesson],
  )

  const acceptPhoto = useCallback(() => {
    if (!photo) return
    if (AI_PERMS.every((n) => can(n))) void analyze(photo)
    else setStage('aiPerm')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo, analyze])

  const onAiApproved = useCallback(() => {
    if (photo) void analyze(photo)
  }, [photo, analyze])

  const onCameraApproved = useCallback(() => setStage('camera'), [])

  switch (stage) {
    case 'cameraPerm':
      return (
        <GrownupAsk
          names={PHOTO_PERMS}
          waitFor={CAMERA_PERM}
          question="Let's ask your grown-up first! Then you can show me anything."
          onApproved={onCameraApproved}
          onCancel={onCancel}
        />
      )
    case 'camera':
      return (
        <CameraView
          onCapture={(url) => {
            setPhoto(url)
            setStage('preview')
          }}
          onCancel={onCancel}
        />
      )
    case 'preview':
      return (
        <div className={s.panel}>
          <div className={s.camera}>{photo && <img src={photo} alt="Your photo" />}</div>
          <Pet mood="happy" size="sm" message="Ooh, nice photo! Shall we use it?" />
          <div className={s.actions}>
            <button className="c-btn" onClick={acceptPhoto}>
              ✅ Use this photo
            </button>
            <button className="c-btn secondary" onClick={() => setStage('camera')}>
              🔄 Retake
            </button>
          </div>
        </div>
      )
    case 'aiPerm':
      return (
        <GrownupAsk
          names={AI_PERMS}
          question="Can Pip use this photo to make a 3D model? Let's ask your grown-up!"
          onApproved={onAiApproved}
          onCancel={onCancel}
        />
      )
    case 'analyzing':
      return (
        <div className={`${s.panel} ${s.center}`}>
          {photo && (
            <div className={s.analyzingThumb}>
              <img src={photo} alt="Your photo" />
            </div>
          )}
          <div className={s.analyzingText}>
            <h2 className={s.analyzingTitle}>Curio is looking…</h2>
            <p className={s.analyzingSub}>Hmm, what could this be?</p>
          </div>
          <div className={s.checklistCard}>
            <div className={`${s.checkItem} ${s.checkDone}`}>
              <span className={s.checkBadge}>✓</span>
              <span>Spotted an object!</span>
            </div>
            <div className={`${s.checkItem} ${s.checkActive}`}>
              <span className={s.checkSpin} />
              <span>Writing your story</span>
            </div>
            <div className={`${s.checkItem} ${s.checkPending}`}>
              <span className={s.checkCircle} />
              <span>Making your quiz</span>
            </div>
          </div>
        </div>
      )
    case 'error':
      return (
        <div className={`${s.panel} ${s.center}`}>
          <Pet mood="oops" size="md" message="Hmm, I couldn't figure that one out. Want to try again?" />
          {error && <p className={s.note}>({error})</p>}
          <div className={s.actions}>
            <button className="c-btn" onClick={() => photo && void analyze(photo)} disabled={!photo}>
              Try again
            </button>
            <button className="c-btn secondary" onClick={() => setStage('camera')}>
              New photo
            </button>
            <button className="c-btn secondary" onClick={onCancel}>
              Pick an object
            </button>
          </div>
        </div>
      )
  }
}
