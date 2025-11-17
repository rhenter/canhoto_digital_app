import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useIsFetching } from '@tanstack/react-query'
import { logout, isAuthenticated, getUser, subscribeAuth, User } from './lib/auth'
import { getPendingCount, subscribeQueue, processQueue, ensureBackgroundSync } from './lib/offlineQueue'

export default function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation(['app', 'common'])
  // Global fetching indicator (any React Query in-flight)
  const isFetchingAny = useIsFetching()

  // Smooth top bar show/hide (avoid flicker on very quick requests)
  const [showBar, setShowBar] = useState(false)
  const showTimer = useRef<number | null>(null)
  const hideTimer = useRef<number | null>(null)
  useEffect(() => {
    if (isFetchingAny > 0) {
      if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null }
      if (!showBar && !showTimer.current) {
        showTimer.current = window.setTimeout(() => { setShowBar(true); showTimer.current = null }, 150)
      }
    } else {
      if (showTimer.current) { clearTimeout(showTimer.current); showTimer.current = null }
      if (showBar && !hideTimer.current) {
        hideTimer.current = window.setTimeout(() => { setShowBar(false); hideTimer.current = null }, 200)
      }
    }
    return () => {
      if (showTimer.current) { clearTimeout(showTimer.current); showTimer.current = null }
      if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null }
    }
  }, [isFetchingAny, showBar])

  // Pending PODs indicator
  const [pending, setPending] = useState(0)
  useEffect(() => {
    let mounted = true
    getPendingCount().then((n: number) => { if (mounted) setPending(n) })
    const unsub = subscribeQueue(async () => {
      const n = await getPendingCount()
      setPending(n)
    })
    return () => { mounted = false; unsub() }
  }, [])

  // Keep local state in sync with auth module
  const [authed, setAuthed] = useState(isAuthenticated())
  const [user, setUserState] = useState<User | null>(getUser())
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    const unsub = subscribeAuth(() => {
      setAuthed(isAuthenticated())
      setUserState(getUser())
    })
    return unsub
  }, [])

  // Close menu on route change
  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  // Click-away and Esc to close
  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node
      if (menuRef.current && !menuRef.current.contains(target) && buttonRef.current && !buttonRef.current.contains(target)) {
        setOpen(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const handleLogout = () => {
    setOpen(false)
    logout()
    navigate('/login')
  }

  const initials = useMemo(() => {
    const n = user?.name || `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim()
    if (!n) return 'U'
    const parts = n.split(/\s+/).filter(Boolean)
    const letters = [parts[0]?.[0], parts[parts.length - 1]?.[0]].filter(Boolean).join('')
    return letters.toUpperCase()
  }, [user])

  return (
    <div className="app-container">
      <header className="sticky top-0 z-10 border bg-white/80 backdrop-blur relative">
        {/* Top indeterminate progress bar */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5">
          <div className="h-full w-full overflow-hidden bg-transparent">
            {showBar && (
              <div className="relative h-full text-brand" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-200/60" />
                <div className="progress-bar-shimmer absolute left-[-40%] top-0 h-full w-[40%]" />
              </div>
            )}
          </div>
        </div>
        {/* SR-only live region for accessibility */}
        {isFetchingAny ? (
          <span className="sr-only" aria-live="polite">{t('common:refreshing', { defaultValue: 'Atualizando...' })}</span>
        ) : null}
        <style>{`
          .progress-bar-shimmer {
            background: linear-gradient(90deg, rgba(59,130,246,0) 0%, rgba(59,130,246,0.9) 50%, rgba(59,130,246,0) 100%);
            animation: progressSlide 1.1s ease-in-out infinite;
          }
          @keyframes progressSlide {
            0% { transform: translateX(0); }
            50% { transform: translateX(60vw); }
            100% { transform: translateX(100vw); }
          }
        `}</style>
        <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
          <Link to="/" className="font-semibold text-brand">{t('app:appName')}</Link>
          <div className="relative ml-auto flex items-center gap-4 text-sm">
            {pending > 0 && (
              <div className="flex items-center gap-2 rounded-full border bg-amber-50 px-2 py-1 text-amber-700">
                <span className="inline-flex items-center gap-1">
                  <span className="inline-flex h-2 w-2 rounded-full bg-amber-500" aria-hidden />
                  PODs pendentes: <strong>{pending}</strong>
                </span>
                <button
                  className="rounded bg-amber-600 px-2 py-0.5 text-white hover:bg-amber-700"
                  onClick={() => { processQueue().catch(() => {}); ensureBackgroundSync().catch(() => {}) }}
                >
                  Sincronizar agora
                </button>
              </div>
            )}
            {authed ? (
              <div className="relative">
                <button
                  id="user-menu-button"
                  ref={buttonRef}
                  className="flex items-center gap-2 rounded-full border bg-white px-2 py-1 shadow-sm hover:bg-gray-50"
                  onClick={() => setOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={open}
                  aria-controls="user-menu"
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      if (!open) setOpen(true)
                      // Focus first menuitem on open
                      setTimeout(() => {
                        const first = document.querySelector('#user-menu [role="menuitem"]') as HTMLElement | null
                        first?.focus()
                      }, 0)
                    }
                  }}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-brand">
                    {/* Avatar initials fallback (as FontAwesome-like user) */}
                    <span className="font-semibold">{initials}</span>
                  </div>
                  <span className="hidden md:block max-w-[160px] truncate text-gray-700">
                    {user?.first_name || user?.username}
                  </span>
                  <svg className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
                  </svg>
                </button>
                {open && (
                  <div
                    id="user-menu"
                    ref={menuRef}
                    className="absolute right-0 mt-2 w-56 overflow-hidden rounded-md border bg-white py-1 shadow-lg"
                    role="menu"
                    aria-labelledby="user-menu-button"
                    onKeyDown={(e) => {
                      const items = Array.from(document.querySelectorAll('#user-menu [role="menuitem"]')) as HTMLElement[]
                      const currentIndex = items.findIndex((el) => el === document.activeElement)
                      if (e.key === 'ArrowDown') {
                        e.preventDefault()
                        const next = items[(currentIndex + 1) % items.length]
                        next?.focus()
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault()
                        const prev = items[(currentIndex - 1 + items.length) % items.length]
                        prev?.focus()
                      } else if (e.key === 'Home') {
                        e.preventDefault(); items[0]?.focus()
                      } else if (e.key === 'End') {
                        e.preventDefault(); items[items.length - 1]?.focus()
                      }
                    }}
                  >
                    <div className="px-4 py-2">
                      <p className="truncate text-sm font-medium text-gray-900">{user?.name || user?.username}</p>
                      {user?.email && <p className="truncate text-xs text-gray-500">{user.email}</p>}
                    </div>
                    <div className="my-1 border-t" />
                    <Link to="/account/preferences" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none" role="menuitem" onClick={() => setOpen(false)} tabIndex={0}>
                      {t('app:userPreferences', { defaultValue: 'Preferências' })}
                    </Link>
                    <Link to="/account/change-password" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none" role="menuitem" onClick={() => setOpen(false)} tabIndex={0}>
                      {t('app:changePassword', { defaultValue: 'Alterar senha' })}
                    </Link>
                    <div className="my-1 border-t" />
                    <button className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 focus:bg-red-50 focus:outline-none" role="menuitem" onClick={handleLogout} tabIndex={0}>
                      {t('app:logout', { defaultValue: 'Sair' })}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <span className="text-gray-500">{location.pathname}</span>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-4">
        <Suspense fallback={<div>{t('common:loading')}</div>}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}
