import { useState, useEffect } from 'react';
import * as api from '../services/api';
import { InventoryContext } from './InventoryContextObject';

export const InventoryProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch products from API on component mount
  useEffect(() => {
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

    loadProducts();
  }, []);

  const refreshProducts = async () => {
    try {
      setError(null);
      const fetchedProducts = await api.fetchProducts();
      setProducts(fetchedProducts);
    } catch (err) {
      console.error('Failed to refresh products:', err);
      setError(err.message);
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

