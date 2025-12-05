import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api, * as apiExports from '../services/api';

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

      // ============ PRODUCTS STATE ============
      products: [],
      productsLoading: false,
      productsError: null,

      // ============ CART STATE ============
      cart: [],

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
        try {
          const response = await apiExports.switchStore(storeId);
          
          if (response.token) {
            // Update token
            const storage = localStorage.getItem('jwt_token') ? localStorage : sessionStorage;
            storage.setItem('jwt_token', response.token);
          }

          const store = get().userStores.find(s => s.id === storeId);
          localStorage.setItem('currentStoreId', storeId.toString());
          
          set({ currentStore: store });

          // Reload products for new store
          await get().loadProducts();
          
          // Clear cart when switching stores
          set({ cart: [] });
        } catch (error) {
          console.error('Failed to switch store:', error);
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

      // ============ PRODUCTS ACTIONS ============
      loadProducts: async () => {
        const currentStore = get().currentStore;
        if (!currentStore) {
          console.log('No current store, skipping product load');
          return;
        }

        try {
          set({ productsLoading: true, productsError: null });
          const products = await apiExports.fetchProducts();
          set({ products, productsLoading: false });
        } catch (error) {
          console.error('Failed to load products:', error);
          set({
            productsError: error.message,
            productsLoading: false,
            products: [],
          });
        }
      },

      refreshProducts: async () => {
        await get().loadProducts();
      },

      addProduct: async (productData) => {
        try {
          const newProduct = await apiExports.createProduct(productData);
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
          await apiExports.deleteProduct(productId);
          set((state) => ({
            products: state.products.filter((p) => p.id !== productId),
          }));
        } catch (error) {
          console.error('Failed to delete product:', error);
          throw error;
        }
      },

      // ============ CART ACTIONS ============
      addToCart: (product) => {
        set((state) => {
          const existingItem = state.cart.find((item) => item.id === product.id);
          
          if (existingItem) {
            // Check stock before increasing quantity
            if (existingItem.quantity >= product.stock) {
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
        // Only persist cart, currentStore will be handled by localStorage
        cart: state.cart,
      }),
    }
  )
);

export default useAppStore;
