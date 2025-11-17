import axios from 'axios'
import type { AxiosError } from 'axios'
import type { ReactNode } from 'react'
import i18n from '../i18n'
import { getAccessToken, refreshAccessToken, setAccessToken, logout } from './auth'
import { endpoints } from './endpoints'

export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}`,
})

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  // Ensure headers object exists
  config.headers = config.headers ?? {}
  // Always send the user's chosen language; default to pt-BR if undefined
  config.headers['Accept-Language'] = i18n.language || 'pt-BR'
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let queue: Array<(token: string | null) => void> = []

function drainQueue(token: string | null) {
  queue.forEach((cb) => cb(token))
  queue = []
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as any

    if (error.response?.status === 401 && !original?._retry) {
      original._retry = true

      if (!isRefreshing) {
        isRefreshing = true
        try {
          const newToken = await refreshAccessToken()
          setAccessToken(newToken)
          drainQueue(newToken)
          isRefreshing = false
        } catch (e) {
          drainQueue(null)
          isRefreshing = false
          // Logout on refresh failure to clear stale tokens
          try { logout() } catch {}
        }
      }

      // Wait for refresh to finish and retry
      const nextToken = await new Promise<string | null>((resolve) => queue.push(resolve))
      if (nextToken) {
        original.headers = original.headers ?? {}
        original.headers['Authorization'] = `Bearer ${nextToken}`
        return api(original)
      } else {
        // If we still don't have a token, ensure we logout
        try { logout() } catch {}
      }
    }

    return Promise.reject(error)
  }
)

// API models based on backend serializers
export interface Invoice {
  id: string
  company: string
  company_name: string
  number: string
  series: string
  issuer_name: string
  issue_date: string
  total_value: string
  recipient_name: string
  recipient_address_street: string
  recipient_address_number: string
  recipient_address_neighborhood: string
  recipient_address_city: string
  recipient_address_uf: string
  recipient_address_zip_code: string
  xml_file: string | null
  pdf_file: string | null
  status: string
  created_at: string
  updated_at: string
}

export interface Delivery {
  status_display: ReactNode
  id: string // UUID
  code: string
  status: 'pending' | 'delivered' | 'failed' | 'partial' | 'rejected'
  invoice: Invoice
  observations?: string | null
  assigned_to?: number | null
  created_at?: string
  delivery_at?: string | null
}

export interface PresignUpload {
  filename: string
  url: string
  fields: Record<string, string>
}

export interface PresignResponse { uploads: PresignUpload[] }

export interface CreatePodPayload {
  delivery: string
  received_by_name: string
  received_by_document?: string
  signed_at: string // ISO date string from client
  location?: [number, number] | null // [lng, lat]
  signature_image?: string // URL (when not multipart)
  photos?: string[] // URLs (when not multipart)
  meta?: Record<string, any>
}

export async function fetchDeliveries(): Promise<Delivery[]> {
  const { data } = await api.get(endpoints.delivery.list())
  // Normalize various possible backend shapes to always return an array
  const list = Array.isArray(data)
    ? data
    : Array.isArray((data as any)?.results)
      ? (data as any).results
      : Array.isArray((data as any)?.data)
        ? (data as any).data
        : []
  return list as Delivery[]
}

export async function fetchDeliveryById(id: string): Promise<Delivery> {
  const { data } = await api.get(endpoints.delivery.detail(id))
  return data as Delivery
}

export async function presignUploads(deliveryId: string, files: string[]): Promise<PresignResponse> {
  const { data } = await api.post(endpoints.delivery.presign(deliveryId), { files })
  return data
}

export async function createPod(deliveryId: string, payload: CreatePodPayload) {
  const body: CreatePodPayload = { ...payload, delivery: deliveryId }
  const { data } = await api.post(endpoints.delivery.pods(), body)
  return data
}

// New: multipart POD upload (signature + multiple photos)
export async function uploadPodMultipart(deliveryId: string, form: FormData) {
  // Ensure delivery id is present in form as required by new endpoint
  if (!form.has('delivery')) form.append('delivery', deliveryId)
  const { data } = await api.post(endpoints.delivery.pods(), form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function uploadToPresigned(upload: PresignUpload, file: File | Blob) {
  const form = new FormData()
  // Append required fields first
  Object.entries(upload.fields).forEach(([k, v]) => form.append(k, v))
  // The file field name for S3 should be 'file'
  form.append('file', file)
  const resp = await fetch(upload.url, { method: 'POST', body: form })
  if (!resp.ok) {
    throw new Error(i18n.t('errors.upload_failed'))
  }
  // Construct final URL. For S3, object is usually at `${url}/${fields.key}`
  const key = upload.fields['key']
  const finalUrl = key ? `${upload.url.replace(/\/$/, '')}/${key}` : upload.url
  return finalUrl
}

// User preferences update
export type UpdateUserPreferencesPayload = {
  name: string
  username: string
  first_name?: string
  last_name?: string
  cellphone?: string | null
  email: string
  allow_email_notifications: boolean
  allow_push_notifications: boolean
  allow_sms_notifications: boolean
  allow_whatsapp_notifications: boolean
  preferred_language: string
}

export async function updateUserPreferences(userId: number | string, payload: UpdateUserPreferencesPayload) {
  const { data } = await api.patch(endpoints.user.preferences(userId), payload)
  return data
}

// Change password
export type ChangePasswordPayload = {
  current_password: string
  new_password: string
}

export async function changePassword(payload: ChangePasswordPayload) {
  const { data } = await api.post(endpoints.user.changePassword(), payload)
  return data
}
