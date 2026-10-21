// Tiny client-side fetch helpers: never throw, always return { ok, data } | { ok: false, error }. Owner: Sruthi
export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; aborted?: boolean }

async function readError(res: Response): Promise<string> {
  try {
    const body: unknown = await res.json()
    if (body && typeof body === 'object' && 'error' in body && typeof (body as { error: unknown }).error === 'string') {
      return `${res.status}: ${(body as { error: string }).error}`
    }
  } catch {
    /* not JSON */
  }
  return `HTTP ${res.status}`
}

async function run<T>(url: string, init: RequestInit): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, init)
    if (!res.ok) return { ok: false, error: await readError(res) }
    const data = (await res.json()) as T
    return { ok: true, data }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return { ok: false, error: 'cancelled', aborted: true }
    return { ok: false, error: err instanceof Error ? err.message : 'Network error' }
  }
}

export function postJson<T>(url: string, body: unknown, signal?: AbortSignal): Promise<ApiResult<T>> {
  return run<T>(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal })
}

export function postForm<T>(url: string, form: FormData, signal?: AbortSignal): Promise<ApiResult<T>> {
  return run<T>(url, { method: 'POST', body: form, signal })
}

export function getJson<T>(url: string, signal?: AbortSignal): Promise<ApiResult<T>> {
  return run<T>(url, { method: 'GET', signal })
}
