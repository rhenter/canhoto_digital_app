import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import './i18n'
import i18n from './i18n'
import { routes } from './routes'
import { processQueue } from './lib/offlineQueue'

const router = createBrowserRouter(routes)
const queryClient = new QueryClient()

// Try to process offline queue when coming back online
window.addEventListener('online', () => {
  processQueue().catch(() => {})
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
