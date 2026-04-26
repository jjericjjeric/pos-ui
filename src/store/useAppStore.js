import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api, * as apiExports from '../services/api';

// Store a reference to any ongoing loadProducts call to prevent race conditions
let loadProductsAbortController = null;

// Simple in-memory cache for products by store
const productCache = new Map();

const useAppStore = create(
  persist(
    (set, get) => ({
      // ============ AUTH STATE ============
      isAuthenticated: false,
      user: null,
      token: null,

      // ============ STORE STATE ============
      currentStore: null,
      userStores: [],
      storesLoading: false,
      storeSwitching: false, // Track if we're currently switching stores

      // ============ PRODUCTS STATE ============
      products: [],
      productsLoading: false,
      productsError: null,

      // ============ IMPORT STATE ============
      importProgress: 0,
      importLoading: false,
      importErrors: [],

      // ============ CART STATE ============
      cart: [],

      // ============ APP SETTINGS STATE ============
      appSettings: {
        cacheDuration: 30, // Default: 30 minutes
        lowStockThreshold: 10, // Default: 10 units
      },

      // ============ ANALYTICS STATE ============
      analyticsData: null,
      analyticsLoading: false,
      analyticsError: null,
      profitData: null,
      profitLoading: false,
      profitError: null,

      // ============ AUTH ACTIONS ============
      login: async (username, password, remember = true) => {
        try {
          const data = await apiExports.login(username, password, remember);
          
          set({
            isAuthenticated: true,
            user: { username: data.username, role: data.role },
            token: data.token,
          });

          // Load user's stores after login
          await get().loadUserStores();

          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },

      loginAsGuest: async (storeName = 'My Store') => {
        try {
          const data = await apiExports.loginAsGuest(storeName);
          
          set({
            isAuthenticated: true,
            user: { username: 'Guest', role: 'GUEST' },
            token: data.token,
          });

          // Load user's stores after guest login
          await get().loadUserStores();

          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },

      upgradeGuestAccount: async (mobileNumber, otp, pin) => {
        try {
          const data = await apiExports.upgradeGuestAccount(mobileNumber, otp, pin);
          
          set({
            isAuthenticated: true,
            user: { username: data.user.username, role: data.user.role },
            token: data.token,
          });

          // Reload user's stores with updated user info
          await get().loadUserStores();

          return { success: true, data };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },

      sendOTP: async (mobileNumber) => {
        try {
          const data = await apiExports.sendOTP(mobileNumber);
          return { success: true, data };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },

      verifyOTP: async (mobileNumber, otp) => {
        try {
          const data = await apiExports.verifyOTP(mobileNumber, otp);
          return { success: true, data };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },

      logout: () => {
        apiExports.logout();
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          currentStore: null,
          userStores: [],
          products: [],
          cart: [],
        });
      },

      // ============ STORE ACTIONS ============
      loadUserStores: async () => {
        try {
          set({ storesLoading: true });
          const stores = await apiExports.getUserStores();
          
          // Get saved store or use first store
          const savedStoreId = localStorage.getItem('currentStoreId');
          let currentStore = null;
          
          if (savedStoreId) {
            currentStore = stores.find(s => s.id === parseInt(savedStoreId));
          }
          
          if (!currentStore && stores.length > 0) {
            currentStore = stores[0];
            localStorage.setItem('currentStoreId', stores[0].id.toString());
          }

          set({
            userStores: stores,
            currentStore,
            storesLoading: false,
          });

          // Load products for current store
          if (currentStore) {
            await get().loadProducts();
          }
        } catch (error) {
          console.error('Failed to load stores:', error);
          set({ storesLoading: false });
        }
      },

      switchStore: async (storeId) => {
        // Prevent multiple simultaneous store switches
        if (get().storeSwitching) {
          console.log('Store switch already in progress, ignoring...');
          return;
        }

        try {
          set({ storeSwitching: true });

          // Cancel any ongoing product load
          if (loadProductsAbortController) {
            loadProductsAbortController.abort();
            loadProductsAbortController = null;
          }

          const store = get().userStores.find(s => s.id === storeId);
          
          // OPTIMISTIC UPDATE: Update UI immediately
          localStorage.setItem('currentStoreId', storeId.toString());
          
          set({ 
            currentStore: store,
            cart: [], // Clear cart immediately when switching stores
            products: [], // Clear products to show fresh state
            productsError: null
          });

          // Load products immediately (no need to wait for backend switch)
          const productsPromise = get().loadProducts();

          // Update JWT token in background (non-blocking)
          apiExports.switchStore(storeId)
            .then(response => {
              if (response.token) {
                const storage = localStorage.getItem('jwt_token') ? localStorage : sessionStorage;
                storage.setItem('jwt_token', response.token);
              }
            })
            .catch(error => {
              console.error('Failed to update token during store switch:', error);
              // Don't throw - token update failure shouldn't break the UX
            });

          // Wait for products to load
          await productsPromise;
          
          set({ storeSwitching: false });
        } catch (error) {
          console.error('Failed to switch store:', error);
          set({ storeSwitching: false });
          throw error;
        }
      },

      updateStore: async (storeId, storeData) => {
        try {
          const response = await api.put(`/stores/${storeId}`, storeData);
          const updatedStore = response.store;

          // Update in userStores array
          set((state) => ({
            userStores: state.userStores.map((s) =>
              s.id === storeId ? { ...s, ...updatedStore } : s
            ),
          }));

          // Update currentStore if it's the one being edited
          const currentStore = get().currentStore;
          if (currentStore && currentStore.id === storeId) {
            set({ currentStore: { ...currentStore, ...updatedStore } });
          }

          return updatedStore;
        } catch (error) {
          console.error('Failed to update store:', error);
          throw error;
        }
      },

      createStore: async (storeData) => {
        try {
          const response = await api.post('/stores', storeData);
          const newStore = response.store;

          // Add the new store with default role 'owner' to avoid reloading all stores
          const storeWithRole = { ...newStore, role: 'owner' };
          set((state) => ({
            userStores: [...state.userStores, storeWithRole],
          }));

          return newStore;
        } catch (error) {
          console.error('Failed to create store:', error);
          throw error;
        }
      },

      // ============ PRODUCTS ACTIONS ============
      loadProducts: async (forceRefresh = false) => {
        const currentStore = get().currentStore;
        if (!currentStore) {
          console.log('No current store, skipping product load');
          return;
        }

        // Check cache first (unless force refresh)
        if (!forceRefresh) {
          const cached = productCache.get(currentStore.id);
          const cacheDuration = get().appSettings.cacheDuration * 60 * 1000; // Convert minutes to milliseconds
          
          if (cached && (Date.now() - cached.timestamp < cacheDuration)) {
            console.log(`Using cached products for store ${currentStore.id} (cache valid for ${get().appSettings.cacheDuration} min)`);
            set({ products: cached.data, productsLoading: false });
            return;
          }
        }

        // Cancel any previous ongoing request
        if (loadProductsAbortController) {
          loadProductsAbortController.abort();
        }

        // Create new abort controller for this request
        loadProductsAbortController = new AbortController();
        const currentController = loadProductsAbortController;

        try {
          set({ productsLoading: true, productsError: null });
          const products = await apiExports.fetchProducts();

          // Only update if this request wasn't aborted
          if (currentController && !currentController.signal.aborted) {
            // Cache the products
            productCache.set(currentStore.id, {
              data: products,
              timestamp: Date.now(),
            });

            set({ products, productsLoading: false, productsError: null });
            return products;
          } else {
            // If aborted, ensure loading flag is cleared
            set({ productsLoading: false });
            return;
          }
        } catch (error) {
          // Ignore abort errors but clear loading state
          if (error && error.name === 'AbortError') {
            console.log('Product load was cancelled');
            set({ productsLoading: false });
            return;
          }

          console.error('Failed to load products:', error);
          if (currentController && !currentController.signal.aborted) {
            set({ productsError: error.message || String(error), productsLoading: false, products: [] });
          } else {
            set({ productsLoading: false });
          }

          // Re-throw so callers/tests can observe the failure if they await loadProducts
          throw error;
        } finally {
          if (loadProductsAbortController === currentController) {
            loadProductsAbortController = null;
          }
        }
      },

      refreshProducts: async () => {
        await get().loadProducts(true); // Force refresh bypasses cache
      },

      addProduct: async (productData) => {
        try {
          const newProduct = await apiExports.createProduct(productData);
          
          // Invalidate cache for current store
          const currentStore = get().currentStore;
          if (currentStore) {
            productCache.delete(currentStore.id);
          }
          
          set((state) => ({
            products: [...state.products, newProduct],
          }));
          return newProduct;
        } catch (error) {
          console.error('Failed to add product:', error);
          throw error;
        }
      },

      updateProduct: async (productId, productData) => {
        try {
          const updatedProduct = await apiExports.updateProduct(productId, productData);
          
          // Invalidate cache for current store
          const currentStore = get().currentStore;
          if (currentStore) {
            productCache.delete(currentStore.id);
          }
          
          set((state) => ({
            products: state.products.map((p) =>
              p.id === productId ? updatedProduct : p
            ),
          }));
          return updatedProduct;
        } catch (error) {
          console.error('Failed to update product:', error);
          throw error;
        }
      },

      deleteProduct: async (productId) => {
        try {
          const result = await apiExports.deleteProduct(productId);
          
          // Invalidate cache for current store
          const currentStore = get().currentStore;
          if (currentStore) {
            productCache.delete(currentStore.id);
          }
          
          set((state) => ({
            products: state.products.filter((p) => p.id !== productId),
          }));

          // Return result to indicate if product was archived or deleted
          return result;
        } catch (error) {
          console.error('Failed to delete product:', error);
          throw error;
        }
      },

      bulkImportProducts: async (products) => {
        set({ importLoading: true, importErrors: [], importProgress: 0 });
        
        try {
          const response = await api.post('/products/bulk-import', {
            products: products
          });
          
          const data = response.data || response;
          const importedCount = data.imported_count || 0;
          const failedCount = data.failed_count || 0;
          const errors = data.errors || [];
          
          set({ 
            importLoading: false, 
            importProgress: 100,
            importErrors: errors 
          });
          
          // Invalidate cache and reload products after import (even partial success)
          const currentStore = get().currentStore;
          if (currentStore && importedCount > 0) {
            productCache.delete(currentStore.id);
            await get().loadProducts();
          }
          
          return { 
            success: failedCount === 0, // Only true if NO failures
            imported: importedCount,
            failed: failedCount,
            total: products.length,
            errors: errors,
            hasPartialSuccess: importedCount > 0 && failedCount > 0
          };
        } catch (error) {
          // Handle complete failure (network error, 4xx/5xx)
          const errors = error.response?.data?.errors || [];
          set({ importLoading: false, importErrors: errors });
          return { 
            success: false, 
            imported: 0,
            failed: products.length,
            total: products.length,
            errors: errors.length > 0 ? errors : [{ 
              row_number: 0, 
              field: 'system', 
              message: error.message || 'Import failed' 
            }],
            hasPartialSuccess: false
          };
        }
      },

      // ============ CART ACTIONS ============
      addToCart: (product) => {
        let result = { success: true };
        
        set((state) => {
          const existingItem = state.cart.find((item) => item.id === product.id);
          
          if (existingItem) {
            // Check stock before increasing quantity
            if (existingItem.quantity >= product.stock) {
              result = { success: false, message: `Cannot exceed stock quantity (${product.stock})` };
              return {
                cart: state.cart,
              };
            }
            return {
              cart: state.cart.map((item) =>
                item.id === product.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              ),
            };
          }
          
          return {
            cart: [...state.cart, { ...product, quantity: 1 }],
          };
        });
        
        return result;
      },

      removeFromCart: (productId) => {
        set((state) => ({
          cart: state.cart.filter((item) => item.id !== productId),
        }));
      },

      updateCartQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }

        set((state) => ({
          cart: state.cart.map((item) =>
            item.id === productId ? { ...item, quantity } : item
          ),
        }));
      },

      clearCart: () => {
        set({ cart: [] });
      },

      // ============ TRANSACTION ACTIONS ============
      transactions: [],
      transactionsLoading: false,
      transactionsError: null,
      transactionStats: null,
      transactionPagination: {
        page: 1,
        limit: 20,
        total: 0,
        total_pages: 0,
      },

      createTransaction: async (transactionData) => {
        try {
          const result = await apiExports.createTransaction(transactionData);
          return result;
        } catch (error) {
          console.error('Failed to create transaction:', error);
          throw error;
        }
      },

      loadTransactions: async (filters = {}) => {
        set({ transactionsLoading: true, transactionsError: null });
        try {
          const data = await apiExports.getTransactions(filters);
          set({
            transactions: data.transactions || [],
            transactionPagination: {
              page: data.page || 1,
              limit: data.limit || 20,
              total: data.total || 0,
              total_pages: data.total_pages || 0,
            },
            transactionsLoading: false,
          });
        } catch (error) {
          set({
            transactionsError: error.message,
            transactionsLoading: false,
          });
          throw error;
        }
      },

      loadTransactionStats: async (dateRange = {}) => {
        try {
          const data = await apiExports.getTransactionStats(dateRange);
          set({ 
            transactionStats: data.stats,
            analyticsData: {
              stats: data.stats,
              dailyRevenue: data.daily_revenue || [],
              topProducts: data.top_products || [],
              dateRange: {
                start: data.start_date,
                end: data.end_date,
              },
            },
            analyticsLoading: false,
          });
          return data;
        } catch (error) {
          console.error('Failed to load transaction stats:', error);
          set({ analyticsLoading: false, analyticsError: error.message });
          throw error;
        }
      },

      loadProfitAnalytics: async (dateRange = {}) => {
        try {
          set({ profitLoading: true, profitError: null });
          console.log('[Profit Analytics] Calling API with date range:', dateRange);
          const data = await apiExports.getProfitAnalytics(dateRange);
          console.log('[Profit Analytics] API response:', data);
          set({ 
            profitData: {
              stats: data.profit_stats || {},
              dailyProfit: data.daily_profit || [],
              profitPerProduct: data.profit_per_product || [],
            },
            profitLoading: false,
          });
          return data;
        } catch (error) {
          console.error('[Profit Analytics] Failed to load profit analytics:', error);
          console.error('[Profit Analytics] Error details:', error.message);
          // Set empty data instead of error to avoid breaking UI
          set({ 
            profitData: {
              stats: {},
              dailyProfit: [],
              profitPerProduct: [],
            },
            profitLoading: false, 
            profitError: error.message 
          });
          // Don't throw - just log the error
        }
      },

      cancelTransaction: async (id) => {
        try {
          const result = await apiExports.cancelTransaction(id);
          // Reload transactions to reflect the cancellation
          await get().loadTransactions();
          return result;
        } catch (error) {
          console.error('Failed to cancel transaction:', error);
          throw error;
        }
      },

      // ============ APP SETTINGS ACTIONS ============
      updateAppSettings: (newSettings) => {
        set((state) => ({
          appSettings: { ...state.appSettings, ...newSettings },
        }));
      },

      // ============ INITIALIZATION ============
      initialize: async () => {
        // Check if already authenticated
        if (apiExports.isAuthenticated()) {
          const user = apiExports.getUser();
          const token = apiExports.getToken();
          
          set({
            isAuthenticated: true,
            user,
            token,
          });

          // Load stores and products
          await get().loadUserStores();
        }
      },
    }),
    {
      name: 'pos-app-storage',
      partialize: (state) => ({
        // Persist cart and app settings
        cart: state.cart,
        appSettings: state.appSettings,
      }),
    }
  )
);

export default useAppStore;
