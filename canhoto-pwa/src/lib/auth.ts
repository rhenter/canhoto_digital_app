// Simple auth storage and helpers (SimpleJWT)
// Persist auth to localStorage and mirror into in-memory variables for fast access
import i18n from '../i18n'
import { API_BASE_URL, endpoints } from './endpoints'

export type User = {
  id: number
  name: string
  username: string
  first_name: string
  last_name: string
  cellphone: string | null
  email: string
  allow_email_notifications: boolean
  allow_push_notifications: boolean
  allow_sms_notifications: boolean
  allow_whatsapp_notifications: boolean
  preferred_language: string
  is_superuser: boolean
  is_active: boolean
  last_login: string | null
}

type PersistedAuth = {
  accessToken: string | null
  refreshToken: string | null
  user: User | null
}

const STORAGE_KEY = 'auth'

let accessToken: string | null = null
let refreshToken: string | null = null
let currentUser: User | null = null
let refreshPromise: Promise<string | null> | null = null

// Simple pub/sub so UI can react to auth changes without a global state lib
const listeners = new Set<() => void>()
export function subscribeAuth(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}
function notify() {
  for (const l of listeners) l()
}

function saveStorage() {
  const data: PersistedAuth = { accessToken, refreshToken, user: currentUser }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // ignore quota errors
  }
}

function loadStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const data = JSON.parse(raw) as PersistedAuth
    accessToken = data.accessToken ?? null
    refreshToken = data.refreshToken ?? null
    currentUser = (data.user ?? null) as User | null
  } catch {
    // ignore
  }
}

// Initialize from storage on module load
loadStorage()

// Apply preferred language from stored user; default to pt-BR
try {
  const pref = ((u: unknown) =>
    (u && typeof u === 'object' && 'preferred_language' in u)
      ? (u as { preferred_language?: string }).preferred_language
      : undefined
  )(currentUser) ?? 'pt-BR'
  const lang = mapPreferredLanguage(pref)
  if (i18n.language !== lang) i18n.changeLanguage(lang)
} catch {}

// Normalize backend preferred_language codes to i18n codes
export function mapPreferredLanguage(code: string): string {
  // Accept 'pt', 'pt-BR', 'en', 'es' and map to configured i18n keys
  switch ((code || '').toLowerCase()) {
    case 'pt':
    case 'pt-br':
      return 'pt-BR'
    case 'en':
      return 'en'
    case 'es':
      return 'es'
    default:
      return 'pt-BR'
  }
}

export function setAccessToken(token: string | null) {
  accessToken = token
  saveStorage()
}

export function setRefreshToken(token: string | null) {
  refreshToken = token
  saveStorage()
}

export function setUser(user: User | null) {
  currentUser = user
  saveStorage()
  notify()
}

export function getUser() {
  return currentUser
}

export function getAccessToken() {
  return accessToken
}

export function getRefreshToken() {
  return refreshToken
}

export function isAuthenticated() {
  return !!accessToken
}

export async function login(username: string, password: string) {
  // Django SimpleJWT endpoints
  const res = await fetch(`${API_BASE_URL}${endpoints.auth.token()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  if (!res.ok) {
    throw new Error(i18n.t('errors.invalid_credentials'))
  }
  const data = await res.json()
  // Expected shape per backend: { access: '...', refresh: '...', user: {...} }
  setAccessToken(data.access ?? null)
  setRefreshToken(data.refresh ?? null)
  const user = (data.user ?? null) as User | null
  setUser(user)
  // Apply user's preferred language immediately if available
  if (user?.preferred_language) {
    const lang = mapPreferredLanguage(user.preferred_language)
    i18n.changeLanguage(lang)
  }
}

export function logout() {
  setAccessToken(null)
  setRefreshToken(null)
  setUser(null)
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {}
}

export async function refreshAccessToken(): Promise<string | null> {
  if (!refreshToken) return null
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}${endpoints.auth.refresh()}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: refreshToken })
        })
        if (!res.ok) return null
        const data = await res.json()
        const token = data.access as string | undefined
        setAccessToken(token ?? null)
        return token ?? null
      } catch {
        return null
      } finally {
        // Allow subsequent refresh attempts
        setTimeout(() => { refreshPromise = null }, 0)
      }
    })()
  }
  return refreshPromise
}
