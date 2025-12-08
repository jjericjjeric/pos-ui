import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import useAppStore from '../../store/useAppStore';
import * as api from '../../services/api';

// Mock the API
vi.mock('../../services/api', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  getUserStores: vi.fn(),
  switchStore: vi.fn(),
  fetchProducts: vi.fn(),
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
  isAuthenticated: vi.fn(),
  getUser: vi.fn(),
  getToken: vi.fn(),
}));

describe('useAppStore', () => {
  // Create a real localStorage implementation for tests
  const localStorageData = {};
  
  beforeEach(() => {
    // Reset store state before each test
    useAppStore.setState({
      isAuthenticated: false,
      user: null,
      token: null,
      currentStore: null,
      userStores: [],
      storesLoading: false,
      products: [],
      productsLoading: false,
      productsError: null,
      cart: [],
    });
    
    vi.clearAllMocks();
    
    // Setup localStorage with actual storage behavior
    Object.keys(localStorageData).forEach(key => delete localStorageData[key]);
    
    global.localStorage.getItem.mockImplementation((key) => localStorageData[key] || null);
    global.localStorage.setItem.mockImplementation((key, value) => {
      localStorageData[key] = value;
    });
    global.localStorage.removeItem.mockImplementation((key) => {
      delete localStorageData[key];
    });
    global.localStorage.clear.mockImplementation(() => {
      Object.keys(localStorageData).forEach(key => delete localStorageData[key]);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should handle successful login', async () => {
      const mockUser = { username: '09123456789', role: 'Owner' };
      const mockStores = [{ id: 1, name: 'Test Store' }];
      
      api.login.mockResolvedValue({
        token: 'test-token',
        username: mockUser.username,
        role: mockUser.role,
      });
      
      api.getUserStores.mockResolvedValue(mockStores);
      api.fetchProducts.mockResolvedValue([]);

      const result = await useAppStore.getState().login('09123456789', '1234', true);

      expect(result.success).toBe(true);
      expect(useAppStore.getState().isAuthenticated).toBe(true);
      expect(useAppStore.getState().user).toEqual(mockUser);
      expect(useAppStore.getState().userStores).toEqual(mockStores);
    });

    it('should handle failed login', async () => {
      api.login.mockRejectedValue(new Error('Invalid credentials'));

      const result = await useAppStore.getState().login('09123456789', 'wrong', true);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
      expect(useAppStore.getState().isAuthenticated).toBe(false);
    });

    it('should handle logout', () => {
      // Set up authenticated state
      useAppStore.setState({
        isAuthenticated: true,
        user: { username: '09123456789', role: 'Owner' },
        token: 'test-token',
        currentStore: { id: 1, name: 'Test Store' },
        products: [{ id: 1, name: 'Product 1' }],
        cart: [{ id: 1, quantity: 2 }],
      });

      useAppStore.getState().logout();

      expect(useAppStore.getState().isAuthenticated).toBe(false);
      expect(useAppStore.getState().user).toBeNull();
      expect(useAppStore.getState().currentStore).toBeNull();
      expect(useAppStore.getState().products).toEqual([]);
      expect(useAppStore.getState().cart).toEqual([]);
    });
  });

  describe('Store Management', () => {
    it('should load user stores and set current store', async () => {
      const mockStores = [
        { id: 1, name: 'Store A' },
        { id: 2, name: 'Store B' },
      ];

      api.getUserStores.mockResolvedValue(mockStores);
      api.fetchProducts.mockResolvedValue([]);

      await useAppStore.getState().loadUserStores();

      expect(useAppStore.getState().userStores).toEqual(mockStores);
      expect(useAppStore.getState().currentStore).toEqual(mockStores[0]);
      expect(localStorage.getItem('currentStoreId')).toBe('1');
    });

    it('should use saved store from localStorage', async () => {
      const mockStores = [
        { id: 1, name: 'Store A' },
        { id: 2, name: 'Store B' },
      ];

      localStorage.setItem('currentStoreId', '2');
      api.getUserStores.mockResolvedValue(mockStores);
      api.fetchProducts.mockResolvedValue([]);

      await useAppStore.getState().loadUserStores();

      expect(useAppStore.getState().currentStore).toEqual(mockStores[1]);
    });

    it('should switch stores', async () => {
      const mockStores = [
        { id: 1, name: 'Store A' },
        { id: 2, name: 'Store B' },
      ];

      useAppStore.setState({
        userStores: mockStores,
        currentStore: mockStores[0],
        cart: [{ id: 1, quantity: 2 }],
      });

      localStorage.setItem('jwt_token', 'old-token');
      api.switchStore.mockResolvedValue({ token: 'new-token' });
      api.fetchProducts.mockResolvedValue([]);

      await useAppStore.getState().switchStore(2);

      expect(useAppStore.getState().currentStore).toEqual(mockStores[1]);
      expect(localStorage.getItem('currentStoreId')).toBe('2');
      expect(useAppStore.getState().cart).toEqual([]);
    });
  });

  describe('Products', () => {
    it('should load products when current store is set', async () => {
      const mockProducts = [
        { id: 1, name: 'Product 1', price: 10 },
        { id: 2, name: 'Product 2', price: 20 },
      ];

      useAppStore.setState({ currentStore: { id: 1, name: 'Test Store' } });
      api.fetchProducts.mockResolvedValue(mockProducts);

      await useAppStore.getState().loadProducts(true); // Force refresh to bypass cache

      expect(useAppStore.getState().products).toEqual(mockProducts);
      expect(useAppStore.getState().productsLoading).toBe(false);
      expect(useAppStore.getState().productsError).toBeNull();
    });

    it('should not load products when no current store', async () => {
      useAppStore.setState({ currentStore: null });

      await useAppStore.getState().loadProducts();

      expect(api.fetchProducts).not.toHaveBeenCalled();
    });

    it('should handle product loading errors', async () => {
      useAppStore.setState({ currentStore: { id: 1, name: 'Test Store' } });
      api.fetchProducts.mockRejectedValue(new Error('Network error'));

      // loadProducts now re-throws errors, so we need to catch them
      try {
        await useAppStore.getState().loadProducts(true); // Force refresh
      } catch (error) {
        // Expected to throw
      }

      expect(useAppStore.getState().products).toEqual([]);
      expect(useAppStore.getState().productsError).toBe('Network error');
    });

    it('should add product', async () => {
      const newProduct = { id: 1, name: 'New Product', price: 10 };
      api.createProduct.mockResolvedValue(newProduct);

      await useAppStore.getState().addProduct(newProduct);

      expect(useAppStore.getState().products).toContainEqual(newProduct);
    });

    it('should update product', async () => {
      const existingProduct = { id: 1, name: 'Old Name', price: 10 };
      const updatedProduct = { id: 1, name: 'New Name', price: 15 };

      useAppStore.setState({ products: [existingProduct] });
      api.updateProduct.mockResolvedValue(updatedProduct);

      await useAppStore.getState().updateProduct(1, updatedProduct);

      expect(useAppStore.getState().products).toContainEqual(updatedProduct);
      expect(useAppStore.getState().products).not.toContainEqual(existingProduct);
    });

    it('should delete product', async () => {
      const products = [
        { id: 1, name: 'Product 1' },
        { id: 2, name: 'Product 2' },
      ];

      useAppStore.setState({ products });
      api.deleteProduct.mockResolvedValue();

      await useAppStore.getState().deleteProduct(1);

      expect(useAppStore.getState().products).toHaveLength(1);
      expect(useAppStore.getState().products[0].id).toBe(2);
    });
  });

  describe('Cart', () => {
    it('should add item to cart', () => {
      const product = { id: 1, name: 'Product 1', price: 10, stock: 5 };

      useAppStore.getState().addToCart(product);

      expect(useAppStore.getState().cart).toHaveLength(1);
      expect(useAppStore.getState().cart[0]).toMatchObject({
        id: 1,
        name: 'Product 1',
        quantity: 1,
      });
    });

    it('should increase quantity for existing item', () => {
      const product = { id: 1, name: 'Product 1', price: 10, stock: 5 };

      useAppStore.getState().addToCart(product);
      useAppStore.getState().addToCart(product);

      expect(useAppStore.getState().cart).toHaveLength(1);
      expect(useAppStore.getState().cart[0].quantity).toBe(2);
    });

    it('should not exceed stock when adding to cart', () => {
      const product = { id: 1, name: 'Product 1', price: 10, stock: 2 };

      useAppStore.getState().addToCart(product);
      useAppStore.getState().addToCart(product);
      useAppStore.getState().addToCart(product); // Should not add

      expect(useAppStore.getState().cart[0].quantity).toBe(2);
    });

    it('should remove item from cart', () => {
      useAppStore.setState({
        cart: [
          { id: 1, name: 'Product 1', quantity: 2 },
          { id: 2, name: 'Product 2', quantity: 1 },
        ],
      });

      useAppStore.getState().removeFromCart(1);

      expect(useAppStore.getState().cart).toHaveLength(1);
      expect(useAppStore.getState().cart[0].id).toBe(2);
    });

    it('should update cart quantity', () => {
      useAppStore.setState({
        cart: [{ id: 1, name: 'Product 1', quantity: 2 }],
      });

      useAppStore.getState().updateCartQuantity(1, 5);

      expect(useAppStore.getState().cart[0].quantity).toBe(5);
    });

    it('should remove item when quantity is 0', () => {
      useAppStore.setState({
        cart: [{ id: 1, name: 'Product 1', quantity: 2 }],
      });

      useAppStore.getState().updateCartQuantity(1, 0);

      expect(useAppStore.getState().cart).toHaveLength(0);
    });

    it('should clear cart', () => {
      useAppStore.setState({
        cart: [
          { id: 1, name: 'Product 1', quantity: 2 },
          { id: 2, name: 'Product 2', quantity: 1 },
        ],
      });

      useAppStore.getState().clearCart();

      expect(useAppStore.getState().cart).toEqual([]);
    });
  });

  describe('Initialization', () => {
    it('should initialize when authenticated', async () => {
      const mockUser = { username: '09123456789', role: 'Owner' };
      const mockStores = [{ id: 1, name: 'Test Store' }];

      api.isAuthenticated.mockReturnValue(true);
      api.getUser.mockReturnValue(mockUser);
      api.getToken.mockReturnValue('test-token');
      api.getUserStores.mockResolvedValue(mockStores);
      api.fetchProducts.mockResolvedValue([]);

      await useAppStore.getState().initialize();

      expect(useAppStore.getState().isAuthenticated).toBe(true);
      expect(useAppStore.getState().user).toEqual(mockUser);
      expect(useAppStore.getState().userStores).toEqual(mockStores);
    });

    it('should not load stores when not authenticated', async () => {
      api.isAuthenticated.mockReturnValue(false);

      await useAppStore.getState().initialize();

      expect(api.getUserStores).not.toHaveBeenCalled();
      expect(useAppStore.getState().isAuthenticated).toBe(false);
    });
  });
});
