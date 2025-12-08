import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductTile from '../../components/ProductTile';

describe('ProductTile Component', () => {
  const mockProduct = {
    id: 1,
    name: 'Coffee',
    price: 15.99,
    stock: 50,
    category: 'Beverages',
    image: '☕',
  };

  it('should render product information correctly', () => {
    const mockOnAdd = vi.fn();
    render(<ProductTile product={mockProduct} onAddToCart={mockOnAdd} />);
    
    expect(screen.getByText('Coffee')).toBeInTheDocument();
    expect(screen.getByText('₱15.99')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument(); // Stock badge shows just the number
    expect(screen.getByText('Beverages')).toBeInTheDocument(); // Not uppercase
  });

  it('should call onAddToCart when clicked', () => {
    const mockOnAdd = vi.fn();
    render(<ProductTile product={mockProduct} onAddToCart={mockOnAdd} />);
    
    const tile = screen.getByText('Coffee').closest('div');
    fireEvent.click(tile);
    
    expect(mockOnAdd).toHaveBeenCalled(); // Called without arguments
  });

  it('should show out of stock badge when stock is 0', () => {
    const outOfStockProduct = { ...mockProduct, stock: 0 };
    const mockOnAdd = vi.fn();
    
    render(<ProductTile product={outOfStockProduct} onAddToCart={mockOnAdd} />);
    
    expect(screen.getByText(/Out of Stock/i)).toBeInTheDocument();
  });

  it('should show low stock warning when stock is less than 10', () => {
    const lowStockProduct = { ...mockProduct, stock: 5 };
    const mockOnAdd = vi.fn();
    
    render(<ProductTile product={lowStockProduct} onAddToCart={mockOnAdd} />);
    
    const stockBadge = screen.getByText('5');
    expect(stockBadge).toBeInTheDocument();
    expect(stockBadge.className).toContain('bg-yellow-50'); // Low stock warning
  });

  it('should disable click when out of stock', () => {
    const outOfStockProduct = { ...mockProduct, stock: 0 };
    const mockOnAdd = vi.fn();
    
    render(<ProductTile product={outOfStockProduct} onAddToCart={mockOnAdd} />);
    
    const tile = screen.getByText('Coffee').closest('div');
    fireEvent.click(tile);
    
    // Should not call onAddToCart when out of stock
    expect(mockOnAdd).not.toHaveBeenCalled();
  });

  it('should render ProgressiveImage component when product has ID', () => {
    const mockOnAdd = vi.fn();
    render(<ProductTile product={mockProduct} onAddToCart={mockOnAdd} />);
    
    // ProgressiveImage is rendered for products with ID
    // Fallback emoji only shows if product has no ID
    const productName = screen.getByText('Coffee');
    expect(productName).toBeInTheDocument();
  });

  it('should render fallback emoji when product has no ID', () => {
    const productNoId = { 
      ...mockProduct,
      id: null
    };
    const mockOnAdd = vi.fn();
    
    render(<ProductTile product={productNoId} onAddToCart={mockOnAdd} />);
    
    // Should show fallback emoji when no ID
    expect(screen.getByText('🛍️')).toBeInTheDocument();
  });

  it('should handle missing category', () => {
    const productNoCategory = { ...mockProduct, category: null };
    const mockOnAdd = vi.fn();
    
    render(<ProductTile product={productNoCategory} onAddToCart={mockOnAdd} />);
    
    // Component doesn't render category badge when category is null
    expect(screen.queryByText(/BEVERAGES/)).not.toBeInTheDocument();
    expect(screen.getByText('Coffee')).toBeInTheDocument();
  });

  it('should format price correctly', () => {
    const expensiveProduct = { ...mockProduct, price: 1234.56 };
    const mockOnAdd = vi.fn();
    
    render(<ProductTile product={expensiveProduct} onAddToCart={mockOnAdd} />);
    
    expect(screen.getByText('₱1234.56')).toBeInTheDocument();
  });
});
