const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || "Request failed");
  }

  return response.json();
}

export const api = {
  // Auth
  lineCallback: (code: string) =>
    apiRequest<{ token: string; user: any }>("/auth/line/callback", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),

  emailRequest: (email: string) =>
    apiRequest("/auth/email/request", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  emailVerify: (email: string, otp: string) =>
    apiRequest<{ token: string; user: any }>("/auth/email/verify", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    }),

  // Deals
  createDeal: (data: { title: string; amountSatang: number; buyerNote?: string }) =>
    apiRequest<{ deal: any; paylinkUrl: string }>("/deals", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getDeal: (id: string) => apiRequest<any>(`/deals/${id}`),

  shipDeal: (id: string, data: { trackingNumber: string; courier: string }) =>
    apiRequest(`/deals/${id}/ship`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  confirmDeal: (id: string) =>
    apiRequest(`/deals/${id}/confirm`, {
      method: "POST",
    }),

  // Payments
  createPayment: (dealId: string) =>
    apiRequest<{ payment: any; qrString: string; providerRef: string }>(
      "/payments/create",
      {
        method: "POST",
        body: JSON.stringify({ dealId }),
      }
    ),

  // Disputes
  openDispute: (dealId: string, reasonText: string) =>
    apiRequest<{ id: string }>(`/disputes/${dealId}/open`, {
      method: "POST",
      body: JSON.stringify({ reasonText }),
    }),

  addEvidence: (disputeId: string, data: { url: string; kind: string; note?: string }) =>
    apiRequest(`/disputes/${disputeId}/evidence`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Seller
  getSellerProfile: () => apiRequest<any>("/seller/me"),

  submitKYC: (data: { promptpayId: string; promptpayName: string; selfieUrl?: string }) =>
    apiRequest("/seller/verify/basic", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Admin
  getAdminDeals: (status?: string) =>
    apiRequest<{ deals: any[] }>(`/admin/deals${status ? `?status=${status}` : ""}`),

  getAdminDisputes: (status?: string) =>
    apiRequest<{ disputes: any[] }>(`/admin/disputes${status ? `?status=${status}` : ""}`),

  resolveDispute: (id: string, resolution: string, note: string) =>
    apiRequest(`/disputes/${id}/resolve`, {
      method: "POST",
      body: JSON.stringify({ resolution, resolutionNote: note }),
    }),
};
