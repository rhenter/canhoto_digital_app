import { Suspense } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { logout, isAuthenticated } from './lib/auth'

export default function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const authed = isAuthenticated()
  const { t } = useTranslation(['app', 'common'])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="app-container">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
          <Link to="/" className="font-semibold text-brand">{t('app:appName')}</Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-500">{location.pathname}</span>
            {authed && (
              <button className="btn px-3 py-1" onClick={handleLogout}>{t('app:logout')}</button>
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
