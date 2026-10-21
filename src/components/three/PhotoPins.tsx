'use client'
// 2D fallback: the photo (or the lesson emoji) with numbered pins at each part's anchor.
// Same hover / click / label / focus behavior as the 3D viewer.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { AgeMode, PartInfo } from '@/lib/types'
import { defaultAnchor, type Interaction } from './partContext'
import styles from './ObjectViewer.module.css'

export interface PhotoPinsProps {
  parts: PartInfo[]
  mode: AgeMode
  photoUrl?: string | null
  emoji?: string
  focusPartId?: string | null
  highlightPartId?: string | null
  interaction: Interaction
  showLabels?: boolean
  onPartHover?: (partId: string | null) => void
  onPartClick?: (partId: string) => void
}

interface Rect {
  l: number
  t: number
  w: number
  h: number
}

const clamp = (v: number) => Math.max(-0.92, Math.min(0.92, v))

export default function PhotoPins({
  parts,
  mode,
  photoUrl,
  emoji,
  focusPartId = null,
  highlightPartId = null,
  interaction,
  showLabels = false,
  onPartHover,
  onPartClick,
}: PhotoPinsProps) {
  const wrap = useRef<HTMLDivElement>(null)
  const img = useRef<HTMLImageElement>(null)
  const [rect, setRect] = useState<Rect | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const [imgFailed, setImgFailed] = useState(false)
  const hoverCb = useRef(onPartHover)
  hoverCb.current = onPartHover
  const lastHover = useRef<string | null>(null)

  const showPhoto = !!photoUrl && !imgFailed

  const measure = useCallback(() => {
    const w = wrap.current
    if (!w) return
    const W = w.clientWidth
    const H = w.clientHeight
    const im = img.current
    if (showPhoto && im && im.naturalWidth > 0 && im.naturalHeight > 0) {
      const r = im.naturalWidth / im.naturalHeight
      let cw = W
      let ch = W / r
      if (ch > H) {
        ch = H
        cw = H * r
      }
      setRect({ l: (W - cw) / 2, t: (H - ch) / 2, w: cw, h: ch })
    } else if (!showPhoto) {
      const s = Math.min(W, H) * 0.86
      setRect({ l: (W - s) / 2, t: (H - s) / 2, w: s, h: s })
    }
  }, [showPhoto])

  useLayoutEffect(() => {
    measure()
    const w = wrap.current
    if (!w || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => measure())
    ro.observe(w)
    return () => ro.disconnect()
  }, [measure])

  useEffect(() => {
    if (lastHover.current === hovered) return
    lastHover.current = hovered
    hoverCb.current?.(hovered)
  }, [hovered])

  useEffect(() => {
    if (interaction === 'none') setHovered(null)
  }, [interaction])

  const active = interaction !== 'none'

  return (
    <div ref={wrap} className={styles.root} onPointerLeave={() => active && setHovered(null)}>
      {showPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={img}
          src={photoUrl ?? undefined}
          alt=""
          className={styles.photo}
          onLoad={measure}
          onError={() => setImgFailed(true)}
          draggable={false}
        />
      ) : (
        <div className={styles.emojiStage} aria-hidden>
          <span>{emoji ?? '🔍'}</span>
        </div>
      )}
      {rect && (
        <div className={styles.pinLayer} style={{ left: rect.l, top: rect.t, width: rect.w, height: rect.h }}>
          {parts.map((p, i) => {
            const a = p.anchor ?? defaultAnchor(i, parts.length)
            const x = (clamp(a[0]) + 1) / 2
            const y = 1 - (clamp(a[1]) + 1) / 2
            const isHover = hovered === p.id
            const cls = [
              styles.pin,
              isHover ? styles.pinHover : '',
              focusPartId === p.id ? styles.pinFocus : '',
              highlightPartId === p.id ? styles.pinHighlight : '',
            ].join(' ')
            return (
              <div key={p.id} className={styles.pinSlot} style={{ left: `${x * 100}%`, top: `${y * 100}%` }}>
                <button
                  type="button"
                  className={cls}
                  aria-label={p.name[mode]}
                  tabIndex={active ? 0 : -1}
                  onPointerEnter={active ? () => setHovered(p.id) : undefined}
                  onPointerLeave={active ? () => setHovered((c) => (c === p.id ? null : c)) : undefined}
                  onFocus={active ? () => setHovered(p.id) : undefined}
                  onBlur={active ? () => setHovered((c) => (c === p.id ? null : c)) : undefined}
                  onClick={
                    active
                      ? () => {
                          if (interaction === 'hover') setHovered(p.id)
                          onPartClick?.(p.id)
                        }
                      : undefined
                  }
                >
                  {i + 1}
                </button>
                {showLabels && isHover && (
                  <div className={`${styles.label} ${y < 0.3 ? styles.labelBelow : ''}`} role="tooltip">
                    <strong>{p.name[mode]}</strong>
                    <span>{p.short[mode]}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
