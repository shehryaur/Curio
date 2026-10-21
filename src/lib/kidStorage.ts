// Persists the k-ID IDs (and the in-progress onboarding answers) between launches so the flow
// resumes instead of restarting. Every access is wrapped: storage can be unavailable (private mode).
const SESSION_KEY = 'curio.kid.sessionId'
const CHALLENGE_KEY = 'curio.kid.challengeId'
const SETTINGS_CHALLENGE_KEY = 'curio.kid.settingsChallengeId'
const DRAFT_KEY = 'curio.onboarding.draft'

/** Answers collected by the onboarding chat before the age gate passes (lets a pending consent survive a reload). */
export interface OnboardingDraft {
  name?: string
  age?: number
  dateOfBirth?: string // YYYY-MM-DD, only when the jurisdiction asks for a birthday
  interests?: string[]
  jurisdiction?: string // concrete code picked by the player when "auto" could not be resolved
  email?: string // parent / guardian email the consent request went to
}

function read(key: string): string | undefined {
  try {
    return window.localStorage.getItem(key) ?? undefined
  } catch {
    return undefined
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, value)
  } catch {
    /* storage unavailable (private mode): the flow simply restarts next launch */
  }
}

export const kidStorage = {
  getSessionId: () => read(SESSION_KEY),
  setSessionId: (id: string) => write(SESSION_KEY, id),
  clearSessionId: () => write(SESSION_KEY, null),
  getChallengeId: () => read(CHALLENGE_KEY),
  setChallengeId: (id: string) => write(CHALLENGE_KEY, id),
  clearChallengeId: () => write(CHALLENGE_KEY, null),
  getSettingsChallengeId: () => read(SETTINGS_CHALLENGE_KEY),
  setSettingsChallengeId: (id: string) => write(SETTINGS_CHALLENGE_KEY, id),
  clearSettingsChallengeId: () => write(SETTINGS_CHALLENGE_KEY, null),
  getDraft: (): OnboardingDraft | undefined => {
    const raw = read(DRAFT_KEY)
    if (!raw) return undefined
    try {
      return JSON.parse(raw) as OnboardingDraft
    } catch {
      return undefined
    }
  },
  setDraft: (d: OnboardingDraft) => write(DRAFT_KEY, JSON.stringify(d)),
  clearDraft: () => write(DRAFT_KEY, null),
  /** The k-ID ids only (session, age-gate challenge, settings challenge). */
  clearIds: () => {
    write(SESSION_KEY, null)
    write(CHALLENGE_KEY, null)
    write(SETTINGS_CHALLENGE_KEY, null)
  },
  /** Everything Curio's k-ID flow stored, including the onboarding draft. */
  clearAll: () => {
    write(SESSION_KEY, null)
    write(CHALLENGE_KEY, null)
    write(SETTINGS_CHALLENGE_KEY, null)
    write(DRAFT_KEY, null)
  },
}
