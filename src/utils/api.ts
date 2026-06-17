const BASE = '/api';

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function normalizeKeys(obj: any): any {
  if (Array.isArray(obj)) return obj.map(normalizeKeys);
  if (obj !== null && typeof obj === 'object') {
    const result: any = {};
    for (const key of Object.keys(obj)) {
      result[toCamelCase(key)] = normalizeKeys(obj[key]);
    }
    return result;
  }
  return obj;
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...getAuthHeaders(), ...(options?.headers || {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error || err.message || 'Request failed');
  }
  const json = await res.json();
  return normalizeKeys(json) as T;
}

export const api = {
  auth: {
    register: (data: { email: string; username: string; password: string }) =>
      request<{ success: boolean; token: string; user: any }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    login: (data: { email: string; password: string }) =>
      request<{ success: boolean; token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    me: () =>
      request<{ success: boolean; user: any }>('/auth/me'),
  },
  concerts: {
    list: (keyword?: string) => {
      const params = keyword ? `?keyword=${encodeURIComponent(keyword)}` : '';
      return request<{ success: boolean; concerts: any[] }>(`/concerts${params}`);
    },
    get: (id: number) =>
      request<{ success: boolean; concert: any; companionCount: number; merchCount: number }>(`/concerts/${id}`),
  },
  posts: {
    list: (concertId: number, type?: string) => {
      const params = type ? `?type=${type}` : '';
      return request<{ success: boolean; posts: any[] }>(`/concerts/${concertId}/posts${params}`);
    },
    create: (concertId: number, data: { type: string; title: string; content: string }) =>
      request<{ success: boolean; post: any }>(`/concerts/${concertId}/posts`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    get: (id: number) =>
      request<{ success: boolean; post: any }>(`/posts/${id}`),
  },
  messages: {
    conversations: () =>
      request<{ success: boolean; conversations: any[] }>('/messages/conversations'),
    list: (userId: number, page = 1) =>
      request<{ success: boolean; messages: any[] }>(`/messages/${userId}?page=${page}`),
    send: (userId: number, content: string) =>
      request<{ success: boolean; message: any }>(`/messages/${userId}`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
  },
  ratings: {
    create: (userId: number, data: { score: number; comment: string; concertId?: number }) =>
      request<{ success: boolean; rating: any }>(`/users/${userId}/ratings`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    list: (userId: number) =>
      request<{ success: boolean; ratings: any[]; averageScore: number; total: number }>(`/users/${userId}/ratings`),
  },
  verification: {
    submitIdentity: (data: { realName: string; idCard: string }) =>
      request<{ success: boolean; verification: any }>('/verification/identity', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getIdentity: () =>
      request<{ success: boolean; verification: any }>('/verification/identity'),
    submitTicket: (data: { concertId: number; ticketNumber: string; purchaseChannel?: string; seatInfo?: string }) =>
      request<{ success: boolean; verification: any }>('/verification/ticket', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getTicket: (concertId: number) =>
      request<{ success: boolean; verification: any }>(`/verification/ticket/${concertId}`),
    getTickets: () =>
      request<{ success: boolean; verifications: any[] }>('/verification/tickets'),
    getStatus: (concertId: number, userId: number) =>
      request<{ success: boolean; status: { identityVerified: boolean; ticketVerified: boolean; fullyVerified: boolean } }>(`/verification/status/${concertId}/${userId}`),
  },
};
