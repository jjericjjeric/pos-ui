import { useState, useEffect, useRef } from 'react';
import * as api from '../services/api';
import { InventoryContext } from './InventoryContextObject';

export const InventoryProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(api.isAuthenticated());
  const [user, setUser] = useState(api.getUser());
  const expiryTimerRef = useRef(null);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedProducts = await api.fetchProducts();
      setProducts(fetchedProducts);
    } catch (err) {
      console.error('Failed to load products:', err);
      setError(err.message);
      // Set empty array on error to prevent crashes
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // On mount, if token already exists, load products; otherwise stop loading
  useEffect(() => {
    const init = async () => {
      if (api.isAuthenticated()) {
        try {
          setUser(api.getUser());
          // Only load products if currentStoreId is set
          const currentStoreId = localStorage.getItem('currentStoreId');
          if (currentStoreId) {
            await loadProducts();
          } else {
            setLoading(false);
          }
        } catch (err) {
          console.error('Initial product load failed:', err);
        }
      } else {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch products when currentStoreId changes (store switching)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'currentStoreId' && e.newValue && api.isAuthenticated()) {
        console.log('Store changed, reloading products for store:', e.newValue);
        loadProducts();
      }
    };
    
    // Listen for storage changes from other tabs/windows
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Setup auto-logout timer based on token expiry
  useEffect(() => {
    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = null;
    }
    if (isAuthenticated) {
      const exp = api.getTokenExpiry();
      if (exp) {
        const ms = Math.max(exp - Date.now(), 0);
        expiryTimerRef.current = setTimeout(() => {
          logoutUser();
          alert('Session expired. Please log in again.');
        }, ms);
      }
    }
    return () => {
      if (expiryTimerRef.current) {
        clearTimeout(expiryTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const refreshProducts = async () => {
    try {
      setError(null);
      const fetchedProducts = await api.fetchProducts();
      setProducts(fetchedProducts);
    } catch (err) {
      console.error('Failed to refresh products:', err);
      setError(err.message);
      // If authentication error, try to re-authenticate
      if (err.message.includes('Authentication required')) {
        setIsAuthenticated(false);
      }
    }
  };

  const loginUser = async (username, password, remember = true) => {
    try {
      setLoading(true);
      const data = await api.login(username, password, remember);
      setIsAuthenticated(true);
      setUser({ username: data.username, role: data.role });
      
      // Handle store data if present in response
      if (data.store) {
        localStorage.setItem('currentStoreId', data.store.id.toString());
      }
      
      await loadProducts();
      return { success: true };
    } catch (err) {
      setIsAuthenticated(false);
      setError(err.message || 'Login failed');
      setLoading(false);
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const logoutUser = () => {
    api.logout();
    setIsAuthenticated(false);
    setProducts([]);
    setUser(null);
  };

  const updateProductStock = async (productId, quantitySold) => {
    try {
      // Update via API
      const updatedProduct = await api.updateProductStock(productId, quantitySold);
      
      // Update local state optimistically
      setProducts(prevProducts =>
        prevProducts.map(product =>
          product.id === productId ? updatedProduct : product
        )
      );
      
      return updatedProduct;
    } catch (error) {
      console.error('Error updating product stock:', error);
      // Refresh products to get latest state
      await refreshProducts();
      throw error;
    }
  };

  const updateInventoryAfterPurchase = async (cartItems) => {
    try {
      // Use batch update to reduce API calls
      const items = cartItems.map(item => ({
        productId: item.id,
        quantitySold: item.quantity
      }));
      
      const result = await api.batchUpdateProductStock(items);
      
      // Check if there were any errors in the batch update
      if (result.errors && result.errors.length > 0) {
        console.warn('Some items failed to update:', result.errors);
        // Still refresh to get latest state
        await refreshProducts();
        
        // Throw error with details about failed items
        const failedItems = result.errors.map(e => e.productId).join(', ');
        throw new Error(`Failed to update stock for products: ${failedItems}`);
      }
      
      // Refresh products to get latest state
      await refreshProducts();
    } catch (error) {
      console.error('Error updating inventory after purchase:', error);
      // Refresh products to get latest state even on error
      await refreshProducts();
      throw error;
    }
  };

  const addProduct = async (newProduct) => {
    try {
      const createdProduct = await api.createProduct(newProduct);
      
      // Update local state
      setProducts(prevProducts => [...prevProducts, createdProduct]);
      
      return createdProduct;
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  };

  const deleteProduct = async (productId) => {
    try {
      await api.deleteProduct(productId);
      
      // Update local state
      setProducts(prevProducts =>
        prevProducts.filter(product => product.id !== productId)
      );
    } catch (error) {
      console.error('Error deleting product:', error);
      // Refresh products to get latest state
      await refreshProducts();
      throw error;
    }
  };

  const updateProduct = async (productId, productData) => {
    try {
      // Optimistic update - update UI immediately
      setProducts(prevProducts =>
        prevProducts.map(product =>
          product.id === productId ? { ...product, ...productData } : product
        )
      );

      const updatedProduct = await api.updateProduct(productId, productData);
      
      // Update with actual server response
      setProducts(prevProducts =>
        prevProducts.map(product =>
          product.id === productId ? updatedProduct : product
        )
      );
      
      return updatedProduct;
    } catch (error) {
      console.error('Error updating product:', error);
      // Refresh products to get latest state on error
      await refreshProducts();
      throw error;
    }
  };

  return (
    <InventoryContext.Provider
      value={{
        products,
        loading,
        error,
        isAuthenticated,
        user,
        loginUser,
        logoutUser,
        refreshProducts,
        updateProductStock,
        updateInventoryAfterPurchase,
        addProduct,
        deleteProduct,
        updateProduct,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

