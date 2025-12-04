const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// Storage keys
const TOKEN_KEY = 'jwt_token';
const USER_KEY = 'jwt_user';

// Base64url decode helper
const base64UrlDecode = (str) => {
  try {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    const decoded = atob(padded);
    // decode UTF-8
    try {
      return decodeURIComponent(
        decoded
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
    } catch {
      return decoded;
    }
  } catch {
    return '{}';
  }
};

// Read auth from either localStorage (remembered) or sessionStorage (this session only)
const getStored = (key) => {
  const local = localStorage.getItem(key);
  if (local) return local;
  return sessionStorage.getItem(key);
};

export const getToken = () => getStored(TOKEN_KEY);
export const getUser = () => {
  const raw = getStored(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
};

export const setAuth = ({ token, username, role }, remember) => {
  // Clear from both first to avoid mixed states
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);

  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(TOKEN_KEY, token);
  storage.setItem(USER_KEY, JSON.stringify({ username, role }));
};

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem('currentStoreId'); // Clear store context on logout
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
};

export const getTokenExpiry = () => {
  const token = getStored(TOKEN_KEY);
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    if (!payload.exp) return null;
    // exp is seconds since epoch
    return payload.exp * 1000;
  } catch {
    return null;
  }
};

export const isTokenExpired = () => {
  const exp = getTokenExpiry();
  if (!exp) return false;
  return Date.now() >= exp;
};

const getAuthHeaders = () => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

/**
 * Normalize product data to handle both old (image as string) and new (image as object) formats
 */
const normalizeProduct = (product) => {
  if (!product) return product;
  
  // If image is an object with image_data, extract it
  if (product.image && typeof product.image === 'object' && product.image.image_data) {
    return {
      ...product,
      image: product.image.image_data
    };
  }
  
  // If image is null or undefined, set to empty string
  if (!product.image) {
    return {
      ...product,
      image: ''
    };
  }
  
  // Otherwise return as-is (image is already a string with proper data URI)
  return product;
};

/**
 * Normalize an array of products
 */
const normalizeProducts = (products) => {
  if (!Array.isArray(products)) return products;
  return products.map(normalizeProduct);
};

/**
 * Login and get JWT token
 */
export const login = async (username, password, remember = true) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    if (!response.ok) {
      throw new Error('Invalid username or password');
    }
    const data = await response.json();
    // Store auth based on remember flag
    setAuth({ token: data.token, username: data.username, role: data.role }, remember);
    return data;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

/**
 * Guest login - creates a guest user with a temporary session
 */
export const loginAsGuest = async (storeName = 'My Store') => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/guest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ store_name: storeName }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to create guest session');
    }
    const data = await response.json();
    // Store auth in sessionStorage only (guests shouldn't be remembered)
    setAuth({ token: data.token, username: 'Guest', role: 'GUEST' }, false);
    return data;
  } catch (error) {
    console.error('Error logging in as guest:', error);
    throw error;
  }
};

/**
 * Send OTP to mobile number
 */
export const sendOTP = async (mobileNumber) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mobile_number: mobileNumber }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to send OTP');
    }
    return await response.json();
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw error;
  }
};

/**
 * Verify OTP
 */
export const verifyOTP = async (mobileNumber, otp) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        mobile_number: mobileNumber,
        otp: otp
      }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'OTP verification failed');
    }
    return await response.json();
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw error;
  }
};

/**
 * Register a new user with mobile number and PIN
 */
export const register = async (mobileNumber, pin) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        username: mobileNumber,
        password: pin,
        role: 'USER'
      }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Registration failed');
    }
    return await response.json();
  } catch (error) {
    console.error('Error registering:', error);
    throw error;
  }
};

/**
 * Logout (clear token)
 */
export const logout = () => {
  clearAuth();
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;
  if (isTokenExpired()) {
    clearAuth();
    return false;
  }
  return true;
};

/**
 * Fetch all products from the API
 */
export const fetchProducts = async () => {
  try {
    const products = await api.get('/products');
    return normalizeProducts(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

/**
 * Create a new product
 */
export const createProduct = async (product) => {
  try {
    const newProduct = await api.post('/products', product);
    return normalizeProduct(newProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

/**
 * Update product stock after purchase
 */
export const updateProductStock = async (productId, quantitySold) => {
  try {
    const updatedProduct = await api.patch(`/products/${productId}/stock`, { quantitySold });
    return normalizeProduct(updatedProduct);
  } catch (error) {
    console.error('Error updating product stock:', error);
    throw error;
  }
};

/**
 * Batch update stock for multiple products (single API call)
 * @param {Array<{productId: number, quantitySold: number}>} items - Array of items to update
 * @returns {Promise<{updatedProducts: Array, errors: Array<string>}>}
 */
export const batchUpdateProductStock = async (items) => {
  try {
    const result = await api.post('/products/stock/batch', { items });
    return {
      ...result,
      updatedProducts: normalizeProducts(result.updatedProducts || [])
    };
  } catch (error) {
    console.error('Error batch updating product stock:', error);
    throw error;
  }
};

/**
 * Update a product
 */
export const updateProduct = async (productId, productData) => {
  try {
    const updatedProduct = await api.put(`/products/${productId}`, productData);
    return normalizeProduct(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

/**
 * Delete a product
 */
export const deleteProduct = async (productId) => {
  try {
    await api.delete(`/products/${productId}`);
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// ============ STORE MANAGEMENT ============

/**
 * Get all stores for the current user
 */
export const getUserStores = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/stores`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      if (response.status === 401) {
        logout();
        throw new Error('Authentication required. Please login again.');
      }
      throw new Error(`Failed to fetch stores: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching stores:', error);
    throw error;
  }
};

/**
 * Create a new store
 */
export const createStore = async (storeData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/stores`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(storeData),
    });
    if (!response.ok) {
      if (response.status === 401) {
        logout();
        throw new Error('Authentication required. Please login again.');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to create store: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating store:', error);
    throw error;
  }
};

/**
 * Switch to a different store
 */
export const switchStore = async (storeId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/stores/${storeId}/switch`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      if (response.status === 401) {
        logout();
        throw new Error('Authentication required. Please login again.');
      }
      throw new Error(`Failed to switch store: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error switching store:', error);
    throw error;
  }
};

// Helper to add store_id to query params if available
export const addStoreIdToUrl = (url, storeId) => {
  if (!storeId) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}store_id=${storeId}`;
};

const api = {
  get: async (url, options = {}) => {
    const storeId = localStorage.getItem('currentStoreId');
    const fullUrl = storeId ? addStoreIdToUrl(`${API_BASE_URL}${url}`, storeId) : `${API_BASE_URL}${url}`;
    
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        logout();
        throw new Error('Authentication required. Please login again.');
      }
      throw new Error(`Request failed: ${response.statusText}`);
    }
    
    return response.json();
  },
  
  post: async (url, data = {}, options = {}) => {
    const storeId = localStorage.getItem('currentStoreId');
    const fullUrl = storeId ? addStoreIdToUrl(`${API_BASE_URL}${url}`, storeId) : `${API_BASE_URL}${url}`;
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        logout();
        throw new Error('Authentication required. Please login again.');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed: ${response.statusText}`);
    }
    
    return response.json();
  },
  
  put: async (url, data = {}, options = {}) => {
    const storeId = localStorage.getItem('currentStoreId');
    const fullUrl = storeId ? addStoreIdToUrl(`${API_BASE_URL}${url}`, storeId) : `${API_BASE_URL}${url}`;
    
    const response = await fetch(fullUrl, {
      method: 'PUT',
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        logout();
        throw new Error('Authentication required. Please login again.');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed: ${response.statusText}`);
    }
    
    return response.json();
  },
  
  delete: async (url, options = {}) => {
    const storeId = localStorage.getItem('currentStoreId');
    const fullUrl = storeId ? addStoreIdToUrl(`${API_BASE_URL}${url}`, storeId) : `${API_BASE_URL}${url}`;
    
    const response = await fetch(fullUrl, {
      method: 'DELETE',
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        logout();
        throw new Error('Authentication required. Please login again.');
      }
      throw new Error(`Request failed: ${response.statusText}`);
    }
    
    // DELETE may return no content
    if (response.status === 204) return null;
    return response.json();
  },
  
  patch: async (url, data = {}, options = {}) => {
    const storeId = localStorage.getItem('currentStoreId');
    const fullUrl = storeId ? addStoreIdToUrl(`${API_BASE_URL}${url}`, storeId) : `${API_BASE_URL}${url}`;
    
    const response = await fetch(fullUrl, {
      method: 'PATCH',
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        logout();
        throw new Error('Authentication required. Please login again.');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed: ${response.statusText}`);
    }
    
    return response.json();
  },
};

export default api;






