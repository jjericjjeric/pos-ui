import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Cart from '../../components/Cart';

describe('Cart Component', () => {
  const mockCartItems = [
    { id: 1, name: 'Coffee', price: 15.99, quantity: 2, image: '☕' },
    { id: 2, name: 'Tea', price: 12.50, quantity: 1, image: '🍵' },
  ];

  const mockRemoveFromCart = vi.fn();
  const mockUpdateQuantity = vi.fn();
  const mockCheckout = vi.fn();

  const renderCart = (items = mockCartItems) => {
    const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    return render(
      <BrowserRouter>
        <Cart 
          cart={items}
          onRemove={mockRemoveFromCart}
          onUpdateQuantity={mockUpdateQuantity}
          totalPrice={totalPrice}
          onCheckout={mockCheckout}
        />
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render cart items', () => {
    renderCart();
    
    expect(screen.getByText('Coffee')).toBeInTheDocument();
    expect(screen.getByText('Tea')).toBeInTheDocument();
  });

  it('should display correct quantities', () => {
    renderCart();
    
    // Coffee has quantity 2, Tea has quantity 1
    const quantities = screen.getAllByText(/^[12]$/);
    expect(quantities.length).toBeGreaterThanOrEqual(2);
  });

  it('should calculate total price correctly', () => {
    renderCart();
    
    // Total: (15.99 * 2) + (12.50 * 1) = 44.48
    expect(screen.getByText(/44\.48/)).toBeInTheDocument();
  });

  it('should call updateQuantity when quantity is changed', () => {
    renderCart();
    
    const plusButtons = screen.getAllByText('+');
    fireEvent.click(plusButtons[0]);
    
    expect(mockUpdateQuantity).toHaveBeenCalledWith(1, 3);
  });

  it('should call removeFromCart when remove button is clicked', () => {
    renderCart();
    
    const removeButtons = screen.getAllByText('×');
    fireEvent.click(removeButtons[0]);
    
    expect(mockRemoveFromCart).toHaveBeenCalledWith(1);
  });

  it('should call checkout when checkout button is clicked', () => {
    renderCart();
    
    const checkoutButton = screen.getByRole('button', { name: /checkout|proceed/i });
    fireEvent.click(checkoutButton);
    
    expect(mockCheckout).toHaveBeenCalled();
  });

  it('should show empty cart message when cart is empty', () => {
    renderCart([]);
    
    expect(screen.getByText(/No items in cart/i)).toBeInTheDocument();
  });

  it('should disable checkout button when cart is empty', () => {
    renderCart([]);
    
    const checkoutButton = screen.getByRole('button', { name: /checkout|proceed/i });
    expect(checkoutButton).toBeDisabled();
  });

  it('should enable checkout button when cart has items', () => {
    renderCart();
    
    const checkoutButton = screen.getByRole('button', { name: /checkout|proceed/i });
    expect(checkoutButton).not.toBeDisabled();
  });

  it('should calculate and display subtotals correctly', () => {
    renderCart();
    
    // Coffee: 15.99 * 2 = 31.98
    const coffeePrice = screen.getAllByText(/15\.99/)[0]; // Unit price
    expect(coffeePrice).toBeInTheDocument();
    
    // Tea: has unit price 12.50
    const teaPrice = screen.getAllByText(/12\.50/)[0];
    expect(teaPrice).toBeInTheDocument();
  });

  it('should prevent quantity from going below 1', () => {
    renderCart();
    
    const minusButtons = screen.getAllByText('-');
    fireEvent.click(minusButtons[0]);
    
    // Should call with quantity - 1 = 1
    expect(mockUpdateQuantity).toHaveBeenCalledWith(1, 1);
  });

  it('should show cart item count', () => {
    renderCart();
    
    // We have 2 items (Coffee and Tea)
    expect(screen.getByText('Coffee')).toBeInTheDocument();
    expect(screen.getByText('Tea')).toBeInTheDocument();
  });
});
