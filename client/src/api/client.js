const API_BASE = '/api';

export function getToken() {
  return localStorage.getItem('lovecapsule_token');
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('lovecapsule_token', token);
  } else {
    localStorage.removeItem('lovecapsule_token');
  }
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    ...options.headers
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Có lỗi xảy ra, vui lòng thử lại');
  }
  return data;
}

export const api = {
  // Auth
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => request('/auth/me'),
  updateProfile: (body) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(body) }),

  // Couple
  createCouple: (anniversary_date) => request('/couple/create', { method: 'POST', body: JSON.stringify({ anniversary_date }) }),
  joinCouple: (couple_code) => request('/couple/join', { method: 'POST', body: JSON.stringify({ couple_code }) }),
  cancelPendingCouple: () => request('/couple/cancel-pending', { method: 'POST' }),
  getCoupleInfo: () => request('/couple/info'),

  // Heart
  getWallet: () => request('/heart/wallet'),
  checkIn: () => request('/heart/checkin', { method: 'POST' }),
  waterPlant: () => request('/heart/water', { method: 'POST' }),
  giftHearts: (receiver_id, amount, message) => request('/heart/gift', {
    method: 'POST',
    body: JSON.stringify({ receiver_id, amount, message })
  }),

  // Letters
  getLetters: () => request('/letters'),
  getLetterDetail: (id) => request(`/letters/${id}`),
  createLetter: (body) => request('/letters', { method: 'POST', body: JSON.stringify(body) }),
  updateLetter: (id, body) => request(`/letters/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteLetter: (id) => request(`/letters/${id}`, { method: 'DELETE' }),
  unlockLetter: (id, body) => request(`/letters/${id}/unlock`, { method: 'POST', body: JSON.stringify(body) }),

  // Milestones
  getMilestones: () => request('/milestones'),
  createMilestone: (body) => request('/milestones', { method: 'POST', body: JSON.stringify(body) }),

  // Scrapbook
  getScrapbook: () => request('/scrapbook'),
  saveScrapbook: (body) => request('/scrapbook', { method: 'PUT', body: JSON.stringify(body) }),

  // Upload real photo or sticker
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/upload', { method: 'POST', body: formData });
  }
};
