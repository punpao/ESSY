const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1';

export interface ApiOptions extends RequestInit {
  token?: string | null;
}

export async function apiFetch<TResponse>(
  path: string,
  { token, headers, body, ...init }: ApiOptions = {}
): Promise<TResponse> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: typeof body === 'string' ? body : body ? JSON.stringify(body) : undefined
  });

  if (!res.ok) {
    const errorBody = await safeJson(res);
    throw new Error(errorBody?.message ?? `API error: ${res.status}`);
  }

  return res.json() as Promise<TResponse>;
}

const safeJson = async (res: Response) => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};
