import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import './i18n'
import i18n from './i18n'
import { routes } from './routes'
import { processQueue, getPendingCount, ensureBackgroundSync } from './lib/offlineQueue'

const router = createBrowserRouter(routes)
const queryClient = new QueryClient()

// Try to process offline queue when coming back online
window.addEventListener('online', () => {
  processQueue().catch(() => {})
})

// Listen to Service Worker Background Sync messages
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    const data = event.data as any
    if (data && data.type === 'POD_SYNC') {
      processQueue().catch(() => {})
    }
  })
}

// On boot, if there are pending items, ensure background sync is registered
getPendingCount().then((count) => {
  if (count > 0) ensureBackgroundSync().catch(() => {})
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<div>{i18n.t('common.loading')}</div>}>
        <RouterProvider router={router} />
      </Suspense>
    </QueryClientProvider>
  </React.StrictMode>,
)
