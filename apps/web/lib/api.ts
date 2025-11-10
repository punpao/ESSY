const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

type FetchOptions = RequestInit & {
  token?: string | null;
};

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store"
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message ?? `Request failed (${res.status})`);
  }

  return (await res.json()) as T;
}

export async function getPaylink(token: string) {
  return apiFetch<{ id: string; title: string; amountSatang: number; status: string; sellerName: string; paymentStatus: string }>(
    `/paylinks/${token}`
  );
}

export async function createPromptPayCharge(payload: {
  paylinkToken: string;
  buyerEmail?: string;
  buyerDisplayName?: string;
}) {
  return apiFetch<{
    qrString: string;
    providerRef: string;
    paymentId: string;
    status: string;
    message: string;
  }>("/payments/create", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function createDeal(token: string, payload: { title: string; amountTHB: number }) {
  return apiFetch<{ deal: any; paylinkUrl: string; message: string }>("/deals", {
    method: "POST",
    token,
    body: JSON.stringify(payload)
  });
}

export async function getSellerDeals(token: string) {
  return apiFetch<{ deals: any[] }>("/seller/deals", {
    token
  });
}

export async function getBuyerDeals(token: string) {
  return apiFetch<{ deals: any[] }>("/buyer/deals", {
    token
  });
}

export async function shipDeal(token: string, dealId: string, payload: { trackingNumber: string; courier: string; deliveredAt?: string }) {
  return apiFetch<{ message: string; deal: any }>(`/deals/${dealId}/ship`, {
    method: "POST",
    token,
    body: JSON.stringify(payload)
  });
}

export async function confirmDeal(token: string, dealId: string) {
  return apiFetch<{ message: string; deal: any }>(`/deals/${dealId}/confirm`, {
    method: "POST",
    token
  });
}

export async function cancelDeal(token: string, dealId: string) {
  return apiFetch<{ message: string; deal: any }>(`/deals/${dealId}/cancel`, {
    method: "POST",
    token
  });
}

export async function openDispute(token: string, dealId: string, payload: { reason: string; category: "ของยังไม่ถึง" | "ของไม่ตรงปก" | "อื่น ๆ" }) {
  return apiFetch<{ message: string; dispute: any }>(`/disputes/${dealId}/open`, {
    method: "POST",
    token,
    body: JSON.stringify(payload)
  });
}

export async function uploadEvidence(
  token: string,
  disputeId: string,
  payload: { evidence: { url: string; kind: "image" | "chatlog" | "other"; note?: string }[] }
) {
  return apiFetch<{ message: string }>(`/disputes/${disputeId}/evidence`, {
    method: "POST",
    token,
    body: JSON.stringify(payload)
  });
}

export async function resolveDispute(
  token: string,
  disputeId: string,
  payload: { resolution: "REFUND" | "RELEASE"; note?: string }
) {
  return apiFetch<{ message: string }>(`/disputes/${disputeId}/resolve`, {
    method: "POST",
    token,
    body: JSON.stringify(payload)
  });
}

export async function getAdminDeals(token: string, status?: string) {
  const search = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiFetch<{ deals: any[] }>(`/admin/deals${search}`, { token });
}

export async function getAdminDisputes(token: string, status?: string) {
  const search = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiFetch<{ disputes: any[] }>(`/admin/disputes${search}`, { token });
}

export async function adminForceRelease(token: string, dealId: string) {
  return apiFetch<{ message: string }>(`/admin/deals/${dealId}/release`, {
    method: "POST",
    token
  });
}

export async function getSellerProfile(token: string) {
  return apiFetch<{ profile: any }>("/seller/me", { token });
}

export async function submitSellerKyc(
  token: string,
  payload: { promptPayId: string; promptPayName: string; selfieUrl: string; note?: string }
) {
  return apiFetch<{ message: string; profile: any }>("/seller/verify/basic", {
    method: "POST",
    token,
    body: JSON.stringify(payload)
  });
}

export async function getDispute(token: string, disputeId: string) {
  return apiFetch<{ dispute: any }>(`/disputes/${disputeId}`, { token });
}
