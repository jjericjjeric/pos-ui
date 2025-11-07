import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../context/useInventory';
import ProductTile from '../components/ProductTile';
import Cart from '../components/Cart';
import './POSPage.css';

const POSPage = () => {
  const { products, loading, error, logoutUser, user } = useInventory();
  const [cart, setCart] = useState([]);
  const navigate = useNavigate();

  const addToCart = (product) => {
    if (product.stock === 0) {
      alert('Product out of stock!');
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      
      if (existingItem) {
        // Check if adding one more would exceed stock
        if (existingItem.quantity >= product.stock) {
          alert('Not enough stock available!');
          return prevCart;
        }
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find(p => p.id === productId);
    if (newQuantity > product.stock) {
      alert('Not enough stock available!');
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Cart is empty!');
      return;
    }
    navigate('/payment', { state: { cart } });
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="pos-container">
      <div className="pos-header">
        <div className="branding">
          <h1>Free POS PH</h1>
          <p>Point of Sale System</p>
        </div>
        <div className="user-actions">
          {user && (
            <span className="user-info">Signed in as <strong>{user.username}</strong>{user.role ? ` (${user.role})` : ''}</span>
          )}
          <button
            className="logout-btn"
            onClick={() => {
              logoutUser();
              navigate('/');
            }}
          >
            Logout
          </button>
        </div>
      </div>
      
      <div className="pos-content">
        <div className="products-section">
          <div className="products-header">
            <h2>Products</h2>
            <button 
              className="add-product-btn"
              onClick={() => navigate('/add-product')}
            >
              + Add Product
            </button>
          </div>
          {loading && (
            <div className="loading-message">Loading products...</div>
          )}
          {error && (
            <div className="error-message">
              Error loading products: {error}. Please make sure the API server is running.
            </div>
          )}
          {!loading && !error && (
            <div className="products-grid">
              {products.length === 0 ? (
                <div className="no-products">No products available</div>
              ) : (
                products.map(product => (
                  <ProductTile
                    key={product.id}
                    product={product}
                    onAddToCart={() => addToCart(product)}
                  />
                ))
              )}
            </div>
          )}
        </div>

        <div className="cart-section">
          <Cart
            cart={cart}
            onRemove={removeFromCart}
            onUpdateQuantity={updateQuantity}
            totalPrice={totalPrice}
            onCheckout={handleCheckout}
          />
        </div>
      </div>
    </div>
  );
};

export default POSPage;

