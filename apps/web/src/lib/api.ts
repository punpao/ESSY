const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new ApiError(response.status, error.error || 'Request failed')
  }

  return response.json()
}

export const api = {
  // Auth
  requestOTP: (email: string) =>
    apiRequest('/auth/email/request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifyOTP: (email: string, otp: string) =>
    apiRequest<{ token: string; user: any }>('/auth/email/verify', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    }),

  // Deals
  createDeal: (data: { title: string; amount_satang: number; buyer_note?: string }) =>
    apiRequest<{ deal: any; paylink_url: string }>('/deals', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getDeal: (id: string) => apiRequest<{ deal: any }>(`/deals/${id}`),

  addTracking: (dealId: string, data: { tracking_number: string; courier: string }) =>
    apiRequest(`/deals/${dealId}/ship`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  confirmReceipt: (dealId: string) =>
    apiRequest(`/deals/${dealId}/confirm`, {
      method: 'POST',
    }),

  // Payments
  createPayment: (dealId: string) =>
    apiRequest<{ payment: any; qr_string: string; expires_at: string }>(
      '/payments/create',
      {
        method: 'POST',
        body: JSON.stringify({ deal_id: dealId }),
      }
    ),

  mockWebhook: (provider_ref: string, status: 'PAID' | 'FAILED') =>
    apiRequest('/payments/webhook/mock', {
      method: 'POST',
      body: JSON.stringify({ provider_ref, status }),
    }),

  // Seller
  getSellerProfile: () => apiRequest<{ profile: any }>('/seller/me'),

  submitKYC: (data: { promptpay_id: string; promptpay_name: string }) =>
    apiRequest('/seller/verify/basic', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Disputes
  openDispute: (dealId: string, data: { reason: string; reason_text: string }) =>
    apiRequest(`/disputes/${dealId}/open`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getDispute: (id: string) => apiRequest<{ dispute: any }>(`/disputes/${id}`),

  addEvidence: (disputeId: string, data: { kind: string; url: string; note?: string }) =>
    apiRequest(`/disputes/${disputeId}/evidence`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  resolveDispute: (disputeId: string, data: { resolution: string; resolution_note: string }) =>
    apiRequest(`/disputes/${disputeId}/resolve`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Admin
  getAdminDeals: (params?: { status?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams(params as any).toString()
    return apiRequest<{ deals: any[]; pagination: any }>(`/admin/deals?${query}`)
  },

  getAdminDisputes: (params?: { status?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams(params as any).toString()
    return apiRequest<{ disputes: any[]; pagination: any }>(`/admin/disputes?${query}`)
  },

  forceRelease: (dealId: string) =>
    apiRequest(`/admin/deals/${dealId}/release`, {
      method: 'POST',
    }),
}
