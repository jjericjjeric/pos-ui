import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../context/useInventory';
import ProductTile from '../components/ProductTile';
import Cart from '../components/Cart';

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
    <div className="h-screen w-full flex flex-col bg-gradient-to-br from-[#667eea] to-[#764ba2] overflow-hidden">
      <div className="bg-white/95 px-4 sm:px-6 py-2 sm:py-3 shadow-[0_2px_10px_rgba(0,0,0,0.1)] z-10 flex justify-between items-center gap-2 sm:gap-4 flex-wrap">
        <div className="flex flex-col">
          <h1 className="m-0 text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">Free POS PH</h1>
          <p className="mt-1 mb-0 text-gray-600 text-xs sm:text-sm">Point of Sale System</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          {user && (
            <span className="text-xs sm:text-sm text-gray-700 bg-blue-50 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md border border-blue-200">
              Signed in as <strong>{user.username}</strong>{user.role ? ` (${user.role})` : ''}
            </span>
          )}
          <button
            className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-sm sm:text-base bg-red-500 text-white border-none rounded-lg font-semibold cursor-pointer shadow-[0_4px_12px_rgba(255,82,82,0.35)] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(255,82,82,0.45)] active:translate-y-0"
            onClick={() => {
              logoutUser();
              navigate('/');
            }}
          >
            Logout
          </button>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden gap-2 sm:gap-4 p-2 sm:p-4 flex-col lg:flex-row">
        <div className="flex-[1_1_auto] lg:flex-[0_0_70%] min-h-[45vh] sm:min-h-[50vh] md:min-h-[50vh] bg-white rounded-xl p-3 sm:p-4 md:p-6 overflow-y-auto shadow-[0_4px_20px_rgba(0,0,0,0.1)]">
          <div className="flex flex-col sm:flex-col md:flex-row justify-between items-start md:items-center mb-3 sm:mb-4 md:mb-6 border-b-2 border-[#667eea] pb-2 gap-3">
            <h2 className="m-0 text-gray-800 text-lg sm:text-xl md:text-2xl">Products</h2>
            <button 
              className="w-full sm:w-full md:w-auto px-2.5 sm:px-4 py-2 sm:py-2 bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-all shadow-[0_2px_8px_rgba(102,126,234,0.3)] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(102,126,234,0.4)] active:translate-y-0"
              onClick={() => navigate('/add-product')}
            >
              + Add Product
            </button>
          </div>
          {loading && (
            <div className="text-center p-8 text-gray-600 text-lg">Loading products...</div>
          )}
          {error && (
            <div className="text-center p-6 bg-red-50 text-red-700 rounded-lg my-4 border border-red-200">
              Error loading products: {error}. Please make sure the API server is running.
            </div>
          )}
          {!loading && !error && (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(130px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(130px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2 sm:gap-3 md:gap-4 pt-2">
              {products.length === 0 ? (
                <div className="text-center p-12 text-gray-400 text-lg col-span-full">No products available</div>
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

        <div className="flex-[0_0_auto] lg:flex-[0_0_30%] max-h-[45vh] sm:max-h-[40vh] md:max-h-[40vh] bg-white rounded-xl p-3 sm:p-4 md:p-6 flex flex-col shadow-[0_4px_20px_rgba(0,0,0,0.1)] min-w-0">
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


