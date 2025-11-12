import { createContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import api from '../services/api';

export const StoreContext = createContext();

export const StoreProvider = ({ children }) => {
  const [currentStore, setCurrentStore] = useState(null);
  const [userStores, setUserStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load stores on mount
  useEffect(() => {
    const loadUserStores = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/stores');
        const stores = response.data.stores || [];
        setUserStores(stores);

        // Get current store from localStorage or use first store
        const savedStoreId = localStorage.getItem('currentStoreId');
        if (savedStoreId) {
          const savedStore = stores.find(s => s.id === parseInt(savedStoreId));
          setCurrentStore(savedStore || stores[0] || null);
        } else {
          setCurrentStore(stores[0] || null);
          if (stores[0]) {
            localStorage.setItem('currentStoreId', stores[0].id.toString());
          }
        }
      } catch (err) {
        console.error('Failed to load stores:', err);
        setError('Failed to load stores');
      } finally {
        setLoading(false);
      }
    };

    loadUserStores();
  }, []);

  // Switch to a different store
  const switchStore = async (storeId) => {
    try {
      setLoading(true);
      
      // Call backend to switch store and get new token
      const response = await api.post(`/stores/${storeId}/switch`);
      
      if (response.data.token) {
        // Update token in localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('currentStoreId', storeId.toString());
        
        // Update current store
        const store = userStores.find(s => s.id === storeId);
        setCurrentStore(store);
        
        // Reload the page to refresh all data with new store context
        window.location.reload();
      }
    } catch (err) {
      console.error('Failed to switch store:', err);
      setError('Failed to switch store');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Create a new store
  const createStore = async (storeData) => {
    try {
      setLoading(true);
      const response = await api.post('/stores', storeData);
      const newStore = response.data.store;
      
      // Add to user stores
      setUserStores([...userStores, newStore]);
      
      // Optionally switch to new store
      if (userStores.length === 0) {
        setCurrentStore(newStore);
        localStorage.setItem('currentStoreId', newStore.id.toString());
      }
      
      return newStore;
    } catch (err) {
      console.error('Failed to create store:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Refresh stores list
  const refreshStores = async () => {
    try {
      const response = await api.get('/stores');
      const stores = response.data.stores || [];
      setUserStores(stores);
      
      // Update current store if it exists in the new list
      if (currentStore) {
        const updatedCurrentStore = stores.find(s => s.id === currentStore.id);
        setCurrentStore(updatedCurrentStore || stores[0] || null);
      }
    } catch (err) {
      console.error('Failed to refresh stores:', err);
      throw err;
    }
  };

  const value = {
    currentStore,
    userStores,
    loading,
    error,
    switchStore,
    createStore,
    refreshStores,
    setCurrentStore,
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
};

StoreProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
