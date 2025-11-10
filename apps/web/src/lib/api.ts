const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
}

async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || 'Request failed' };
    }

    return { data };
  } catch (error: any) {
    return { error: error.message || 'Network error' };
  }
}

export const api = {
  // Auth
  async loginWithEmail(email: string, code: string) {
    return apiCall('/api/v1/auth/email/verify', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  },

  async requestOtp(email: string) {
    return apiCall('/api/v1/auth/email/request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async getMe() {
    return apiCall('/api/v1/auth/me');
  },

  // Seller
  async getSellerProfile() {
    return apiCall('/api/v1/seller/me');
  },

  async submitKyc(data: { promptpayId: string; promptpayName: string }) {
    return apiCall('/api/v1/seller/verify/basic', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Deals
  async createDeal(data: { title: string; amountSatang: number }) {
    return apiCall('/api/v1/deals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getDeal(id: string) {
    return apiCall(`/api/v1/deals/${id}`);
  },

  async getDealByToken(token: string) {
    return apiCall(`/api/v1/deals/token/${token}`);
  },

  async getMyDeals() {
    return apiCall('/api/v1/deals/my/all');
  },

  async shipDeal(id: string, data: { trackingNumber: string; courier: string }) {
    return apiCall(`/api/v1/deals/${id}/ship`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async confirmDeal(id: string) {
    return apiCall(`/api/v1/deals/${id}/confirm`, {
      method: 'POST',
    });
  },

  // Payments
  async createPayment(dealId: string) {
    return apiCall('/api/v1/payments/create', {
      method: 'POST',
      body: JSON.stringify({ dealId }),
    });
  },

  async mockPaymentWebhook(data: {
    event: string;
    providerRef: string;
    status: string;
    paidAt?: string;
  }) {
    return apiCall('/api/v1/payments/webhook/mock', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Disputes
  async openDispute(dealId: string, reasonText: string) {
    return apiCall(`/api/v1/disputes/${dealId}/open`, {
      method: 'POST',
      body: JSON.stringify({ reasonText }),
    });
  },

  async getDispute(id: string) {
    return apiCall(`/api/v1/disputes/${id}`);
  },

  async addEvidence(disputeId: string, data: { kind: string; url: string; note?: string }) {
    return apiCall(`/api/v1/disputes/${disputeId}/evidence`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async resolveDispute(
    disputeId: string,
    data: { resolution: string; resolutionNote: string }
  ) {
    return apiCall(`/api/v1/disputes/${disputeId}/resolve`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Admin
  async getAdminDeals(status?: string) {
    const query = status ? `?status=${status}` : '';
    return apiCall(`/api/v1/admin/deals${query}`);
  },

  async getAdminDisputes(status?: string) {
    const query = status ? `?status=${status}` : '';
    return apiCall(`/api/v1/admin/disputes${query}`);
  },

  async forceRelease(dealId: string, note?: string) {
    return apiCall(`/api/v1/admin/deals/${dealId}/release`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
  },

  async getStats() {
    return apiCall('/api/v1/admin/stats');
  },
};
