// Centralized API endpoints for the Canhoto Digital PWA
// Build paths here to avoid hardcoding strings across the codebase.

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export const endpoints = {
  auth: {
    token: () => `/v1/auth/token/`,
    refresh: () => `/v1/auth/refresh/`,
  },
  user: {
    preferences: (userId: number | string) => `/v1/user/users/${userId}/preferences/`,
    changePassword: () => `/v1/user/users/change-password/`,
  },
  delivery: {
    list: () => `/v1/delivery/deliveries/`,
    detail: (deliveryId: string) => `/v1/delivery/deliveries/${deliveryId}/`,
    presign: (deliveryId: string) => `/v1/delivery/deliveries/${deliveryId}/presign/`,
    pods: () => `/v1/delivery/pods/`,
  },
} as const
