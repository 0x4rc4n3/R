// ============================================
// FILE: frontend/src/utils/api.js - FIXED VERSION
// ============================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Get token from localStorage
const getToken = () => localStorage.getItem('token');

// Create headers with optional auth token
const createHeaders = (includeAuth = true, isFormData = false) => {
  const headers = {};
  
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  
  if (includeAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
};

// Handle API response
const handleResponse = async (response) => {
  // Handle 401 - redirect to login
  if (response.status === 401) {
    localStorage.removeItem('token');
    if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
      window.location.href = '/login';
    }
    throw new Error('Unauthorized - Please login again');
  }

  // Parse response
  const contentType = response.headers.get('content-type');
  let data;
  
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  // Handle errors
  if (!response.ok) {
    const errorMessage = data?.message || data?.error || `HTTP Error: ${response.status}`;
    throw new Error(errorMessage);
  }

  return data;
};

// Generic request function
const request = async (endpoint, options = {}) => {
  const {
    method = 'GET',
    data = null,
    requiresAuth = true,
    isFormData = false
  } = options;

  const url = `${API_BASE_URL}${endpoint}`;
  const headers = createHeaders(requiresAuth, isFormData);

  const config = {
    method,
    headers
  };

  // Add body for POST/PUT/PATCH requests
  if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
    config.body = isFormData ? data : JSON.stringify(data);
  }

  try {
    console.log(`🔄 API Request: ${method} ${url}`);
    const response = await fetch(url, config);
    const result = await handleResponse(response);
    console.log(`✅ API Response: ${method} ${url}`, result);
    return result;
  } catch (error) {
    console.error(`❌ API Error: ${method} ${url}`, error);
    
    // Network error handling
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      throw new Error('Network error - Please check your connection and ensure the server is running at ' + API_BASE_URL);
    }
    
    throw error;
  }
};

// API methods
const api = {
  // Authentication
  auth: {
    login: (email, password) => {
      console.log('📧 Attempting login for:', email);
      return request('/api/auth/login', {
        method: 'POST',
        data: { email, password },
        requiresAuth: false
      });
    },

    register: (userData) => {
      console.log('📝 Attempting registration for:', userData.email);
      return request('/api/auth/register', {
        method: 'POST',
        data: userData,
        requiresAuth: false
      });
    },

    getProfile: () => {
      return request('/api/auth/profile', {
        method: 'GET',
        requiresAuth: true
      });
    },

    updateProfile: (userData) => {
      return request('/api/auth/profile', {
        method: 'PUT',
        data: userData,
        requiresAuth: true
      });
    }
  },

  // Recipes
  recipes: {
    getAll: (params = {}) => {
      const queryString = new URLSearchParams(
        Object.fromEntries(
          Object.entries(params).filter(([_, v]) => v != null && v !== '')
        )
      ).toString();
      
      const endpoint = `/api/recipes${queryString ? `?${queryString}` : ''}`;
      return request(endpoint, { method: 'GET', requiresAuth: true });
    },

    getById: (id) => {
      return request(`/api/recipes/${id}`, {
        method: 'GET',
        requiresAuth: true
      });
    },

    create: (recipeData) => {
      return request('/api/recipes', {
        method: 'POST',
        data: recipeData,
        isFormData: recipeData instanceof FormData,
        requiresAuth: true
      });
    },

    update: (id, recipeData) => {
      return request(`/api/recipes/${id}`, {
        method: 'PUT',
        data: recipeData,
        isFormData: recipeData instanceof FormData,
        requiresAuth: true
      });
    },

    delete: (id) => {
      return request(`/api/recipes/${id}`, {
        method: 'DELETE',
        requiresAuth: true
      });
    }
  },

  // Users
  users: {
    saveRecipe: (recipeId) => {
      return request(`/api/users/save-recipe/${recipeId}`, {
        method: 'POST',
        requiresAuth: true
      });
    },

    getSavedRecipes: () => {
      return request('/api/users/saved-recipes', {
        method: 'GET',
        requiresAuth: true
      });
    }
  },

  // Health check
  health: () => {
    return request('/health', {
      method: 'GET',
      requiresAuth: false
    });
  }
};

export default api;
export const { auth: authAPI, recipes: recipesAPI, users: usersAPI } = api;