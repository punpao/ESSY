const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    },
    cache: 'no-store'
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`API error ${res.status}: ${errorBody}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getDealByPaylink(token: string) {
    return request<{ deal: unknown }>(`/paylinks/${token}`);
  },
  createDeal(input: Record<string, unknown>) {
    return request<{ paylinkUrl: string }>(`/deals`, { method: 'POST', body: JSON.stringify(input) });
  }
};
