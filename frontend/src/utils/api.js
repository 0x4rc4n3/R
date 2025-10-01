const URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const T = () => localStorage.getItem('token');
const H = (f) => ({ 'Content-Type': 'application/json', ...(f && { Authorization: `Bearer ${f}` }) });
const HU = () => (T() ? { Authorization: `Bearer ${T()}` } : {});

const HR = async (r) => {
  if (r.ok) return r.json();
  const e = await r.json().catch(() => ({ message: 'An error occurred' }));
  throw new Error(e.message || `HTTP Error: ${r.status}`);
};

const HE = (e) => {
  console.error('API Error:', e);
  if (/(Failed to fetch|NetworkError)/.test(e.message)) throw new Error('Network error. Please check your internet connection and ensure the server is running.');
  throw e;
};

const AC = async (u, o = {}) => {
  try { return await HR(await fetch(u, o)); } 
  catch (e) { HE(e); }
};

const CM = (m, e, o = {}) => async (d, id) => {
  const { requiresAuth: r = true, isFormData: f = false, customPath: c } = o;
  let p = e;
  if (c) p = c(id, d);
  else if (id) p = `${e}/${id}`;

  const h = f ? HU() : H(T());
  const reqH = r ? h : { 'Content-Type': 'application/json' };

  const conf = { method: m, headers: reqH };

  if (d && /^(POST|PUT|PATCH)$/.test(m)) conf.body = f ? d : JSON.stringify(d);
  return AC(`${URL}${p}`, conf);
};

const api = {
  auth: {
    login: (e, p) => CM('POST', '/api/auth/login', { requiresAuth: false })({ email: e, password: p }),
    register: (u) => CM('POST', '/api/auth/register', { requiresAuth: false })(u),
    getProfile: () => CM('GET', '/api/auth/profile')(),
    updateProfile: (u) => CM('PUT', '/api/auth/profile')(u),
    changePassword: (c, n) => CM('PUT', '/api/auth/change-password')({ currentPassword: c, newPassword: n })
  },

  recipes: {
    getAll: async (p = {}) => {
      const q = new URLSearchParams(Object.fromEntries(Object.entries(p).filter(([_, v]) => v != null && v !== ''))).toString();
      return CM('GET', `/api/recipes${q ? `?${q}` : ''}`)();
    },
    getById: (id) => CM('GET', '/api/recipes')(null, id),
    create: (d) => CM('POST', '/api/recipes', { isFormData: d instanceof FormData })(d),
    update: (id, d) => CM('PUT', '/api/recipes', { isFormData: d instanceof FormData })(d, id),
    delete: (id) => CM('DELETE', '/api/recipes')(null, id),
    rate: (id, r, v = '') => CM('POST', '/api/recipes')({ rating: r, review: v }, `${id}/rate`),
    like: (id) => CM('POST', '/api/recipes')(null, `${id}/like`),
    getPopular: (l = 10) => CM('GET', `/api/recipes?sortBy=averageRating&sortOrder=desc&limit=${l}`)(),
    getRecent: (l = 10) => CM('GET', `/api/recipes?sortBy=createdAt&sortOrder=desc&limit=${l}`)(),
    getByCategory: async (c, p = {}) => api.recipes.getAll({ category: c, ...p }),
    searchByIngredients: async (i) => {
      const p = Array.isArray(i) ? i.join(',') : i;
      return CM('GET', `/api/search/ingredients?ingredients=${encodeURIComponent(p)}`)();
    },
    getStats: () => CM('GET', '/api/recipes/stats')()
  },

  users: {
    saveRecipe: (id) => CM('POST', '/api/users/save-recipe')(null, id),
    removeSavedRecipe: (id) => CM('DELETE', '/api/users/save-recipe')(null, id),
    getSavedRecipes: () => CM('GET', '/api/users/saved-recipes')(),
    getUploadedRecipes: () => CM('GET', '/api/users/uploaded-recipes')(),
    updateProfile: (d) => CM('PUT', '/api/users/profile')(d),
    uploadProfileImage: (f) => {
      const d = new FormData();
      d.append('profileImage', f);
      return CM('POST', '/api/users/profile-image', { isFormData: true })(d);
    }
  },

  mealPlans: {
    get: (w) => CM('GET', '/api/meal-plans')(null, w instanceof Date ? w.toISOString().split('T')[0] : w),
    save: (d) => CM('POST', '/api/meal-plans')(d),
    update: (w, d) => api.mealPlans.save({ ...d, weekStartDate: w }),
    delete: (w) => CM('DELETE', '/api/meal-plans')(null, w instanceof Date ? w.toISOString().split('T')[0] : w),
    generateAuto: (w, p = {}) => CM('POST', '/api/meal-plans/generate')({ weekDate: w, preferences: p })
  },

  upload: {
    image: (f, t = 'recipe') => {
      const d = new FormData();
      d.append('image', f);
      d.append('type', t);
      return CM('POST', '/api/upload/image', { isFormData: true })(d);
    },
    multiple: (f, t = 'recipe') => {
      const d = new FormData();
      Array.from(f).forEach(file => d.append('images', file));
      d.append('type', t);
      return CM('POST', '/api/upload/images', { isFormData: true })(d);
    }
  },

  health: () => CM('GET', '/health', { requiresAuth: false })(),
  
  request: async (e, o = {}) => {
    const { method: m = 'GET', data: d, headers: h = {}, requireAuth: r = true } = o;
    const reqH = { ...(r ? H(T()) : { 'Content-Type': 'application/json' }), ...h };
    const conf = { method: m, headers: reqH };

    if (d && /^(POST|PUT|PATCH)$/.test(m)) {
      conf.body = d instanceof FormData ? d : JSON.stringify(d);
      if (d instanceof FormData) delete conf.headers['Content-Type'];
    }
    return AC(`${URL}${e}`, conf);
  }
};

const of = window.fetch;
window.fetch = function(...a) {
  return of.apply(this, a).then(r => {
    if (r.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return r;
  }).catch(e => {
    console.error('Global fetch error:', e);
    throw e;
  });
};

export default api;
export const { auth: authAPI, recipes: recipesAPI, users: usersAPI, mealPlans: mealPlansAPI, upload: uploadAPI } = api;