const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || error.message || "Request failed");
  }

  return response.json();
}

export const api = {
  auth: {
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
    me: () => apiRequest("/auth/me"),
  },
  deals: {
    create: (data: { title: string; amount_satang: number; buyer_note?: string }) =>
      apiRequest<{ deal: any; paylink_url: string }>("/deals", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    get: (id: string) => apiRequest<any>(`/deals/${id}`),
    ship: (id: string, data: { tracking_number: string; courier: string }) =>
      apiRequest(`/deals/${id}/ship`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    confirm: (id: string) =>
      apiRequest(`/deals/${id}/confirm`, {
        method: "POST",
      }),
    cancel: (id: string) =>
      apiRequest(`/deals/${id}/cancel`, {
        method: "POST",
      }),
  },
  payments: {
    create: (dealId: string) =>
      apiRequest<{ payment_id: string; qr_string: string; provider_ref: string }>(
        "/payments/create",
        {
          method: "POST",
          body: JSON.stringify({ dealId }),
        }
      ),
    webhook: (data: { provider_ref: string; status: "PAID" | "FAILED"; buyer_id?: string }) =>
      apiRequest("/payments/webhook/mock", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
  disputes: {
    open: (dealId: string, reason_text: string) =>
      apiRequest(`/disputes/${dealId}/open`, {
        method: "POST",
        body: JSON.stringify({ reason_text }),
      }),
    addEvidence: (id: string, data: { url: string; kind: "image" | "chatlog" | "other"; note?: string }) =>
      apiRequest(`/disputes/${id}/evidence`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    get: (id: string) => apiRequest<any>(`/disputes/${id}`),
  },
  seller: {
    me: () => apiRequest<any>("/seller/me"),
    verifyBasic: (data: { promptpay_id: string; promptpay_name: string }, file?: File) => {
      const formData = new FormData();
      formData.append("promptpay_id", data.promptpay_id);
      formData.append("promptpay_name", data.promptpay_name);
      if (file) formData.append("selfie", file);

      return fetch(`${API_BASE}/seller/verify/basic`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      }).then((r) => r.json());
    },
  },
};
