import type { Account, Transaction } from '../types'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export function getToken(): string | null {
  return localStorage.getItem('bartho_token')
}

export function setToken(token: string): void {
  localStorage.setItem('bartho_token', token)
}

export function clearToken(): void {
  localStorage.removeItem('bartho_token')
}

export function isAuthenticated(): boolean {
  return !!getToken()
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  })

  if (res.status === 401) {
    clearToken()
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`)
  }

  return res.json() as Promise<T>
}

export const api = {
  register: (body: { email: string; password: string; firstName: string; lastName: string }) =>
    request<{ token: string }>('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) =>
    request<{ token: string }>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  getAccount: () =>
    request<Account>('/api/account'),

  updateAccount: (body: Partial<Account>) =>
    request<Account>('/api/account', { method: 'PATCH', body: JSON.stringify(body) }),

  getTransactions: () =>
    request<Transaction[]>('/api/transactions'),

  transfer: (body: { toName: string; toAccount: string; amount: number; reference?: string }) =>
    request<Transaction>('/api/transfers', { method: 'POST', body: JSON.stringify(body) }),
}
