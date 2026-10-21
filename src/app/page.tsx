'use client'

import { useState } from 'react'
import { KidPermission } from '@k-id/core'
import { SettingsPanel } from '@/components/SettingsPanel'
import { KidTopBar } from '@/components/KidTopBar'
import { CameraScanner } from '@/components/CameraScanner'
import { Curio3DStage } from '@/components/Curio3DStage'
import { GuardianModal } from '@/components/GuardianModal'
import { MicButton } from '@/components/MicButton'
import { useCurioSession } from '@/hooks/useCurioSession'

function Locked({ what }: { what: string }) {
  return <div className="curio-locked">{what} is turned off. A grown-up can turn it on in Settings.</div>
}

export default function Home() {
  const [showSettings, setShowSettings] = useState(false)
  const [question, setQuestion] = useState('')
  const c = useCurioSession()

  if (showSettings) return <SettingsPanel onClose={() => setShowSettings(false)} />

  const activeStepObj = c.analysis?.steps.find((s) => s.stepNumber === c.activeStep)

  return (
    <main className="curio-app">
      <KidTopBar
        personaId={c.personaId}
        onPersona={c.setPersona}
        kidMode={c.kidMode}
        mode={c.mode}
        personalized={c.personalized}
        onSettings={() => { c.stop(); setShowSettings(true) }}
      />

      {c.modeOverride === 'plainWords' && c.personalized && (
        <div className="curio-badge big curio-row">
          <span>Plain words mode</span>
          <button className="curio-btn ghost" onClick={c.clearModeOverride}>
            Back to normal
          </button>
        </div>
      )}

      {/* Scanner: camera needs camera-access AND ai-media-upload (gated inside); demo objects always work */}
      <CameraScanner busy={c.analyzing} error={c.analyzeError} onAnalyze={(i) => void c.analyze(i)} />

      {/* 3D tour: personalized lessons when allowed, standard lessons otherwise */}
      <section className="curio-card">
        <h2>Guided tour{c.analysis ? `: ${c.analysis.objectTitle}` : ''}</h2>
        <KidPermission name="personalized-recommendations" fallback={<p>Standard lesson for everyone.</p>}>
          <p>Lesson adapted to your age and how you&apos;re feeling.</p>
        </KidPermission>
        {c.analysis ? (
          <>
            {c.analysis.source === 'fallback' && <p className="curio-note">Using a ready-made tour.</p>}
            {c.mode === 'teen' && c.analysis.causeAndEffectChainForTeen && (
              <p className="curio-chain">{c.analysis.causeAndEffectChainForTeen}</p>
            )}
            <Curio3DStage
              analysis={c.analysis}
              mode={c.mode}
              activeStep={c.activeStep}
              isStepLocked={c.isStepLocked}
              onPin={c.selectPin}
              subtitle={c.subtitle}
              isSpeaking={c.isSpeaking}
              lastImage={c.lastImage}
            />
            <div className="curio-row curio-wrap">
              {c.tourPlaying || c.isSpeaking ? (
                <button className="curio-btn" onClick={c.stop}>
                  ■ Stop
                </button>
              ) : (
                <button className="curio-btn" onClick={() => void c.playTour()}>
                  ▶ Play guided tour
                </button>
              )}
              {c.isMinor && !c.hazardsUnlocked && c.analysis.steps.some((s) => s.isHazardForChild) && (
                <button className="curio-btn ghost" onClick={c.openGuardian}>
                  🔒 Grown-up unlock
                </button>
              )}
              {c.hazardsUnlocked && <span className="curio-badge">Safety lessons unlocked</span>}
            </div>
            {c.speechNote && <p className="curio-note">{c.speechNote}</p>}
          </>
        ) : (
          <p>Snap a photo or pick a demo object to start.</p>
        )}
      </section>

      {/* Ask the owl: typed and voice */}
      <section className="curio-card">
        <h2>Ask the owl</h2>
        <KidPermission name="ai-chat" fallback={<Locked what="Chatting with the owl" />}>
          <form
            className="curio-row"
            onSubmit={(e) => {
              e.preventDefault()
              const q = question
              setQuestion('')
              void c.askOwl(q)
            }}
          >
            <input
              className="curio-input"
              placeholder="What does this part do?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={500}
            />
            <button className="curio-btn" type="submit" disabled={c.asking || !question.trim()}>
              Ask
            </button>
          </form>
        </KidPermission>
        <KidPermission name="ai-voice-mode" fallback={<Locked what="Talking to the owl" />}>
          <MicButton isMinor={c.isMinor} disabled={c.asking} onResult={c.handleVoice} />
          {c.lastTranscript !== null && (
            <p>
              You said: &ldquo;{c.lastTranscript}&rdquo;
              {c.lastEmotion ? ` (sounds ${c.lastEmotion.toLowerCase()})` : ''}
            </p>
          )}
          {c.voiceNote && <p className="curio-note">{c.voiceNote}</p>}
        </KidPermission>
        {c.asking && <p>The owl is thinking…</p>}
        {c.askError && <p className="curio-error">{c.askError}</p>}
        {c.lastAnswer && <p className="curio-answer">🦉 {c.lastAnswer}</p>}
      </section>

      {c.guardianOpen && (
        <GuardianModal partName={activeStepObj?.partName} onUnlock={c.unlockHazards} onCancel={c.closeGuardian} />
      )}
    </main>
  )
}
