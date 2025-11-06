const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// Token management
const getToken = () => {
  return localStorage.getItem('jwt_token');
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
export const login = async (username, password) => {
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
    // Store token
    localStorage.setItem('jwt_token', data.token);
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
  localStorage.removeItem('jwt_token');
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!getToken();
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



