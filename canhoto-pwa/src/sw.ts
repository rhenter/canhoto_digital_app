/// <reference lib="webworker" />

// Ensure correct typing for service worker global scope
declare const self: ServiceWorkerGlobalScope & typeof globalThis

import { clientsClaim } from 'workbox-core'
import { precacheAndRoute } from 'workbox-precaching'

// Enable immediate control of the page
self.skipWaiting()
clientsClaim()

// Precache manifest will be injected by VitePWA
// @ts-ignore
precacheAndRoute(self.__WB_MANIFEST || [])

// Background Sync handler: when connectivity returns, notify clients to process the POD queue
self.addEventListener('sync', (event: any) => {
  if (event.tag === 'pod-sync') {
    event.waitUntil(
      (async () => {
        const allClients = await (self as any).clients.matchAll({ includeUncontrolled: true })
        for (const client of allClients) {
          client.postMessage({ type: 'POD_SYNC' })
        }
      })()
    )
  }
})

// Also react to a ping message to broadcast a sync request (fallback)
self.addEventListener('message', (event: any) => {
  if (event.data && event.data.type === 'REQUEST_POD_SYNC') {
    ;(async () => {
      const allClients = await (self as any).clients.matchAll({ includeUncontrolled: true })
      for (const client of allClients) {
        client.postMessage({ type: 'POD_SYNC' })
      }
    })()
  }
})
