'use client'
// Demo only: permission asks the learner sent this visit, so the Grown-up dashboard can list them with Approve buttons.
import { useSyncExternalStore } from 'react'
import type { PermissionName } from '@k-id/core'

let pending: PermissionName[] = []
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function addDemoRequest(names: readonly PermissionName[]) {
  pending = Array.from(new Set([...pending, ...names]))
  emit()
}
export function clearDemoRequest(names: readonly PermissionName[]) {
  pending = pending.filter((n) => !names.includes(n))
  emit()
}
const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}
const EMPTY: PermissionName[] = []
export function useDemoRequests(): PermissionName[] {
  return useSyncExternalStore(subscribe, () => pending, () => EMPTY)
}
