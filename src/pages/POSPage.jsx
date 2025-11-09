import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../context/useInventory';
import ProductTile from '../components/ProductTile';
import Cart from '../components/Cart';
import Modal from '../components/Modal';
import EditProductModal from '../components/EditProductModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { ToastContainer } from '../components/Toast';

const POSPage = () => {
  const { products, loading, error, logoutUser, user, updateProduct, deleteProduct, addProduct } = useInventory();
  const [cart, setCart] = useState([]);
  const [showCartModal, setShowCartModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [viewDetailsProduct, setViewDetailsProduct] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [deletedProductBackup, setDeletedProductBackup] = useState(null);
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const toastIdCounter = useRef(0);

  // Get unique categories from products
  const categories = ['All', ...new Set(products.map(p => p.category || 'Uncategorized'))];
  
  // Filter products by category
  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => (p.category || 'Uncategorized') === selectedCategory);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

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
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Toast management
  const addToast = (message, type = 'success', duration = 3000, onUndo = null, undoLabel = 'Undo') => {
    const id = toastIdCounter.current++;
    setToasts(prev => [...prev, { id, message, type, duration, onUndo, undoLabel }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Product management handlers
  const handleEditProduct = (product) => {
    setEditingProduct(product);
  };

  const handleSaveProduct = async (productId, updatedData) => {
    try {
      await updateProduct(productId, updatedData);
      addToast('Product updated successfully', 'success');
    } catch (error) {
      addToast(error.message || 'Failed to update product', 'error');
      throw error;
    }
  };

  const handleDeleteProduct = (product) => {
    setDeletingProduct(product);
  };

  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    
    try {
      // Backup product for undo
      setDeletedProductBackup(deletingProduct);
      
      await deleteProduct(deletingProduct.id);
      
      // Show success toast with undo option (5 seconds)
      addToast(
        `"${deletingProduct.name}" deleted`,
        'success',
        5000,
        handleUndoDelete,
        'Undo'
      );
      
      setDeletingProduct(null);
    } catch (error) {
      addToast(error.message || 'Failed to delete product', 'error');
    }
  };

  const handleUndoDelete = async () => {
    if (!deletedProductBackup) return;
    
    try {
      // Re-add the deleted product (without id since it will be assigned by the server)
      const { id, ...productData } = deletedProductBackup;
      await addProduct(productData);
      addToast(`"${deletedProductBackup.name}" restored`, 'success');
      setDeletedProductBackup(null);
    } catch (error) {
      addToast('Failed to restore product', 'error');
    }
  };

  const handleViewDetails = (product) => {
    setViewDetailsProduct(product);
  };

  return (
    <div className="h-screen w-full flex flex-col bg-gradient-to-br from-[#667eea] to-[#764ba2] overflow-hidden">
      <div className="bg-white/95 px-2 sm:px-4 md:px-6 py-2 sm:py-3 shadow-[0_2px_10px_rgba(0,0,0,0.1)] z-50 relative flex justify-between items-center gap-2">
        <div className="flex flex-col min-w-0 flex-shrink">
          <h1 className="m-0 text-base sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 truncate">Pinoy POS</h1>
          <p className="mt-0.5 sm:mt-1 mb-0 text-gray-600 text-[10px] sm:text-xs md:text-sm truncate">Point of Sale System</p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 flex-shrink-0">
          {user && (
            <span className="hidden sm:inline text-xs md:text-sm text-gray-700 bg-blue-50 px-2 md:px-2.5 py-1 md:py-1.5 rounded-md border border-blue-200 whitespace-nowrap">
              Signed in as <strong>{user.username}</strong>{user.role ? ` (${user.role})` : ''}
            </span>
          )}
          {/* Cart Icon Button */}
          <button
            className="lg:hidden relative p-2 bg-white border-2 border-gray-300 rounded-lg cursor-pointer transition-all hover:border-primary hover:shadow-md active:scale-95 min-w-11 min-h-11 flex items-center justify-center"
            onClick={() => setShowCartModal(true)}
            aria-label="View Cart"
          >
            <span className="text-xl sm:text-2xl">🛒</span>
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full min-w-[18px] sm:min-w-[20px] text-center font-bold shadow-md">
                {cartItemCount}
              </span>
            )}
          </button>
          {/* Menu Button */}
          <div className="relative" ref={menuRef}>
            <button
              className="px-2.5 sm:px-3 py-1.5 bg-gray-600 text-white border-none rounded-lg font-semibold cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)] active:translate-y-0 text-xs sm:text-sm md:text-base min-w-[44px] min-h-[44px] flex items-center justify-center"
              onClick={() => setShowMenu(!showMenu)}
            >
              ☰ <span className="hidden xs:inline ml-1">Menu</span>
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-44 sm:w-56 bg-white rounded-lg shadow-[0_8px_30px_rgba(0,0,0,0.2)] border border-gray-200 z-9999">
                <div className="py-2">
                  <div className="px-3 sm:px-4 py-2 text-responsive-xs font-semibold text-gray-500 uppercase whitespace-nowrap overflow-hidden text-ellipsis">Inventory</div>
                  <button
                    className="w-full text-left px-3 sm:px-4 py-2.5 hover:bg-gray-100 transition-colors text-gray-700 border-none bg-transparent cursor-pointer text-responsive-sm"
                    onClick={() => {
                      setShowMenu(false);
                      navigate('/add-product');
                    }}
                  >
                    ➕ Add Product
                  </button>
                  <button
                    className="w-full text-left px-3 sm:px-4 py-2.5 hover:bg-gray-100 transition-colors text-gray-700 border-none bg-transparent cursor-pointer text-responsive-sm"
                    onClick={() => {
                      setShowMenu(false);
                      navigate('/products-management');
                    }}
                  >
                    📋 Manage All Products
                  </button>
                  <div className="border-t border-gray-200 my-2"></div>
                  <button
                    className="w-full text-left px-3 sm:px-4 py-2.5 hover:bg-red-50 transition-colors text-red-600 border-none bg-transparent cursor-pointer text-responsive-sm font-semibold"
                    onClick={() => {
                      setShowMenu(false);
                      logoutUser();
                      navigate('/');
                    }}
                  >
                    🚪 Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden gap-2 sm:gap-4 p-2 sm:p-4 flex-col lg:flex-row">
        <div className="flex-[1_1_auto] lg:flex-[0_0_70%] min-h-[45vh] sm:min-h-[50vh] md:min-h-[50vh] bg-white rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.1)] flex flex-col">
          {/* Sticky Products Header */}
          <div className="sticky top-0 bg-white z-10 p-3 sm:p-4 md:p-6 border-b border-gray-200">
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center border-b-2 border-[#667eea] pb-2">
                <h2 className="m-0 text-gray-800 text-lg sm:text-xl md:text-2xl">Products</h2>
              </div>
              {/* Category Filter */}
              <div className="flex gap-2 flex-wrap">
                {categories.map(category => (
                  <button
                    key={category}
                    className={`px-3 py-1.5 border-2 rounded-lg text-sm font-semibold cursor-pointer transition-all ${
                      selectedCategory === category
                        ? 'bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white border-[#667eea] shadow-[0_2px_8px_rgba(102,126,234,0.3)]'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-[#667eea] hover:text-[#667eea]'
                    }`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {/* Scrollable Products Grid */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
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
                {filteredProducts.length === 0 ? (
                  <div className="text-center p-12 text-gray-400 text-lg col-span-full">No products available</div>
                ) : (
                  filteredProducts.map(product => (
                    <ProductTile
                      key={product.id}
                      product={product}
                      onAddToCart={() => addToCart(product)}
                      onEdit={handleEditProduct}
                      onDelete={handleDeleteProduct}
                      onViewDetails={handleViewDetails}
                      userRole={user?.role}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Desktop Cart - hidden on mobile/tablet */}
        <div className="hidden lg:flex flex-[0_0_30%] bg-white rounded-xl p-3 sm:p-4 md:p-6 flex-col shadow-[0_4px_20px_rgba(0,0,0,0.1)] min-w-0">
          <Cart
            cart={cart}
            onRemove={removeFromCart}
            onUpdateQuantity={updateQuantity}
            totalPrice={totalPrice}
            onCheckout={handleCheckout}
          />
        </div>
      </div>

      {/* Mobile Cart Modal */}
      <Modal 
        isOpen={showCartModal} 
        onClose={() => setShowCartModal(false)}
        title="Your Cart"
      >
        <Cart
          cart={cart}
          onRemove={removeFromCart}
          onUpdateQuantity={updateQuantity}
          totalPrice={totalPrice}
          onCheckout={() => {
            setShowCartModal(false);
            handleCheckout();
          }}
        />
      </Modal>

      {/* Edit Product Modal */}
      <EditProductModal
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        product={editingProduct}
        onSave={handleSaveProduct}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingProduct}
        onClose={() => setDeletingProduct(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Product"
        message="Are you sure you want to delete this product? You'll have 5 seconds to undo."
        productName={deletingProduct?.name}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* View Details Modal */}
      <Modal
        isOpen={!!viewDetailsProduct}
        onClose={() => setViewDetailsProduct(null)}
        title="Product Details"
      >
        {viewDetailsProduct && (
          <div className="flex-1 flex flex-col gap-4">
            <div className="text-center text-6xl sm:text-5xl mb-4">
              {viewDetailsProduct.image}
            </div>
            <div className="space-y-3">
              <div className="flex justify-between border-b pb-2 text-base sm:text-sm">
                <span className="font-semibold text-gray-600">Name:</span>
                <span className="text-gray-800 break-words text-right ml-2">{viewDetailsProduct.name}</span>
              </div>
              <div className="flex justify-between border-b pb-2 text-base sm:text-sm">
                <span className="font-semibold text-gray-600">Price:</span>
                <span className="text-gray-800">₱{viewDetailsProduct.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b pb-2 text-base sm:text-sm">
                <span className="font-semibold text-gray-600">Stock:</span>
                <span className="text-gray-800">{viewDetailsProduct.stock}</span>
              </div>
              <div className="flex justify-between border-b pb-2 text-base sm:text-sm">
                <span className="font-semibold text-gray-600">Category:</span>
                <span className="text-gray-800">{viewDetailsProduct.category || 'Uncategorized'}</span>
              </div>
              <div className="flex justify-between border-b pb-2 text-base sm:text-sm">
                <span className="font-semibold text-gray-600">Product ID:</span>
                <span className="text-gray-800">{viewDetailsProduct.id}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default POSPage;


