import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiService from '../../services/api';

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    global.fetch = vi.fn();
  });

  describe('API Helper Functions', () => {
    it('should add store_id to URL when currentStoreId exists', () => {
      localStorage.getItem.mockReturnValue('123');
      
      const url = apiService.addStoreIdToUrl('/products', '123');
      
      expect(url).toContain('store_id=123');
    });

    it('should handle URLs that already have query parameters', () => {
      localStorage.getItem.mockReturnValue('123');
      
      const url = apiService.addStoreIdToUrl('/products?category=food', '123');
      
      expect(url).toContain('&store_id=123');
    });

    it('should not add store_id when storeId is null', () => {
      const url = apiService.addStoreIdToUrl('/products', null);
      
      expect(url).not.toContain('store_id');
    });
  });

  describe('Store API Endpoints', () => {
    it('should call getUserStores', async () => {
      const mockStores = [
        { id: 1, name: 'Store A' },
        { id: 2, name: 'Store B' },
      ];

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockStores, // API returns array directly
      });

      localStorage.getItem.mockReturnValue('fake-token');

      const result = await apiService.getUserStores();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/stores'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer fake-token',
          }),
        })
      );

      expect(result).toEqual(mockStores);
    });

    it('should call switchStore with correct store id', async () => {
      const mockResponse = { token: 'new-token', store_id: 2 };
      
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse, // No data wrapper
      });

      localStorage.getItem.mockReturnValue('fake-token');

      const result = await apiService.switchStore(2);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/stores/2/switch'),
        expect.objectContaining({
          method: 'POST',
        })
      );

      expect(result.store_id).toBe(2);
    });

    it('should call createStore with store data', async () => {
      const storeData = {
        name: 'New Store',
        description: 'Test Store Description',
      };

      const mockResponse = { id: 3, ...storeData };
      
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse, // No data wrapper
      });

      localStorage.getItem.mockReturnValue('fake-token');

      const result = await apiService.createStore(storeData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/stores'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(storeData),
        })
      );

      expect(result.name).toBe('New Store');
    });
  });

  describe('Authentication Endpoints', () => {
    it('should handle login request', async () => {
      const mockResponse = {
        token: 'jwt-token',
        username: 'testuser',
        role: 'USER'
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      // login() takes username and password as separate args
      const result = await apiService.login('testuser', 'password123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ username: 'testuser', password: 'password123' }),
        })
      );

      expect(result.token).toBe('jwt-token');
    });

    it('should handle register request', async () => {
      const mockResponse = {
        message: 'User registered successfully'
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      // register() takes mobileNumber and pin
      const result = await apiService.register('09123456789', '1234');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/register'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ 
            username: '09123456789',
            password: '1234',
            role: 'USER'
          }),
        })
      );

      expect(result.message).toBe('User registered successfully');
    });
  });

  describe('Product Endpoints', () => {
    it('should fetch products', async () => {
      const mockProducts = [
        { id: 1, name: 'Product A', price: 10, image: '' },
        { id: 2, name: 'Product B', price: 20, image: '' },
      ];

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockProducts,
      });

      localStorage.getItem.mockReturnValue('fake-token');

      const result = await apiService.fetchProducts();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/products'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer fake-token',
          }),
        })
      );

      expect(result).toEqual(mockProducts);
    });

    it('should create product', async () => {
      const productData = {
        name: 'New Product',
        price: 15.99,
        stock: 100,
      };

      const mockResponse = { id: 10, ...productData, image: '' };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      localStorage.getItem.mockReturnValue('fake-token');

      const result = await apiService.createProduct(productData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/products'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(productData),
        })
      );
      
      expect(result.id).toBe(10);
      expect(result.name).toBe('New Product');
    });
  });

  describe('Error Handling', () => {
    it('should throw error when fetch fails', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        statusText: 'Not Found',
        json: async () => ({ error: 'Resource not found' }),
      });

      localStorage.getItem.mockReturnValue('fake-token');

      await expect(apiService.getUserStores()).rejects.toThrow();
    });

    it('should throw error when network fails', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      localStorage.getItem.mockReturnValue('fake-token');

      await expect(apiService.getUserStores()).rejects.toThrow('Network error');
    });
  });
});
