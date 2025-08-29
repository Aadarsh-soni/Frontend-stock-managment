// src/lib/api.ts
function join(base: string, path: string) {
  const b = base.endsWith('/') ? base.slice(0, -1) : base;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
}
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(join(BASE, path), {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers || {}),
    },
    body: options.body,
    credentials: 'include',  // IMPORTANT for auth cookies
  });

  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try { msg = (await res.text()) || msg; } catch {}
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}