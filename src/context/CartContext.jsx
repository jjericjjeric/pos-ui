import { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

const CART_STORAGE_KEY = 'pos_cart';

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [cartBadgeBounce, setCartBadgeBounce] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [cart]);

  const addToCart = (product, showToast) => {
    if (product.stock === 0) {
      return { success: false, message: 'Product out of stock!' };
    }

    let message = '';
    let success = false;

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      
      if (existingItem) {
        // Check if adding one more would exceed stock
        if (existingItem.quantity >= product.stock) {
          message = 'Not enough stock available!';
          return prevCart;
        }
        
        message = `${product.name} quantity increased`;
        success = true;
        
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        message = `${product.name} added to cart`;
        success = true;
        
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });

    if (success) {
      // Trigger cart badge bounce
      setCartBadgeBounce(true);
      setTimeout(() => setCartBadgeBounce(false), 500);
      
      if (showToast) {
        showToast(message, 'success', 2000);
      }
    }

    return { success, message };
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity, products) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return { success: true };
    }

    const product = products.find(p => p.id === productId);
    if (!product) {
      return { success: false, message: 'Product not found' };
    }

    if (newQuantity > product.stock) {
      return { success: false, message: 'Not enough stock available!' };
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );

    return { success: true };
  };

  const clearCart = () => {
    setCart([]);
  };

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const value = {
    cart,
    cartBadgeBounce,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
