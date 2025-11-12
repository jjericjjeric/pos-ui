import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { StoreProvider } from '../../context/StoreContext';
import { useStore } from '../../context/useStore';

// Mock the entire API module
vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Import after mocking
import api from '../../services/api';

describe('StoreContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide initial empty state', async () => {
    // No token in localStorage
    localStorage.getItem.mockReturnValue(null);
    
    const { result } = renderHook(() => useStore(), {
      wrapper: StoreProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.userStores).toEqual([]);
    expect(result.current.currentStore).toBeNull();
  });

  it('should load stores on mount when token exists', async () => {
    const mockStores = [
      { id: 1, name: 'Store A', role: 'Owner' },
      { id: 2, name: 'Store B', role: 'Admin' },
    ];

    localStorage.getItem.mockImplementation((key) => {
      if (key === 'token') return 'fake-token';
      if (key === 'currentStoreId') return '1';
      return null;
    });

    api.get.mockResolvedValue({ data: { stores: mockStores } });

    const { result } = renderHook(() => useStore(), {
      wrapper: StoreProvider,
    });

    await waitFor(() => {
      expect(result.current.userStores).toEqual(mockStores);
      expect(result.current.currentStore).toEqual(mockStores[0]);
      expect(result.current.loading).toBe(false);
    });
  });

  it('should handle switch store', async () => {
    const mockStores = [
      { id: 1, name: 'Store A', role: 'Owner' },
      { id: 2, name: 'Store B', role: 'Admin' },
    ];

    localStorage.getItem.mockImplementation((key) => {
      if (key === 'token') return 'fake-token';
      if (key === 'currentStoreId') return '1';
      return null;
    });

    api.get.mockResolvedValue({ data: { stores: mockStores } });
    api.post.mockResolvedValue({ 
      data: { token: 'new-token', store_id: 2 } 
    });

    const { result } = renderHook(() => useStore(), {
      wrapper: StoreProvider,
    });

    await waitFor(() => {
      expect(result.current.userStores).toEqual(mockStores);
    });

    // Mock window.location.reload
    delete window.location;
    window.location = { reload: vi.fn() };

    await result.current.switchStore(2);

    expect(api.post).toHaveBeenCalledWith('/stores/2/switch');
    expect(localStorage.setItem).toHaveBeenCalledWith('token', 'new-token');
    expect(localStorage.setItem).toHaveBeenCalledWith('currentStoreId', '2');
  });

  it('should handle create store', async () => {
    const newStore = { name: 'New Store', description: 'Test Store' };
    const createdStore = { id: 3, ...newStore, role: 'Owner' };

    localStorage.getItem.mockReturnValue('fake-token');
    
    api.get.mockResolvedValue({ data: { stores: [] } });
    api.post.mockResolvedValue({ data: { store: createdStore } });

    const { result } = renderHook(() => useStore(), {
      wrapper: StoreProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.createStore(newStore);

    expect(api.post).toHaveBeenCalledWith('/stores', newStore);
    await waitFor(() => {
      expect(result.current.userStores).toContainEqual(createdStore);
    });
  });

  it('should handle errors when loading stores fails', async () => {
    localStorage.getItem.mockReturnValue('fake-token');
    api.get.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useStore(), {
      wrapper: StoreProvider,
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.userStores).toEqual([]);
      expect(result.current.loading).toBe(false);
    });
  });

  it('should not load stores when no token exists', async () => {
    // Clear all previous mock calls
    api.get.mockClear();
    localStorage.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useStore(), {
      wrapper: StoreProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(api.get).not.toHaveBeenCalled();
    expect(result.current.userStores).toEqual([]);
  });

  it('should update currentStore when currentStoreId changes', async () => {
    const mockStores = [
      { id: 1, name: 'Store A', role: 'Owner' },
      { id: 2, name: 'Store B', role: 'Admin' },
    ];

    localStorage.getItem.mockImplementation((key) => {
      if (key === 'token') return 'fake-token';
      if (key === 'currentStoreId') return '2';
      return null;
    });

    api.get.mockResolvedValue({ data: { stores: mockStores } });

    const { result } = renderHook(() => useStore(), {
      wrapper: StoreProvider,
    });

    await waitFor(() => {
      expect(result.current.currentStore).toEqual(mockStores[1]);
      expect(result.current.loading).toBe(false);
    });
  });
});
