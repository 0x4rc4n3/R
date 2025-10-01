// ============================================
// FILE: frontend/src/utils/api.js - EXTREME MINIFIED
// ============================================

const U = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const T = () => localStorage.getItem('token');
const H = (a = true, f = false) => {
  const h = {};
  if (!f) h['Content-Type'] = 'application/json';
  const t = a && T();
  if (t) h['Authorization'] = `Bearer ${t}`;
  return h;
};

const HR = async (r) => {
  if (r.status === 401) {
    localStorage.removeItem('token');
    if (!/^\/(login|register)$/.test(window.location.pathname)) window.location.href = '/login';
    throw new Error('Unauthorized - Please login again');
  }

  const c = r.headers.get('content-type');
  const d = c && c.includes('application/json') ? await r.json() : await r.text();

  if (!r.ok) throw new Error(d?.message || d?.error || `HTTP Error: ${r.status}`);
  return d;
};

const R = async (e, o = {}) => {
  const { method: m = 'GET', data: d = null, requiresAuth: a = true, isFormData: f = false } = o;
  const u = `${U}${e}`;
  const h = H(a, f);
  const conf = { method: m, headers: h };
  if (d && /^(POST|PUT|PATCH)$/.test(m)) conf.body = f ? d : JSON.stringify(d);

  try {
    console.log(`🔄 API: ${m} ${u}`);
    const r = await fetch(u, conf);
    const res = await HR(r);
    console.log(`✅ API: ${m} ${u}`, res);
    return res;
  } catch (err) {
    console.error(`❌ API Error: ${m} ${u}`, err);
    if (err.message === 'Failed to fetch' || err.name === 'TypeError') throw new Error('Network error - Please check your connection and ensure the server is running at ' + U);
    throw err;
  }
};

const api = {
  auth: {
    login: (e, p) => (console.log('📧 Login:', e), R('/api/auth/login', { method: 'POST', data: { email: e, password: p }, requiresAuth: false })),
    register: (u) => (console.log('📝 Register:', u.email), R('/api/auth/register', { method: 'POST', data: u, requiresAuth: false })),
    getProfile: () => R('/api/auth/profile', { method: 'GET' }),
    updateProfile: (u) => R('/api/auth/profile', { method: 'PUT', data: u })
  },

  recipes: {
    getAll: (p = {}) => {
      const q = new URLSearchParams(Object.fromEntries(Object.entries(p).filter(([_, v]) => v != null && v !== ''))).toString();
      return R(`/api/recipes${q ? `?${q}` : ''}`, { method: 'GET' });
    },
    getById: (id) => R(`/api/recipes/${id}`, { method: 'GET' }),
    create: (d) => R('/api/recipes', { method: 'POST', data: d, isFormData: d instanceof FormData }),
    update: (id, d) => R(`/api/recipes/${id}`, { method: 'PUT', data: d, isFormData: d instanceof FormData }),
    delete: (id) => R(`/api/recipes/${id}`, { method: 'DELETE' })
  },

  users: {
    saveRecipe: (id) => R(`/api/users/save-recipe/${id}`, { method: 'POST' }),
    getSavedRecipes: () => R('/api/users/saved-recipes', { method: 'GET' })
  },

  health: () => R('/health', { method: 'GET', requiresAuth: false })
};

export default api;
export const { auth: authAPI, recipes: recipesAPI, users: usersAPI } = api;