const BASE_URL = '/api';

export async function apiRequest(endpoint, { method = 'GET', body, token } = {}) {
  const headers = {
    'Content-Type': 'application/json',
  };

  const authToken = token || localStorage.getItem('sweety_token');
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  let data;
  try {
    data = await response.json();
  } catch {
    data = { error: 'Failed to parse server response.' };
  }

  if (!response.ok) {
    const errorMsg = data?.error || 'Something went wrong. Please try again.';
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// Authentication API
export const authApi = {
  login: (email, password) => apiRequest('/auth/login', { method: 'POST', body: { email, password } }),
  register: (name, email, password) => apiRequest('/auth/register', { method: 'POST', body: { name, email, password } }),
  getProfile: () => apiRequest('/auth/me'),
};

// Readings API
export const readingsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    if (params.date) query.append('date', params.date);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    const qs = query.toString();
    return apiRequest(`/readings${qs ? `?${qs}` : ''}`);
  },
  getById: (id) => apiRequest(`/readings/${id}`),
  create: (data) => apiRequest('/readings', { method: 'POST', body: data }),
  update: (id, data) => apiRequest(`/readings/${id}`, { method: 'PUT', body: data }),
  delete: (id) => apiRequest(`/readings/${id}`, { method: 'DELETE' }),
};

// Reports API
export const reportsApi = {
  getAll: (date) => apiRequest(`/reports${date ? `?date=${date}` : ''}`),
  getDaily: (date) => apiRequest(`/reports/daily${date ? `?date=${date}` : ''}`),
  getMonthToDate: (date) => apiRequest(`/reports/month-to-date${date ? `?date=${date}` : ''}`),
  getMonthly: (date) => apiRequest(`/reports/monthly${date ? `?date=${date}` : ''}`),
};
