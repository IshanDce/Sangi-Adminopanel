// SANGI Admin Panel API Service Client

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://13.140.190.198:5000/api/v1';

class ApiClient {
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    const token = localStorage.getItem('sangi_admin_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('sangi_admin_token');
        localStorage.removeItem('sangi_admin_user');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      throw new Error(data.message || `HTTP ${response.status}: Failed request`);
    }

    return data as T;
  }

  // ── Auth ──
  login(body: { email: string; password: string }) {
    return this.request<{ success: boolean; token: string; user: any }>('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  getMe() {
    return this.request<{ success: boolean; user: any }>('/admin/auth/me');
  }

  // ── Dashboard ──
  getDashboardStats() {
    return this.request<{ success: boolean; stats: any; recentBookings: any[]; pendingKycList: any[] }>('/admin/dashboard/stats');
  }

  // ── Customers ──
  getCustomers(params: { search?: string; isBlocked?: string; page?: number; limit?: number } = {}) {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.isBlocked) query.set('isBlocked', params.isBlocked);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    return this.request<{ success: boolean; customers: any[]; pagination: any }>(`/admin/customers?${query.toString()}`);
  }

  getCustomerById(id: string) {
    return this.request<{ success: boolean; customer: any; bookings: any[]; transactions: any[] }>(`/admin/customers/${id}`);
  }

  // ── Staff & KYC ──
  getStaff(params: { search?: string; kycStatus?: string; isBlocked?: string; service?: string; page?: number; limit?: number } = {}) {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.kycStatus) query.set('kycStatus', params.kycStatus);
    if (params.isBlocked) query.set('isBlocked', params.isBlocked);
    if (params.service) query.set('service', params.service);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    return this.request<{ success: boolean; staff: any[]; pagination: any }>(`/admin/staff?${query.toString()}`);
  }

  getStaffById(id: string) {
    return this.request<{ success: boolean; user: any; profile: any; bookings: any[]; transactions: any[] }>(`/admin/staff/${id}`);
  }

  updateStaffKyc(id: string, action: 'approve' | 'reject', rejectionReason?: string) {
    return this.request<{ success: boolean; message: string; profile: any }>(`/admin/staff/${id}/kyc`, {
      method: 'PUT',
      body: JSON.stringify({ action, rejectionReason }),
    });
  }

  // ── Users Blocking ──
  toggleBlockUser(id: string, isBlocked: boolean, reason?: string) {
    return this.request<{ success: boolean; message: string; user: any }>(`/admin/users/${id}/block`, {
      method: 'PUT',
      body: JSON.stringify({ isBlocked, reason }),
    });
  }

  // ── Bookings ──
  getBookings(params: { status?: string; search?: string; service?: string; page?: number; limit?: number } = {}) {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.search) query.set('search', params.search);
    if (params.service) query.set('service', params.service);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    return this.request<{ success: boolean; bookings: any[]; pagination: any }>(`/admin/bookings?${query.toString()}`);
  }

  getBookingById(id: string) {
    return this.request<{ success: boolean; booking: any; staffDetails: any }>(`/admin/bookings/${id}`);
  }

  // ── Services & Pricing ──
  getServices() {
    return this.request<{ success: boolean; services: any[] }>('/admin/services');
  }

  createService(data: any) {
    return this.request<{ success: boolean; message: string; service: any }>('/admin/services', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateService(id: string, data: any) {
    return this.request<{ success: boolean; message: string; service: any }>(`/admin/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  deleteService(id: string) {
    return this.request<{ success: boolean; message: string }>(`/admin/services/${id}`, {
      method: 'DELETE',
    });
  }

  // ── Withdrawals ──
  getWithdrawals(params: { status?: string; page?: number; limit?: number } = {}) {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    return this.request<{ success: boolean; withdrawals: any[]; pagination: any }>(`/admin/withdrawals?${query.toString()}`);
  }

  approveWithdrawal(id: string, utrReference: string, adminNotes?: string) {
    return this.request<{ success: boolean; message: string; withdrawal: any }>(`/admin/withdrawals/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ utrReference, adminNotes }),
    });
  }

  rejectWithdrawal(id: string, rejectionReason: string) {
    return this.request<{ success: boolean; message: string; withdrawal: any }>(`/admin/withdrawals/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ rejectionReason }),
    });
  }

  // ── Bank Accounts ──
  getBankAccounts() {
    return this.request<{ success: boolean; count: number; accounts: any[] }>('/admin/bank-accounts');
  }

  // ── Notifications ──
  sendNotification(data: { target: string; userId?: string; title: string; message: string; type?: string }) {
    return this.request<{ success: boolean; message: string; totalRecipients: number; pushedCount: number }>('/admin/notifications/send', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  getNotificationHistory() {
    return this.request<{ success: boolean; count: number; history: any[] }>('/admin/notifications/history');
  }
}

export const api = new ApiClient();
