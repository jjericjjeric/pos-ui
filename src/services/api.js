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
    const response = await fetch(`${API_BASE_URL}/products`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid, clear it
        logout();
        throw new Error('Authentication required. Please login again.');
      }
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }
    return await response.json();
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
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(product),
    });
    if (!response.ok) {
      if (response.status === 401) {
        logout();
        throw new Error('Authentication required. Please login again.');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to create product: ${response.statusText}`);
    }
    return await response.json();
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
    const response = await fetch(`${API_BASE_URL}/products/${productId}/stock`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ quantitySold }),
    });
    if (!response.ok) {
      if (response.status === 401) {
        logout();
        throw new Error('Authentication required. Please login again.');
      }
      throw new Error(`Failed to update product stock: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating product stock:', error);
    throw error;
  }
};

/**
 * Update a product
 */
export const updateProduct = async (productId, productData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(productData),
    });
    if (!response.ok) {
      if (response.status === 401) {
        logout();
        throw new Error('Authentication required. Please login again.');
      }
      throw new Error(`Failed to update product: ${response.statusText}`);
    }
    return await response.json();
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
    const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      if (response.status === 401) {
        logout();
        throw new Error('Authentication required. Please login again.');
      }
      throw new Error(`Failed to delete product: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};



