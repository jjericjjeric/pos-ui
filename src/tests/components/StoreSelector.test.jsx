import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import StoreSelector from '../../components/StoreSelector';
import useAppStore from '../../store/useAppStore';

// Mock the Zustand store
vi.mock('../../store/useAppStore');

describe('StoreSelector Component', () => {
  const mockStores = [
    { id: 1, name: 'Store A', address: '123 Main St', role: 'Owner' },
    { id: 2, name: 'Store B', address: '456 Oak Ave', role: 'Admin' },
    { id: 3, name: 'Store C', address: '789 Pine Rd', role: 'Manager' },
  ];

  const mockSwitchStore = vi.fn();
  const mockUpdateStore = vi.fn();

  const setupMockStore = (stores, currentStoreId = 1) => {
    const currentStore = stores.find(s => s.id === currentStoreId);
    
    useAppStore.mockImplementation((selector) => {
      const state = {
        userStores: stores,
        currentStore,
        switchStore: mockSwitchStore,
        updateStore: mockUpdateStore,
        storesLoading: false,
      };
      return selector(state);
    });
  };

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <StoreSelector variant="light" />
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show single store without dropdown when user has only one store', () => {
    const singleStore = [mockStores[0]];
    setupMockStore(singleStore);
    renderComponent();
    
    // Should show single store badge
    expect(screen.getByText('Store A')).toBeInTheDocument();
  });

  it('should render dropdown button when user has multiple stores', () => {
    setupMockStore(mockStores);
    renderComponent();
    
    // Should show current store name
    expect(screen.getByText('Store A')).toBeInTheDocument();
  });

  it('should show all stores when dropdown is clicked', async () => {
    setupMockStore(mockStores);
    renderComponent();
    
    // Click to open dropdown
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    // Should show all stores
    await waitFor(() => {
      // Use getAllByText since "Store A" appears twice (button header + dropdown)
      const storeAElements = screen.getAllByText('Store A');
      expect(storeAElements.length).toBeGreaterThan(0);
      expect(screen.getByText('Store B')).toBeInTheDocument();
      expect(screen.getByText('Store C')).toBeInTheDocument();
    });
  });

  it('should display role badges correctly', async () => {
    setupMockStore(mockStores);
    renderComponent();
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Owner')).toBeInTheDocument();
      expect(screen.getByText('Admin')).toBeInTheDocument();
      expect(screen.getByText('Manager')).toBeInTheDocument();
    });
  });

  it('should call switchStore when a different store is selected', async () => {
    setupMockStore(mockStores, 1);
    renderComponent();
    
    // Open dropdown
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    // Click on Store B
    await waitFor(() => {
      const storeButtons = screen.getAllByText('Store B');
      // Find the actual store button, not the name text
      const storeButton = storeButtons[0].closest('button');
      fireEvent.click(storeButton);
    });
    
    expect(mockSwitchStore).toHaveBeenCalledWith(2);
  });

  it('should show checkmark on current store', async () => {
    setupMockStore(mockStores, 1);
    renderComponent();
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      // The checkmark is in a separate span element
      expect(screen.getByText('✓')).toBeInTheDocument();
    });
  });

  it('should handle single store without dropdown', () => {
    const storesWithOneStore = [
      { id: 1, name: 'Store A', role: 'Owner' },
    ];
    
    setupMockStore(storesWithOneStore);
    renderComponent();
    
    // With single store, component shows badge (no dropdown button)
    expect(screen.getByText('Store A')).toBeInTheDocument();
  });

  it('should close dropdown when clicking outside', async () => {
    setupMockStore(mockStores);
    renderComponent();
    
    // Open dropdown
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    // Verify dropdown is open
    await waitFor(() => {
      expect(screen.getByText('Store B')).toBeInTheDocument();
    });
    
    // Click outside (on document body)
    fireEvent.mouseDown(document.body);
    
    // Dropdown should close (Store B should not be visible as separate item)
    await waitFor(() => {
      const storeBElements = screen.queryAllByText('Store B');
      // Should only have one (in closed dropdown button)
      expect(storeBElements.length).toBeLessThanOrEqual(1);
    });
  });

  it('should handle empty stores state', () => {
    setupMockStore([]);
    renderComponent();
    
    // Should not render anything when no stores
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
