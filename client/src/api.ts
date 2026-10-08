import {
  User,
  TicketSummary,
  TicketWithRelations,
  TicketStatus,
  TicketPriority,
  NotificationItem,
  DashboardStats,
} from './types';

const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api';

function getToken(): string | null {
  return localStorage.getItem('nexusdesk_token');
}

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem('nexusdesk_token', token);
  } else {
    localStorage.removeItem('nexusdesk_token');
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.error || (data?.error ? JSON.stringify(data.error) : `HTTP ${response.status}`);
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Auth
  async signup(name: string, email: string, password: string): Promise<{ user: User; token: string }> {
    return request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  },

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async getMe(): Promise<{ user: User }> {
    return request('/me');
  },

  // Tickets
  async listTickets(params?: { status?: TicketStatus; priority?: TicketPriority }): Promise<{ tickets: TicketSummary[] }> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.priority) query.set('priority', params.priority);
    const qs = query.toString();
    return request(`/tickets${qs ? `?${qs}` : ''}`);
  },

  async getTicket(id: string): Promise<{ ticket: TicketWithRelations }> {
    return request(`/tickets/${id}`);
  },

  async createTicket(input: {
    title: string;
    description: string;
    priority?: TicketPriority;
    autoAssign?: boolean;
  }): Promise<{ ticket: TicketWithRelations }> {
    return request('/tickets', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async updateStatus(id: string, status: TicketStatus): Promise<{ ticket: TicketWithRelations }> {
    return request(`/tickets/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async assignTicket(id: string, assigneeId: string | null): Promise<{ ticket: TicketWithRelations }> {
    return request(`/tickets/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ assigneeId }),
    });
  },

  async autoAssign(id: string): Promise<{ ticket: TicketWithRelations }> {
    return request(`/tickets/${id}/auto-assign`, {
      method: 'PATCH',
    });
  },

  // Admin
  async getAnalytics(): Promise<{ analytics: DashboardStats }> {
    return request('/admin/analytics');
  },

  async listUsers(): Promise<{ users: User[] }> {
    return request('/admin/users');
  },

  // Notifications
  async listNotifications(unreadOnly = false): Promise<{ notifications: NotificationItem[]; unreadCount: number }> {
    return request(`/notifications${unreadOnly ? '?unread=true' : ''}`);
  },

  async markNotificationRead(id: string): Promise<{ notification: NotificationItem }> {
    return request(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },
};
