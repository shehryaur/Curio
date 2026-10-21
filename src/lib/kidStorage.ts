// Persists the k-ID IDs between launches so the flow resumes instead of restarting.
const SESSION_KEY = 'curio.kid.sessionId'
const CHALLENGE_KEY = 'curio.kid.challengeId'
const SETTINGS_CHALLENGE_KEY = 'curio.kid.settingsChallengeId'

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
  getChallengeId: () => read(CHALLENGE_KEY),
  setChallengeId: (id: string) => write(CHALLENGE_KEY, id),
  clearChallengeId: () => write(CHALLENGE_KEY, null),
  getSettingsChallengeId: () => read(SETTINGS_CHALLENGE_KEY),
  setSettingsChallengeId: (id: string) => write(SETTINGS_CHALLENGE_KEY, id),
}
