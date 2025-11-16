import localforage from 'localforage'
import { uploadPodMultipart } from './api'
import { getClientMeta } from './meta'

// IndexedDB-backed queue for offline POD submissions (presign + upload + createPod)

type QueueItem = {
  id: string // unique id
  deliveryId: string // UUID
  createdAt: number
  payload: {
    status: 'delivered' | 'failed' | 'partial'
    observations?: string
    received_by_name?: string
    received_by_document?: string
    signed_at: string
    // New location array [lng, lat]; keep legacy geo for backward-compat
    location?: [number, number]
    geo?: { lat: number; lng: number }
    images?: string[] // dataURLs (optional, multiple)
    image?: string // legacy single image (optional)
    signature?: string // dataURL (optional)
  }
}

const store = localforage.createInstance({ name: 'canhoto-queue' })
const KEY = 'pod-queue'

// Simple pub/sub to notify UI about queue changes
const subs = new Set<() => void>()
function emit() { subs.forEach((cb) => { try { cb() } catch {} }) }
export function subscribeQueue(cb: () => void) {
  subs.add(cb)
  return () => subs.delete(cb)
}

async function getQueue(): Promise<QueueItem[]> {
  const arr = await store.getItem<QueueItem[]>(KEY)
  return arr ?? []
}

async function setQueue(arr: QueueItem[]) {
  await store.setItem(KEY, arr)
  emit()
}

export async function enqueuePOD(
  deliveryId: string,
  payload: QueueItem['payload']
) {
  const normalized: QueueItem['payload'] = {
    ...payload,
    // normalize legacy single image to images[]
    images: payload.images ?? (payload.image ? [payload.image] : undefined),
  }
  const item: QueueItem = {
    id: crypto.randomUUID(),
    deliveryId,
    createdAt: Date.now(),
    payload: normalized,
  }
  const q = await getQueue()
  q.push(item)
  await setQueue(q)
  // Try to register background sync
  ensureBackgroundSync().catch(() => {})
}

export async function getPendingCount(): Promise<number> {
  const q = await getQueue()
  return q.length
}

export async function ensureBackgroundSync() {
  try {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const reg = await navigator.serviceWorker.ready
      // Background Sync API is optional; guard access for older browsers
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (reg as any).sync?.register('pod-sync')
    } else {
      // Fallback: ping SW to broadcast a message
      navigator.serviceWorker?.controller?.postMessage({ type: 'REQUEST_POD_SYNC' })
    }
  } catch {
    // ignore
  }
}

export async function processQueue() {
  const q = await getQueue()
  const remaining: QueueItem[] = []
  for (const item of q) {
    try {
      // Build multipart form equivalent to online flow (new API)
      const form = new FormData()
      // Required delivery id per new endpoint
      form.append('delivery', item.deliveryId)
      if (item.payload.received_by_name) form.append('received_by_name', item.payload.received_by_name)
      if (item.payload.received_by_document) form.append('received_by_document', item.payload.received_by_document)
      form.append('signed_at', item.payload.signed_at)
      // New: location as [lng, lat]; derive from either payload.location or legacy geo
      const loc = item.payload.location
        ? item.payload.location
        : (item.payload.geo && item.payload.geo.lng != null && item.payload.geo.lat != null
            ? [item.payload.geo.lng, item.payload.geo.lat] as [number, number]
            : undefined)
      if (loc) form.append('location', JSON.stringify(loc))
      form.append('status', item.payload.status)
      if (item.payload.observations) form.append('observations', item.payload.observations)
      form.append('meta', JSON.stringify(getClientMeta('offlineQueue')))

      // Attach signature (optional)
      if (item.payload.signature) {
        const sigBlob = dataURLtoBlob(item.payload.signature)
        form.append('signature_image', sigBlob, 'signature.png')
      }

      // Attach multiple photos if present (images[])
      const imgs = item.payload.images ?? (item.payload.image ? [item.payload.image] : [])
      imgs.forEach((dataUrl, idx) => {
        try {
          const blob = dataURLtoBlob(dataUrl)
          form.append('photos', blob, `photo_${idx + 1}.jpg`)
        } catch {}
      })

      await uploadPodMultipart(item.deliveryId, form)
      // success: drop from queue
    } catch {
      remaining.push(item)
    }
  }
  await setQueue(remaining)
  if (remaining.length) {
    ensureBackgroundSync().catch(() => {})
  }
}

function dataURLtoBlob(dataurl: string) {
  const arr = dataurl.split(',')
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/octet-stream'
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) u8arr[n] = bstr.charCodeAt(n)
  return new Blob([u8arr], { type: mime })
}
