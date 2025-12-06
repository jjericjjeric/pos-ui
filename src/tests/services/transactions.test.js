import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createTransaction,
  getTransactions,
  getTransaction,
  getTransactionStats,
  cancelTransaction,
} from '../../services/api';

// Mock fetch
global.fetch = vi.fn();

describe('Transaction API Functions', () => {
  beforeEach(() => {
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key) => {
          if (key === 'jwt_token') return 'mock-jwt-token';
          if (key === 'currentStoreId') return '1';
          return null;
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createTransaction', () => {
    it('creates a transaction successfully', async () => {
      const mockTransaction = {
        id: 1,
        store_id: 1,
        total_amount: 100.0,
        status: 'completed',
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ transaction: mockTransaction, message: 'Success' }),
      });

      const transactionData = {
        items: [
          {
            product_id: 1,
            product_name: 'Test Product',
            quantity: 1,
            unit_price: 100.0,
            subtotal: 100.0,
          },
        ],
        total_amount: 100.0,
        amount_paid: 100.0,
        payment_method: 'cash',
        notes: '',
      };

      const result = await createTransaction(transactionData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/transactions?store_id=1'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-jwt-token',
          }),
          body: expect.any(String),
        })
      );

      expect(result.transaction).toEqual(mockTransaction);
    });

    it('throws error when no store selected', async () => {
      localStorage.getItem.mockImplementation((key) => {
        if (key === 'jwt_token') return 'mock-jwt-token';
        if (key === 'currentStoreId') return null;
        return null;
      });

      const transactionData = {
        items: [],
        total_amount: 100.0,
        amount_paid: 100.0,
        payment_method: 'cash',
      };

      await expect(createTransaction(transactionData)).rejects.toThrow('No store selected');
    });

    it('throws error on insufficient stock', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Insufficient stock for product: Test Product' }),
      });

      const transactionData = {
        items: [
          {
            product_id: 1,
            product_name: 'Test Product',
            quantity: 100,
            unit_price: 100.0,
            subtotal: 10000.0,
          },
        ],
        total_amount: 10000.0,
        amount_paid: 10000.0,
        payment_method: 'cash',
      };

      await expect(createTransaction(transactionData)).rejects.toThrow();
    });
  });

  describe('getTransactions', () => {
    it('fetches transactions with filters', async () => {
      const mockResponse = {
        transactions: [
          { id: 1, total_amount: 100 },
          { id: 2, total_amount: 200 },
        ],
        total: 2,
        page: 1,
        limit: 20,
        total_pages: 1,
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const filters = {
        start_date: '2025-12-01',
        end_date: '2025-12-06',
        status: 'completed',
        payment_method: 'cash',
        page: 1,
        limit: 20,
      };

      const result = await getTransactions(filters);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/transactions?'),
        expect.any(Object)
      );

      const callUrl = global.fetch.mock.calls[0][0];
      expect(callUrl).toContain('start_date=2025-12-01');
      expect(callUrl).toContain('end_date=2025-12-06');
      expect(callUrl).toContain('status=completed');
      expect(callUrl).toContain('payment_method=cash');

      expect(result).toEqual(mockResponse);
    });

    it('fetches transactions without filters', async () => {
      const mockResponse = {
        transactions: [],
        total: 0,
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getTransactions();

      expect(global.fetch).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('handles pagination', async () => {
      const mockResponse = {
        transactions: [],
        total: 50,
        page: 2,
        limit: 20,
        total_pages: 3,
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getTransactions({ page: 2, limit: 20 });

      const callUrl = global.fetch.mock.calls[0][0];
      expect(callUrl).toContain('page=2');
      expect(callUrl).toContain('limit=20');

      expect(result.page).toBe(2);
    });
  });

  describe('getTransaction', () => {
    it('fetches a single transaction by ID', async () => {
      const mockTransaction = {
        id: 1,
        total_amount: 100.0,
        items: [
          { id: 1, product_name: 'Test Product', quantity: 1 },
        ],
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTransaction,
      });

      const result = await getTransaction(1);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/transactions/1'),
        expect.any(Object)
      );

      expect(result).toEqual(mockTransaction);
    });

    it('throws error for non-existent transaction', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ message: 'Transaction not found' }),
      });

      await expect(getTransaction(999)).rejects.toThrow();
    });
  });

  describe('getTransactionStats', () => {
    it('fetches transaction statistics', async () => {
      const mockStats = {
        stats: {
          total_sales: 1000.0,
          total_transactions: 10,
          average_transaction: 100.0,
          total_cash: 600.0,
          total_card: 400.0,
          total_online: 0,
        },
        start_date: '2025-12-06',
        end_date: '2025-12-06',
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats,
      });

      const result = await getTransactionStats({
        start_date: '2025-12-06',
        end_date: '2025-12-06',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/transactions/stats?'),
        expect.any(Object)
      );

      const callUrl = global.fetch.mock.calls[0][0];
      expect(callUrl).toContain('start_date=2025-12-06');
      expect(callUrl).toContain('end_date=2025-12-06');

      expect(result).toEqual(mockStats);
    });

    it('fetches stats without date range', async () => {
      const mockStats = {
        stats: {
          total_sales: 1000.0,
          total_transactions: 10,
        },
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats,
      });

      const result = await getTransactionStats();

      expect(global.fetch).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
    });
  });

  describe('cancelTransaction', () => {
    it('cancels a transaction successfully', async () => {
      const mockResponse = {
        message: 'Transaction cancelled successfully',
        transaction: { id: 1, status: 'cancelled' },
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await cancelTransaction(1);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/transactions/1/cancel'),
        expect.objectContaining({
          method: 'POST',
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('throws error when cancelling already cancelled transaction', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ message: 'Transaction is already cancelled' }),
      });

      await expect(cancelTransaction(1)).rejects.toThrow();
    });

    it('throws error for unauthorized cancel attempt', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({ message: 'Permission denied' }),
      });

      await expect(cancelTransaction(1)).rejects.toThrow();
    });
  });

  describe('Authentication handling', () => {
    it('includes Authorization header in all requests', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      await getTransactions();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-jwt-token',
          }),
        })
      );
    });

    it('includes store_id in query parameters', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      await getTransactions();

      const callUrl = global.fetch.mock.calls[0][0];
      expect(callUrl).toContain('store_id=1');
    });
  });

  describe('Error handling', () => {
    it('handles network errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(getTransactions()).rejects.toThrow('Network error');
    });

    it('handles 401 unauthorized errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ message: 'Authentication required' }),
      });

      await expect(getTransactions()).rejects.toThrow();
    });

    it('handles 500 server errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ message: 'Server error' }),
      });

      await expect(getTransactions()).rejects.toThrow();
    });
  });
});
