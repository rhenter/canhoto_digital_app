import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { getAccessToken } from './lib/auth'
import AppLayout from './App'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const DeliveriesPage = lazy(() => import('./pages/DeliveriesPage'))
const PodPage = lazy(() => import('./pages/PodPage'))

function requireAuth() {
  const token = getAccessToken()
  if (!token) {
    throw new Response(null, { status: 302, headers: { Location: '/login' } })
  }
  return null
}

export const routes: RouteObject[] = [
  { path: '/', element: <AppLayout />, loader: requireAuth, children: [
      { index: true, element: <DeliveriesPage /> },
      { path: 'deliveries/:id/pod', element: <PodPage /> },
    ]
  },
  { path: '/login', element: <LoginPage /> },
]
