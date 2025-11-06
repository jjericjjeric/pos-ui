import { useState, useEffect } from 'react';
import * as api from '../services/api';
import { InventoryContext } from './InventoryContextObject';

export const InventoryProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

  // Auto-login on mount if token exists, otherwise login with default credentials
  useEffect(() => {
    const initializeAuth = async () => {
      if (api.isAuthenticated()) {
        setIsAuthenticated(true);
        // Try to load products with existing token
        await loadProducts();
      } else {
        // Auto-login with default credentials
        try {
          await api.login('admin', 'admin123');
          setIsAuthenticated(true);
          await loadProducts();
        } catch (err) {
          console.error('Auto-login failed:', err);
          setError('Failed to authenticate. Please check API server.');
          setLoading(false);
        }
      }
    };

    initializeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        try {
          await api.login('admin', 'admin123');
          setIsAuthenticated(true);
          await refreshProducts();
        } catch (authErr) {
          setIsAuthenticated(false);
        }
      }
    }
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
      // Update stock for each item in the cart
      const updatePromises = cartItems.map(item =>
        api.updateProductStock(item.id, item.quantity)
      );
      
      await Promise.all(updatePromises);
      
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

  return (
    <InventoryContext.Provider
      value={{
        products,
        loading,
        error,
        isAuthenticated,
        refreshProducts,
        updateProductStock,
        updateInventoryAfterPurchase,
        addProduct,
        deleteProduct,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

