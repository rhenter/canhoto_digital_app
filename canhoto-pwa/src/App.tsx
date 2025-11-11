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

  // Pending PODs indicator
  const [pending, setPending] = useState(0)
  useEffect(() => {
    let mounted = true
    getPendingCount().then((n) => { if (mounted) setPending(n) })
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
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
          <Link to="/" className="font-semibold text-brand">{t('app:appName')}</Link>
          <div className="relative ml-auto flex items-center gap-4 text-sm">
            {isFetchingAny ? (
              <div className="inline-flex items-center gap-2 text-gray-500" aria-live="polite" aria-busy="true">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" strokeWidth="4" opacity="0.25"/>
                  <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" fill="none"/>
                </svg>
                <span className="sr-only">{t('common:refreshing', { defaultValue: 'Atualizando...' })}</span>
              </div>
            ) : null}
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
