import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LowStockBanner from '../../components/LowStockBanner';
import useAppStore from '../../store/useAppStore';

// Mock useAppStore
vi.mock('../../store/useAppStore');

describe('LowStockBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when no low stock products', () => {
    useAppStore.mockImplementation((selector) => selector({
      appSettings: { lowStockThreshold: 10 },
      products: [
        { id: 1, name: 'Product 1', stock: 50 },
        { id: 2, name: 'Product 2', stock: 20 },
      appSettings: { lowStockThreshold: 10 },
    }));

    const { container } = render(<LowStockBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('should render low stock warning banner', () => {
    useAppStore.mockImplementation((selector) => selector({
      appSettings: { lowStockThreshold: 10 },
      products: [
        { id: 1, name: 'Low Stock Product', stock: 5 },
        { id: 2, name: 'Normal Product', stock: 50 },
      appSettings: { lowStockThreshold: 10 },
    }));

    render(<LowStockBanner />);
    
    expect(screen.getByText(/1 product running low on stock/i)).toBeInTheDocument();
    expect(screen.getByText(/Restock soon to avoid stockouts/i)).toBeInTheDocument();
  });

  it('should render out of stock alert banner', () => {
    useAppStore.mockImplementation((selector) => selector({
      appSettings: { lowStockThreshold: 10 },
      products: [
        { id: 1, name: 'Out of Stock', stock: 0 },
        { id: 2, name: 'Another Out of Stock', stock: 0 },
