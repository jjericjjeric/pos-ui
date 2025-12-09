import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LowStockAlerts from '../../components/LowStockAlerts';
import useAppStore from '../../store/useAppStore';

// Mock useAppStore
vi.mock('../../store/useAppStore');

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('LowStockAlerts', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    vi.clearAllMocks();
  });

  it('should render empty state when no alerts', () => {
    useAppStore.mockImplementation((selector) => selector({
      appSettings: { lowStockThreshold: 10 },
      products: [
        { id: 1, name: 'Product 1', stock: 50, price: 100 },
      ],
    }));

    render(
      <BrowserRouter>
        <LowStockAlerts isOpen={true} onClose={vi.fn()} />
      </BrowserRouter>
    );
    
    expect(screen.getByText('All Good!')).toBeInTheDocument();
  });

  it('should render low stock products', () => {
    useAppStore.mockImplementation((selector) => selector({
      appSettings: { lowStockThreshold: 10 },
      products: [
        { id: 1, name: 'Low Stock Product', stock: 5, price: 100 },
      ],
    }));

    render(
      <BrowserRouter>
        <LowStockAlerts isOpen={true} onClose={vi.fn()} />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Low Stock \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText('Low Stock Product')).toBeInTheDocument();
  });

  it('should render out of stock products', () => {
    useAppStore.mockImplementation((selector) => selector({
      appSettings: { lowStockThreshold: 10 },
      products: [
        { id: 1, name: 'Out of Stock', stock: 0, price: 100 },
      ],
    }));

    render(
      <BrowserRouter>
        <LowStockAlerts isOpen={true} onClose={vi.fn()} />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Out of Stock \(1\)/i)).toBeInTheDocument();
  });

  it('should navigate to edit page when clicking Restock', () => {
    const onClose = vi.fn();
    
    useAppStore.mockImplementation((selector) => selector({
      appSettings: { lowStockThreshold: 10 },
      products: [
        { id: 1, name: 'Low Stock', stock: 5, price: 100 },
      ],
    }));

    render(
      <BrowserRouter>
        <LowStockAlerts isOpen={true} onClose={onClose} />
      </BrowserRouter>
    );
    
    const restockButton = screen.getByLabelText('Restock Low Stock');
    fireEvent.click(restockButton);
    
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/add-product/1', { state: { focusStock: true } });
  });
});
