import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../context/useInventory';
import ProductTile from '../components/ProductTile';
import Cart from '../components/Cart';
import Modal from '../components/Modal';
import EditProductModal from '../components/EditProductModal';
import ConfirmDialog from '../components/ConfirmDialog';
import MenuDropdown from '../components/MenuDropdown';
import { ToastContainer } from '../components/Toast';

const POSPage = () => {
  const { products, loading, error, logoutUser, user, updateProduct, deleteProduct, addProduct } = useInventory();
  const [cart, setCart] = useState([]);
  const [showCartModal, setShowCartModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showDesktopMenu, setShowDesktopMenu] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [viewDetailsProduct, setViewDetailsProduct] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [deletedProductBackup, setDeletedProductBackup] = useState(null);
  const [cartBadgeBounce, setCartBadgeBounce] = useState(false);
  const navigate = useNavigate();
  const mobileMenuRef = useRef(null);
  const desktopMenuRef = useRef(null);
  const toastIdCounter = useRef(0);

  // Get unique categories from products
  const categories = ['All', ...new Set(products.map(p => p.category || 'Uncategorized'))];
  
  // Filter products by category and search query
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'All' || (p.category || 'Uncategorized') === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setShowMobileMenu(false);
      }
      if (desktopMenuRef.current && !desktopMenuRef.current.contains(event.target)) {
        setShowDesktopMenu(false);
      }
    };

    if (showMobileMenu || showDesktopMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMobileMenu, showDesktopMenu]);

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
        
        // Trigger cart badge bounce
        setCartBadgeBounce(true);
        setTimeout(() => setCartBadgeBounce(false), 500);
        
        // Show toast notification
        addToast(`${product.name} quantity increased`, 'success', 2000);
        
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Trigger cart badge bounce
        setCartBadgeBounce(true);
        setTimeout(() => setCartBadgeBounce(false), 500);
        
        // Show toast notification
        addToast(`${product.name} added to cart`, 'success', 2000);
        
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
    <div className="h-dvh w-full flex flex-col bg-gradient-to-br from-[#667eea] to-[#764ba2] overflow-hidden">
      {/* Compact Header - Only on mobile for Cart & Menu */}
      <div className="lg:hidden bg-white/95 px-2 sm:px-3 py-1.5 sm:py-2 shadow-md z-50 flex justify-between items-center gap-2 flex-shrink-0">
        {user && (
          <span className="hidden sm:inline text-xs text-gray-700 bg-blue-50 px-2 py-1 rounded-md border border-blue-200 whitespace-nowrap truncate max-w-[100px]">
            <strong>{user.username}</strong>
          </span>
        )}
        <div className="flex items-center gap-2 ml-auto">
          {/* Cart Icon Button */}
          <button
            className="relative p-2 bg-white border-2 border-gray-300 rounded-lg cursor-pointer transition-all hover:border-primary hover:shadow-md active:scale-95 w-11 h-11 flex items-center justify-center"
            onClick={() => setShowCartModal(true)}
            aria-label="View Cart"
          >
            <span className="text-xl sm:text-2xl">🛒</span>
            {cartItemCount > 0 && (
              <span className={`absolute -top-1 -right-1 bg-red-500 text-white text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full min-w-[18px] sm:min-w-[20px] text-center font-bold shadow-md transition-transform ${
                cartBadgeBounce ? 'animate-bounce-scale' : ''
              }`}>
                {cartItemCount}
              </span>
            )}
          </button>
          {/* Menu Button */}
          <div className="relative z-[100]" ref={mobileMenuRef}>
            <button
              className="px-2.5 sm:px-3 py-1.5 bg-gray-600 text-white border-none rounded-lg font-semibold cursor-pointer shadow-md transition-all hover:shadow-lg active:scale-95 text-xs sm:text-sm min-w-11 min-h-11 flex items-center justify-center"
              onClick={() => {
                console.log('Mobile menu button clicked, current state:', showMobileMenu);
                setShowMobileMenu(!showMobileMenu);
              }}
            >
              ☰ <span className="hidden xs:inline ml-1">Menu</span>
            </button>
            <MenuDropdown 
              isOpen={showMobileMenu}
              onClose={() => setShowMobileMenu(false)}
              logoutUser={logoutUser}
            />
          </div>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden gap-2 p-2 lg:p-3 flex-col lg:flex-row max-w-full min-h-0">
        <div className="flex-[1_1_auto] lg:flex-[0_0_70%] min-h-0 bg-white rounded-xl overflow-hidden shadow-lg flex flex-col max-w-full">
          {/* Search and Category Filter - Sticky */}
          <div className="sticky top-0 bg-white z-10 px-2 sm:px-3 pt-2 sm:pt-3 pb-2 border-b border-gray-200 flex-shrink-0 space-y-2">
            {/* Search Bar */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base sm:text-lg">🔍</span>
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-3 py-1.5 sm:py-2 bg-gray-50 border-2 border-transparent rounded-lg text-base transition-all focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
            
            {/* Category Pills */}
            <div className="flex gap-1.5 sm:gap-2 flex-wrap">
              {categories.map(category => (
                <button
                  key={category}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold cursor-pointer transition-all ${
                    selectedCategory === category
                      ? 'bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          {/* Scrollable Products Grid */}
          <div className="flex-1 overflow-y-auto px-2 sm:px-3 py-2 sm:py-3">
            {loading && (
              <div className="text-center p-6 text-gray-600 text-base sm:text-lg">Loading products...</div>
            )}
            {error && (
              <div className="text-center p-4 bg-red-50 text-red-700 rounded-lg my-2 border border-red-200 text-sm">
                Error loading products: {error}. Please make sure the API server is running.
              </div>
            )}
            {!loading && !error && (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(130px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(140px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2 sm:gap-2.5">
                {filteredProducts.length === 0 ? (
                  <div className="text-center p-8 text-gray-400 text-base col-span-full">No products available</div>
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
        <div className="hidden lg:flex flex-[0_0_30%] bg-white rounded-xl p-3 flex-col shadow-lg min-w-0 relative">
          {/* Menu Button for Desktop - Top Right Corner */}
          <div className="absolute top-2 right-2 z-10" ref={desktopMenuRef}>
            <button
              className="p-2 bg-gray-600 text-white border-none rounded-lg font-semibold cursor-pointer shadow-md transition-all hover:shadow-lg active:scale-95 min-w-10 min-h-10 flex items-center justify-center"
              onClick={() => {
                console.log('Desktop menu button clicked, current state:', showDesktopMenu);
                setShowDesktopMenu(!showDesktopMenu);
              }}
              title="Menu"
            >
              ☰
            </button>
            <MenuDropdown 
              isOpen={showDesktopMenu}
              onClose={() => setShowDesktopMenu(false)}
              logoutUser={logoutUser}
            />
          </div>
          
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


