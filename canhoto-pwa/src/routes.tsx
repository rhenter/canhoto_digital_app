import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { getAccessToken, getRefreshToken, refreshAccessToken } from './lib/auth'
import AppLayout from './App'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const DeliveriesPage = lazy(() => import('./pages/DeliveriesPage'))
const DeliveryDetailPage = lazy(() => import('./pages/DeliveryDetailPage'))
const PodPage = lazy(() => import('./pages/PodPage'))
const PreferencesPage = lazy(() => import('./pages/PreferencesPage'))
const ChangePasswordPage = lazy(() => import('./pages/ChangePasswordPage'))

async function requireAuth() {
  let token = getAccessToken()
  if (!token) {
    // Try to use refresh token once to obtain a new access token
    const refresh = getRefreshToken()
    if (refresh) {
      token = await refreshAccessToken()
    }
  }
  if (!token) {
    throw new Response(null, { status: 302, headers: { Location: '/login' } })
  }
  return null
}

export const routes: RouteObject[] = [
  { path: '/', element: <AppLayout />, loader: requireAuth, children: [
      { index: true, element: <DeliveriesPage /> },
      { path: 'deliveries/:id', element: <DeliveryDetailPage /> },
      { path: 'deliveries/:id/pod', element: <PodPage /> },
      { path: 'account/preferences', element: <PreferencesPage /> },
      { path: 'account/change-password', element: <ChangePasswordPage /> },
    ]
  },
  { path: '/login', element: <LoginPage /> },
]
