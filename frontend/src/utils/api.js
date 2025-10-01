// frontend/src/utils/api.js - Complete API Utility Functions

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Helper function to get auth headers for file uploads (without Content-Type)
const getAuthHeadersForUpload = () => {
  const token = localStorage.getItem('token');
  return {
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `HTTP Error: ${response.status}`);
  }
  return response.json();
};

// Helper function to handle fetch errors
const handleFetchError = (error) => {
  console.error('API Error:', error);
  if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
    throw new Error('Network error. Please check your internet connection and ensure the server is running.');
  }
  throw error;
};

// API utility object
const api = {
  // Auth endpoints
  auth: {
    login: async (email, password) => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        return await handleResponse(response);
      } catch (error) {
        handleFetchError(error);
      }
    },

    register: async (userData) => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData),
        });
        return await handleResponse(response);
      } catch (error) {
        handleFetchError(error);
      }
    },

    getProfile: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
          headers: getAuthHeaders(),
        });
        return await handleResponse(response);
      } catch (error) {
        handleFetchError(error);
      }
    },

    updateProfile: async (userData) => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(userData),
        });
        return await handleResponse(response);
      } catch (error) {
        handleFetchError(error);
      }
    },

    changePassword: async (currentPassword, newPassword) => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ currentPassword, newPassword }),
        });
        return await handleResponse(response);
      } catch (error) {
        handleFetchError(error);
      }
    }
  },

  // Recipe endpoints
  recipes: {
    getAll: async (params = {}) => {
      try {
        // Filter out undefined values
        const filteredParams = Object.fromEntries(
          Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
        );
        
        const queryString = new URLSearchParams(filteredParams).toString();
        const url = `${API_BASE_URL}/api/recipes${queryString ? `?${queryString}` : ''}`;
        
        const response = await fetch(url, {
          headers: getAuthHeaders(),
        });
        return await handleResponse(response);
      } catch (error) {
        handleFetchError(error);
      }
    },

    getById: async (id) => {
      try {
        if (!id) throw new Error('Recipe ID is required');
        
        const response = await fetch(`${API_BASE_URL}/api/recipes/${id}`, {
          headers: getAuthHeaders(),
        });
        return await handleResponse(response);
      } catch (error) {
        handleFetchError(error);
      }
    },

    create: async (recipeData) => {
      try {
        // Handle both FormData and regular object
        const isFormData = recipeData instanceof FormData;
        
        const response = await fetch(`${API_BASE_URL}/api/recipes`, {
          method: 'POST',
          headers: isFormData ? getAuthHeadersForUpload() : getAuthHeaders(),
          body: isFormData ? recipeData : JSON.stringify(recipeData),
        });
        return await handleResponse(response);
      } catch (error) {
        handleFetchError(error);
      }
    },

    update: async (id, recipeData) => {
      try {
        if (!id) throw new Error('Recipe ID is required');
        
        const isFormData = recipeData instanceof FormData;
        
        const response = await fetch(`${API_BASE_URL}/api/recipes/${id}`, {
          method: 'PUT',
          headers: isFormData ? getAuthHeadersForUpload() : getAuthHeaders(),
          body: isFormData ? recipeData : JSON.stringify(recipeData),
        });
        return await handleResponse(response);
      } catch (error) {
        handleFetchError(error);
      }
    },

    delete: async (id) => {
      try {
        if (!id) throw new Error('Recipe ID is required');
        
        const response = await fetch(`${API_BASE_URL}/api/recipes/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
        return await handleResponse(response);
      } catch (error) {
        handleFetchError(error);
      }
    },

    rate: async (id, rating, review = '') => {
      try {
        if (!id) throw new Error('Recipe ID is required');
        if (!rating || rating < 1 || rating > 5) {
          throw new Error('Rating must be between 1 and 5');
        }
        
        const response = await fetch(`${API_BASE_URL}/api/recipes/${id}/rate`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ rating, review }),
        });
        return await handleResponse(response);
      } catch (error) {
        handleFetchError(error);
      }
    },

    like: async (id) => {
      try {
        if (!id) throw new Error('Recipe ID is required');
        
        const response = await fetch(`${API_BASE_URL}/api/recipes/${id}/like`, {
          method: 'POST',
          headers: getAuthHeaders(),
        });
        return await handleResponse(response);
      } catch (error) {
        handleFetchError(error);
      }
    },

    getPopular: async (limit = 10) => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/recipes?sortBy=averageRating&sortOrder=desc&limit=${limit}`, {
          headers: getAuthHeaders(),
        });
        return await handleResponse(response);
      } catch (error) {
        handleFetchError(error);
      }
    },

    getRecent: async (limit = 10) => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/recipes?sortBy=createdAt&sortOrder=desc&limit=${limit}`, {
          headers: getAuthHeaders(),
        });
        return await handleResponse(response);
      } catch (error) {
        handleFetchError(error);
      }
    },

    getByCategory: async (category, params = {}) => {
      try {
        const queryParams = { category, ...params };
        return await api.recipes.getAll(queryParams);
      } catch (error) {
        handleFetchError(error);
      }
    },

    searchByIngredients: async (ingredients) => {
      try {
        if (!ingredients) throw new Error('Ingredients are required');
        
        const ingredientsParam = Array.isArray(ingredients) ? ingredients.join(',') : ingredients;
        const response = await fetch(`${API_BASE_URL}/api/search/ingredients?ingredients=${encodeURIComponent(ingredientsParam)}`, {
          headers: getAuthHeaders(),
        });
        return await handleResponse(response);
      } catch (error) {
        handleFetchError(error);
      }
    },

    getStats: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/recipes/stats`, {
          headers: getAuthHeaders(),
        });
        return await handleResponse(response);
      } catch (error) {
        handleFetchError(error);
      }
    }
  },

  // User endpoints
  users: {
    saveRecipe: async (recipeId) => {
      try {
        if (!recipeId) throw new Error('Recipe ID is required');
        
        const response = await fetch(`${API_BASE_URL}/api/users/save-recipe/${recipeId}`, {
          method: 'POST',
          headers: getAuthHeaders(),
        });
        return await handleResponse(response);
      } catch (error) {
        handleFetchError(error);
      }
    },

    removeSavedRecipe: async (recipeId) => {
      try {
        if (!recipeId) throw new Error('Recipe ID is required');
        
        const response = await fetch(`${API_BASE_URL}/api/users/save-recipe/${recipeId}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
        return await handleResponse(response);
      } catch (error) {
        handleFetchError(error);
      }
    },

    getSavedRecipes: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/saved-recipes`, {
          headers: getAuthHeaders(),
        });
        return await handleResponse(response);
      } catch (error) {
        handleFetchError(error);
      }
    },

    getUploadedRecipes: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/uploaded-recipes`, {
          headers: getAuthHeaders(),
        });
        return await handleResponse(response);
      } catch (error) {
        handleFetchError(error);
      }
    },

    updateProfile: async (profileData) => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(profileData),
        });
        return await handleResponse(response);
      } catch (error) {
        handleFetchError(error);
      }
    },

    uploadProfileImage: async (imageFile) => {
      try {
        if (!imageFile) throw new Error('Image file is required');
        
        const formData = new FormData();
        formData.append('profileImage', imageFile);

        const response = await fetch(`${API_BASE_URL}/api/users/profile-image`, {
          method: 'POST',
          headers: getAuthHeadersForUpload(),
          body: formData,
        });
        return await handleResponse(response);
      } catch (error) {
        handleFetchError(error);
      }
    }
  },

  // Meal planner endpoints
  mealPlans: {
    get: async (weekDate) => {
      try {
        if (!weekDate) throw new Error('Week date is required');
        
        // Ensure weekDate is properly formatted
        const dateStr = weekDate instanceof Date ? weekDate.toISOString().split('T')[0] : weekDate;
        
        const response = await fetch(`${API_BASE_URL}/api/meal-plans/${dateStr}`, {
          headers: getAuthHeaders(),
        });
        return await handleResponse(response);
      } catch (error) {
        handleFetchError(error);
      }
    },

    save: async (mealPlanData) => {
      try {
        if (!mealPlanData) throw new Error('Meal plan data is required');
        if (!mealPlanData.weekStartDate) throw new Error('Week start date is required');
        if (!mealPlanData.meals) throw new Error('Meals data is required');
        
        const response = await fetch(`${API_BASE_URL}/api/meal-plans`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(mealPlanData),
        });
        return await handleResponse(response);
      } catch (error) {
        handleFetchError(error);
      }
    },

    update: async (weekDate, mealPlanData) => {
      try {
        if (!weekDate) throw new Error('Week date is required');
        if (!mealPlanData) throw new Error('Meal plan data is required');
        
        // For updates, we can use the same save endpoint as it handles both create and update
        return await api.mealPlans.save({ ...mealPlanData, weekStartDate: weekDate });
      } catch (error) {
        handleFetchError(error);
      }
    },

    delete: async (weekDate) => {
      try {
        if (!weekDate) throw new Error('Week date is required');
        
        const dateStr = weekDate instanceof Date ? weekDate.toISOString().split('T')[0] : weekDate;
        
        const response = await fetch(`${API_BASE_URL}/api/meal-plans/${dateStr}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
        return await handleResponse(response);
      } catch (error) {
        handleFetchError(error);
      }
    },

    generateAuto: async (weekDate, preferences = {}) => {
      try {
        if (!weekDate) throw new Error('Week date is required');
        
        const response = await fetch(`${API_BASE_URL}/api/meal-plans/generate`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ weekDate, preferences }),
        });
        return await handleResponse(response);
      } catch (error) {
        handleFetchError(error);
      }
    }
  },

  // File upload endpoints
  upload: {
    image: async (file, type = 'recipe') => {
      try {
        if (!file) throw new Error('File is required');
        
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
          throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
        }
        
        // Validate file size (10MB limit)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          throw new Error('File size too large. Maximum size is 10MB.');
        }
        
        const formData = new FormData();
        formData.append('image', file);
        formData.append('type', type);

        const response = await fetch(`${API_BASE_URL}/api/upload/image`, {
          method: 'POST',
          headers: getAuthHeadersForUpload(),
          body: formData,
        });
        return await handleResponse(response);
      } catch (error) {
        handleFetchError(error);
      }
    },

    multiple: async (files, type = 'recipe') => {
      try {
        if (!files || files.length === 0) throw new Error('Files are required');
        
        // Validate file count (max 5)
        if (files.length > 5) {
          throw new Error('Too many files. Maximum is 5 files.');
        }
        
        const formData = new FormData();
        Array.from(files).forEach((file, index) => {
          // Validate each file
          const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
          if (!allowedTypes.includes(file.type)) {
            throw new Error(`Invalid file type for ${file.name}. Only JPEG, PNG, GIF, and WebP images are allowed.`);
          }
          
          const maxSize = 10 * 1024 * 1024; // 10MB
          if (file.size > maxSize) {
            throw new Error(`File ${file.name} is too large. Maximum size is 10MB.`);
          }
          
          formData.append('images', file);
        });
        formData.append('type', type);

        const response = await fetch(`${API_BASE_URL}/api/upload/images`, {
          method: 'POST',
          headers: getAuthHeadersForUpload(),
          body: formData,
        });
        return await handleResponse(response);
      } catch (error) {
        handleFetchError(error);
      }
    }
  },

  // Health check endpoint
  health: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return await handleResponse(response);
    } catch (error) {
      handleFetchError(error);
    }
  },

  // Generic request method for custom endpoints
  request: async (endpoint, options = {}) => {
    try {
      const { method = 'GET', data, headers = {}, requireAuth = true } = options;
      
      const requestHeaders = {
        ...(requireAuth ? getAuthHeaders() : { 'Content-Type': 'application/json' }),
        ...headers,
      };

      const requestOptions = {
        method,
        headers: requestHeaders,
      };

      if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
        if (data instanceof FormData) {
          // Remove Content-Type header for FormData
          delete requestOptions.headers['Content-Type'];
          requestOptions.body = data;
        } else {
          requestOptions.body = JSON.stringify(data);
        }
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, requestOptions);
      return await handleResponse(response);
    } catch (error) {
      handleFetchError(error);
    }
  }
};

// Add request interceptors for common functionality
const originalFetch = window.fetch;
window.fetch = function(...args) {
  return originalFetch.apply(this, args)
    .then(response => {
      // Handle global responses (e.g., logout on 401)
      if (response.status === 401 && window.location.pathname !== '/login') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      return response;
    })
    .catch(error => {
      console.error('Global fetch error:', error);
      throw error;
    });
};

// Export API utility
export default api;

// Export individual modules for convenience
export const authAPI = api.auth;
export const recipesAPI = api.recipes;
export const usersAPI = api.users;
export const mealPlansAPI = api.mealPlans;
export const uploadAPI = api.upload;