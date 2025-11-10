import { useAuthStore } from "@/store/auth";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

interface RequestOptions extends RequestInit {
  token?: string | null;
}

export async function apiRequest<T>(
  path: string,
  { token, headers, ...options }: RequestOptions = {}
): Promise<T> {
  const authToken = token ?? useAuthStore.getState().token ?? undefined;
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers
    },
    ...options
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function postJson<T>(path: string, body: unknown, options?: RequestOptions) {
  return apiRequest<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
    ...options
  });
}

export function getJson<T>(path: string, options?: RequestOptions) {
  return apiRequest<T>(path, {
    method: "GET",
    ...options
  });
}
